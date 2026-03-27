import type {ActionFunctionArgs} from 'react-router';
import {handleFileDelete, handleFileUpload} from '~/lib/files.server';

export type FileUploadAction = typeof action;

export async function action({context, request}: ActionFunctionArgs) {
  const {env} = context;
  const connectionData = {
    serviceRole: env.SUPABASE_SERVICE_ROLE,
    supabaseUrl: env.SUPABASE_URL,
  };

  const formData = await request.clone().formData();
  const intent = formData.get('intent');
  const fileUrl = formData.get('url');

  switch (intent) {
    case 'upload':
      return await handleFileUpload(request, connectionData);
    case 'delete':
      if (typeof fileUrl !== 'string') {
        return Response.json(
          {error: 'File URL not found'},
          {status: 400},
        );
      }
      return await handleFileDelete(fileUrl, connectionData);
    default:
      return Response.json(
        {error: 'Invalid intent'},
        {status: 400},
      );
  }
}
