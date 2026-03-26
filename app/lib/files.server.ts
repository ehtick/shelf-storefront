import {
  json,
  unstable_composeUploadHandlers,
  unstable_parseMultipartFormData,
} from '@remix-run/server-runtime';
import {getSupabaseAdmin} from './supabase.server';

// Define interfaces for better type safety
interface ResizeOptions {
  width?: number;
  height?: number;
  fit?: string;
  // Add other resize options as needed
}

export interface ConnectionData {
  serviceRole: string;
  supabaseUrl: string;
}

interface UploadOptions {
  filename: string;
  contentType: string;
  resizeOptions?: ResizeOptions;
}

interface FileFormDataParams {
  request: Request;
  newFileName: string;
  resizeOptions?: ResizeOptions;
  connectionData: ConnectionData;
}

// Get current date formatted as YYYY-MM-DD
function getCurrentDateFolder(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // Returns YYYY-MM-DD format
}

async function uploadFile(
  fileData: AsyncIterable<Uint8Array>,
  {filename, contentType}: UploadOptions,
  connectionData: ConnectionData,
) {
  try {
    const chunks: Uint8Array[] = [];
    for await (const chunk of fileData) chunks.push(chunk);

    // Calculate total length
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);

    // Create a single Uint8Array
    const file = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      file.set(chunk, offset);
      offset += chunk.length;
    }

    const supabase = getSupabaseAdmin(
      connectionData.serviceRole,
      connectionData.supabaseUrl,
    );

    const {data, error} = await supabase.storage
      .from('store-files')
      .upload(filename, file, {contentType, upsert: true});

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
    // Rethrow with more specific info if possible
    if (cause instanceof Error) {
      throw new Error(`File upload failed: ${cause.message}`, {cause});
    }
    throw new Error(
      'Something went wrong while uploading the file. Please try again or contact support.',
      {cause},
    );
  }
}

export async function parseFileFormData({
  request,
  newFileName,
  connectionData,
}: FileFormDataParams): Promise<FormData> {
  try {
    const uploadHandler = unstable_composeUploadHandlers(
      async ({contentType, data, filename}) => {
        const allowedContentTypes = [
          'image/png',
          'image/svg+xml',
          'application/pdf',
        ];

        if (!contentType || !allowedContentTypes.includes(contentType) || !filename) {
          return undefined;
        }

        const fileExtension = filename.split('.').pop();
        const uploadedFilePath = await uploadFile(
          data,
          {
            filename: `${getCurrentDateFolder()}/${newFileName}.${fileExtension}`,
            contentType,
          },
          connectionData,
        );

        return uploadedFilePath;
      },
    );

    const formData = await unstable_parseMultipartFormData(
      request,
      uploadHandler,
    );
    return formData;
  } catch (cause) {
    console.error('Error parsing form data:', cause);
    throw new Error(
      'Something went wrong while uploading the file. Please try again or contact support.',
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
  const match = url.split('?')[0].match(regex); // split the url at '?' and take the first part
  if (match) {
    const path = `${match[1]}/${match[2]}/${match[3]}`;
    return path;
  }
};

export async function handleFileUpload(
  request: Request,
  connectionData: ConnectionData,
) {
  const fileFormData = await parseFileFormData({
    request,
    newFileName: `customer-logo-${Date.now()}`,
    connectionData,
  });
  const file = fileFormData.get('file');

  if (!file) {
    return json(
      {error: 'File not found'},
      {status: 400, headers: new Headers()},
    );
  }

  return json(
    {success: true, fileName: file},
    {status: 200, headers: new Headers()},
  );
}

export async function handleFileDelete(
  url: string,
  connectionData: ConnectionData,
) {
  await deleteImage({url, connectionData});
  return json(
    {success: true, message: 'File deleted successfully'},
    {status: 200, headers: new Headers()},
  );
}
