import {CloudUpload, CheckCircle, Trash2} from 'lucide-react';
import React, {useState, useCallback, useEffect, useMemo} from 'react';

import {useFetcher} from 'react-router';

type FileUploadResponse = {
  success?: boolean;
  fileName?: string;
  error?: string;
};
import {LogoUploadGuide} from './logo-upload-guide';
import {Spinner} from '../generic/spinner';

export interface FileWithPreview extends File {
  preview: string;
}

const FileUploadDropzone = ({
  uploadedFileUrl,
  setUploadedFileUrl,
  file,
  setFile,
}: {
  uploadedFileUrl: string;
  setUploadedFileUrl: React.Dispatch<React.SetStateAction<string>>;
  file: FileWithPreview | null;
  setFile: React.Dispatch<React.SetStateAction<FileWithPreview | null>>;
}) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const fetcher = useFetcher<FileUploadResponse>();

  const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB
  const ALLOWED_FILE_TYPES = useMemo(
    () => ['image/svg+xml', 'image/png', 'application/pdf'],
    [],
  );

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        return 'File type not supported. Please upload SVG, PDF or PNG.';
      }

      if (file.size > MAX_FILE_SIZE) {
        return 'File size too large. Maximum size is 8MB.';
      }

      return null;
    },
    [ALLOWED_FILE_TYPES, MAX_FILE_SIZE],
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setError('');
      setUploadSuccess(false);

      // Take only the first file if multiple are dropped
      const newFile = acceptedFiles[0];

      if (!newFile) return;

      // Validate the file
      const validationError = validateFile(newFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Revoke previous object URL if there is one
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }

      // Create preview URL for the file
      const fileWithPreview = Object.assign(newFile, {
        preview: URL.createObjectURL(newFile),
      }) as FileWithPreview;

      setFile(fileWithPreview);
      setIsUploading(true);

      try {
        // Create FormData and append the file
        const formData = new FormData();
        formData.append('file', newFile);
        formData.append('intent', 'upload');

        // Use the fetcher to submit the form
        fetcher.submit(formData, {
          method: 'post',
          action: '/api/file-upload',
          encType: 'multipart/form-data',
        });

        // The upload status will be tracked by the useEffect watching fetcher state
      } catch (err) {
        console.error('Client-side upload error:', err);
        setError(err instanceof Error ? err.message : 'Failed to upload file');
        setIsUploading(false);
      }
    },
    [validateFile, file?.preview, setFile, fetcher],
  );

  const removeFile = (): void => {
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setFile(null);
    setError('');
    setUploadSuccess(false);
    setIsUploading(false);
    setUploadedFileUrl('');
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop([e.dataTransfer.files[0]]); // Just pass the first file
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>): void => {
    if (e.target.files && e.target.files.length > 0) {
      onDrop([e.target.files[0]]); // Just pass the first file
    }

    // Reset the input value so the same file can be selected again if needed
    if (e.target) {
      e.target.value = '';
    }
  };

  const renderFilePreview = (file: FileWithPreview): React.ReactNode => {
    if (file.type === 'application/pdf') {
      return (
        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-red-100 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    } else if (file.type.startsWith('image/')) {
      return (
        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
          <img
            src={file.preview}
            alt={file.name}
            className="w-full h-full object-cover"
          />
        </div>
      );
    } else {
      return (
        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      );
    }
  };

  // Monitor fetcher state to update component state
  useEffect(() => {
    if (isUploading) {
      if (fetcher.state === 'idle') {
        // Upload completed
        if (fetcher.data && 'success' in fetcher.data && fetcher.data.success) {
          setUploadSuccess(true);
          if ('fileName' in fetcher.data) {
            setUploadedFileUrl(fetcher.data.fileName as string);
          }
          setIsUploading(false);
        } else if (fetcher.data && 'error' in fetcher.data) {
          setError(fetcher.data.error as string);
          setIsUploading(false);
        }
      }
    }
  }, [fetcher.state, fetcher.data, isUploading, setUploadedFileUrl]);

  // Clean up previews when component unmounts
  useEffect(() => {
    return () => {
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
    };
  }, [file]);

  return (
    <div className="w-full">
      <div>
        {file ? (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {isUploading ? 'Uploading file...' : 'Uploaded file (1/1)'}
            </h3>
            <div
              className={`flex justify-between items-center p-2 rounded-md border ${
                isUploading
                  ? 'bg-blue-50 border-blue-200'
                  : uploadSuccess
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between w-full space-x-2">
                <div className="flex-1 flex items-center space-x-2">
                  {renderFilePreview(file)}
                  <span className="text-sm text-gray-700 truncate max-w-xs">
                    {file.name}
                  </span>
                  {isUploading && <Spinner className="h-4 w-4 text-blue-500" />}
                  {uploadSuccess && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <DeleteFileButton
                  file={file}
                  removeFile={removeFile}
                  isUploading={isUploading}
                  uploadedFileUrl={uploadedFileUrl}
                />
              </div>
            </div>
          </div>
        ) : (
          <div
            role="button"
            tabIndex={0}
            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : error
                ? 'border-red-500 bg-red-50'
                : file
                ? 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={!file && !isUploading ? handleDragEnter : undefined}
            onDragOver={!file && !isUploading ? handleDragOver : undefined}
            onDragLeave={!file && !isUploading ? handleDragLeave : undefined}
            onDrop={!file && !isUploading ? handleDrop : undefined}
            onClick={() =>
              !file && !isUploading && fileInputRef.current?.click()
            }
            onKeyDown={(e) => {
              if (
                !file &&
                !isUploading &&
                (e.key === 'Enter' || e.key === ' ')
              ) {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label={
              'Upload file dropzone. Click or drag and drop a file here.'
            }
            aria-disabled={!!file || isUploading}
          >
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                <CloudUpload
                  className={`size-5 ${
                    file ? 'text-gray-400' : 'text-primary'
                  }`}
                />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-gray-700">
                  Upload your logo here
                </p>
                <p className="text-xs text-gray-500">SVG, PDF or PNG</p>
              </div>
            </div>
          </div>
        )}
        <input
          id="fileInput"
          name="file"
          type="file"
          className="hidden"
          onChange={handleFileInput}
          accept=".svg,.png,.pdf"
          ref={fileInputRef}
          disabled={!!file || isUploading}
        />
      </div>

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}

      <div className="mt-1 text-xs text-gray-500">
        Not sure how to upload your logo? <LogoUploadGuide /> for the best
        results.
      </div>

      {!file && (
        <div className="mt-2 text-xs">
          Note: If you choose to not upload your logo, after placing your order,
          we will reach out to gather the logo files from you and check them for
          print. Keep in mind that this may delay the production time of your
          order.
        </div>
      )}
    </div>
  );
};

export default FileUploadDropzone;

function DeleteFileButton({
  file,
  removeFile,
  isUploading,
  uploadedFileUrl,
}: {
  file: FileWithPreview;
  removeFile: () => void;
  isUploading: boolean;
  uploadedFileUrl: string;
}) {
  const fetcher = useFetcher<FileUploadResponse>();
  useEffect(() => {
    if (
      fetcher.state === 'submitting' &&
      fetcher.formData?.get('intent') === 'delete'
    ) {
      removeFile();
    }
  }, [fetcher.state, fetcher.data, removeFile, fetcher.formData]);

  return (
    <fetcher.Form
      method="post"
      action="/api/file-upload"
      encType="multipart/form-data"
      className="ml-auto flex"
    >
      <input type="hidden" name="intent" value="delete" />
      <input type="hidden" name="url" value={uploadedFileUrl} />
      <button
        className="text-red-500 hover:text-red-700 focus:outline-none"
        aria-label={`Remove ${file.name}`}
        type="submit"
        disabled={isUploading}
      >
        <Trash2 className={`w-5 h-5 ${isUploading ? 'opacity-50' : ''}`} />
      </button>
    </fetcher.Form>
  );
}
