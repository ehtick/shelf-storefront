import {getSupabaseAdmin} from './supabase.server';

export interface ConnectionData {
  serviceRole: string;
  supabaseUrl: string;
}

const ALLOWED_CONTENT_TYPES = [
  'image/png',
  'image/svg+xml',
  'application/pdf',
];

// Get current date formatted as YYYY-MM-DD
function getCurrentDateFolder(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

async function uploadFileToSupabase(
  fileData: Uint8Array,
  filename: string,
  contentType: string,
  connectionData: ConnectionData,
) {
  try {
    const supabase = getSupabaseAdmin(
      connectionData.serviceRole,
      connectionData.supabaseUrl,
    );

    const {data, error} = await supabase.storage
      .from('store-files')
      .upload(filename, fileData, {contentType, upsert: true});

    if (error) {
      console.error('Supabase upload error:', JSON.stringify(error));
      throw error;
    }

    return getPublicFileURL({
      filename: data.path,
      connectionData,
    });
  } catch (cause) {
    console.error('Full upload error:', cause);
    if (cause instanceof Error) {
      throw new Error(`File upload failed: ${cause.message}`, {cause});
    }
    throw new Error(
      'Something went wrong while uploading the file. Please try again or contact support.',
      {cause},
    );
  }
}

export function getPublicFileURL({
  filename,
  connectionData,
}: {
  filename: string;
  connectionData: ConnectionData;
}) {
  try {
    const {data} = getSupabaseAdmin(
      connectionData.serviceRole,
      connectionData.supabaseUrl,
    )
      .storage.from('store-files')
      .getPublicUrl(filename);

    return data.publicUrl;
  } catch (cause) {
    throw new Error('Failed to get public file URL', {cause});
  }
}

export async function deleteImage({
  url,
  connectionData,
}: {
  url: string;
  connectionData: ConnectionData;
}) {
  try {
    const filePath = url.split(`store-files/`)[1];
    const {error} = await getSupabaseAdmin(
      connectionData.serviceRole,
      connectionData.supabaseUrl,
    )
      .storage.from('store-files')
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;
  } catch (cause) {
    throw new Error('Fail to delete the asset image', {cause});
  }
}

export const extractImageNameFromSupabaseUrl = (url: string) => {
  const regex = new RegExp(
    `\\/store-files\\/([a-f0-9-]+)\\/([a-z0-9]+)\\/([a-z0-9\\-]+\\.[a-z]{3,4})`,
    'i',
  );
  const match = url.split('?')[0].match(regex);
  if (match) {
    const path = `${match[1]}/${match[2]}/${match[3]}`;
    return path;
  }
};

export async function handleFileUpload(
  request: Request,
  connectionData: ConnectionData,
) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return Response.json(
        {error: 'File not found'},
        {status: 400},
      );
    }

    const contentType = file.type;
    if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
      return Response.json(
        {error: 'File type not supported'},
        {status: 400},
      );
    }

    const fileExtension = file.name.split('.').pop();
    const newFileName = `customer-logo-${Date.now()}`;
    const filename = `${getCurrentDateFolder()}/${newFileName}.${fileExtension}`;

    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    const publicUrl = await uploadFileToSupabase(
      fileData,
      filename,
      contentType,
      connectionData,
    );

    return Response.json(
      {success: true, fileName: publicUrl},
      {status: 200},
    );
  } catch (cause) {
    console.error('Error uploading file:', cause);
    return Response.json(
      {error: 'Something went wrong while uploading the file. Please try again or contact support.'},
      {status: 500},
    );
  }
}

export async function handleFileDelete(
  url: string,
  connectionData: ConnectionData,
) {
  await deleteImage({url, connectionData});
  return Response.json(
    {success: true, message: 'File deleted successfully'},
    {status: 200},
  );
}
