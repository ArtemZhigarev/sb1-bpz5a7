import React, { useState } from 'react';
import { Upload, RefreshCw, AlertCircle } from 'lucide-react';
import { uploadImageToAirtable } from '../services/imageUpload';
import { useSettingsStore } from '../store/settingsStore';
import toast from 'react-hot-toast';

interface ImageUploadButtonProps {
  taskId: string;
  onUploadComplete: (imageUrl: string) => void;
  disabled?: boolean;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'compressing' | 'uploading' | 'complete' | 'error';
  message?: string;
  originalSize?: number;
  currentSize?: number;
  compressedSize?: number;
  error?: string;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  taskId,
  onUploadComplete,
  disabled = false
}) => {
  const { darkMode } = useSettingsStore();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);

  const formatSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const updateProgress = (
    fileName: string,
    progress: number,
    status: UploadProgress['status'],
    message?: string,
    sizes?: {
      originalSize?: number;
      currentSize?: number;
      compressedSize?: number;
    },
    error?: string
  ) => {
    setUploadProgress(prev => {
      const existing = prev.find(p => p.fileName === fileName);
      if (existing) {
        return prev.map(p => 
          p.fileName === fileName 
            ? { 
                ...p, 
                progress, 
                status, 
                message,
                error,
                ...sizes
              }
            : p
        );
      }
      return [...prev, { 
        fileName, 
        progress, 
        status, 
        message,
        error,
        ...sizes
      }];
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress([]);

    for (const file of files) {
      try {
        if (!file.type.startsWith('image/')) {
          updateProgress(
            file.name,
            0,
            'error',
            'Invalid file type. Only images are allowed.',
            undefined,
            'Invalid file type'
          );
          continue;
        }

        // Initialize progress with original file size
        updateProgress(
          file.name, 
          0, 
          'uploading', 
          undefined, 
          { originalSize: file.size }
        );

        const result = await uploadImageToAirtable(
          file,
          taskId,
          (progress: number, status: 'compressing' | 'uploading', message?: string, currentSize?: number, compressedSize?: number) => {
            updateProgress(
              file.name, 
              progress, 
              status, 
              message, 
              { 
                originalSize: file.size,
                currentSize,
                compressedSize
              }
            );
          }
        );

        updateProgress(
          file.name, 
          100, 
          'complete', 
          undefined,
          { 
            originalSize: file.size,
            compressedSize: file.size // Will be updated if compression occurred
          }
        );

        onUploadComplete(result.url);

      } catch (error) {
        console.error('Image upload error:', {
          file: file.name,
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack
          } : 'Unknown error',
          timestamp: new Date().toISOString()
        });

        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        updateProgress(
          file.name, 
          0, 
          'error', 
          errorMessage,
          { originalSize: file.size },
          errorMessage
        );

        toast.error(errorMessage, {
          duration: 10000,
          style: {
            borderLeft: '4px solid #ef4444',
            padding: '16px',
            color: darkMode ? '#fff' : '#1f2937'
          }
        });
      }
    }

    setIsUploading(false);
    event.target.value = '';

    // Keep progress visible for a longer time (2 minutes)
    setTimeout(() => {
      setUploadProgress(prev => prev.filter(p => p.status === 'error'));
    }, 120000);
  };

  return (
    <div className="space-y-4">
      <label className={`block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        darkMode
          ? 'border-gray-700 hover:border-blue-500'
          : 'border-gray-300 hover:border-blue-500'
      } ${(disabled || isUploading) ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          disabled={disabled || isUploading}
          className="hidden"
        />
        {isUploading ? (
          <RefreshCw className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
        ) : (
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        )}
        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Click to upload images or drag & drop
        </p>
        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Supported formats: JPG, PNG, GIF, WebP
        </p>
      </label>

      {uploadProgress.length > 0 && (
        <div className="space-y-3">
          {uploadProgress.map((progress) => (
            <div key={progress.fileName} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                  {progress.fileName}
                </span>
                <span className={`${
                  progress.status === 'error'
                    ? 'text-red-500'
                    : progress.status === 'complete'
                    ? 'text-green-500'
                    : darkMode
                    ? 'text-blue-400'
                    : 'text-blue-600'
                }`}>
                  {progress.status === 'compressing'
                    ? 'Compressing...'
                    : progress.status === 'uploading'
                    ? `Uploading ${progress.progress}%`
                    : progress.status === 'complete'
                    ? 'Complete'
                    : 'Error'}
                </span>
              </div>

              {/* Size information */}
              {progress.originalSize && (
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Original size: {formatSize(progress.originalSize)}
                  {progress.compressedSize && progress.compressedSize !== progress.originalSize && (
                    <> → Compressed: {formatSize(progress.compressedSize)}</>
                  )}
                  {progress.currentSize && (
                    <> • Uploaded: {formatSize(progress.currentSize)}</>
                  )}
                </div>
              )}

              {/* Progress bar */}
              <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                    progress.status === 'error'
                      ? 'bg-red-500'
                      : progress.status === 'complete'
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>

              {/* Error message with icon */}
              {progress.error && (
                <div className={`flex items-start gap-2 p-2 rounded ${
                  darkMode ? 'bg-red-900/20' : 'bg-red-50'
                }`}>
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className={`text-xs ${
                    darkMode ? 'text-red-400' : 'text-red-700'
                  }`}>
                    {progress.error}
                  </p>
                </div>
              )}

              {/* Status message */}
              {progress.message && !progress.error && (
                <p className={`text-xs ${
                  progress.status === 'error'
                    ? 'text-red-500'
                    : darkMode
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }`}>
                  {progress.message}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};