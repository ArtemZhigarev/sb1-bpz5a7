import { env } from '../config/env';
import { compressImage } from '../utils/imageCompression';
import toast from 'react-hot-toast';

interface UploadResult {
  url: string;
  filename: string;
}

interface AirtableErrorResponse {
  error?: {
    message?: string;
    type?: string;
  };
}

type ProgressCallback = (
  progress: number,
  status: 'compressing' | 'uploading',
  message?: string,
  currentSize?: number,
  compressedSize?: number
) => void;

// Define accepted MIME types and extensions
const ACCEPTED_IMAGE_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/jpg', '.jpg'],
  ['image/png', '.png'],
  ['image/gif', '.gif'],
  ['image/webp', '.webp']
]);

const validateUploadParams = (file: File, recordId: string) => {
  if (!env.airtableToken) {
    throw new Error('Airtable API token is not configured');
  }

  if (!env.airtableBase) {
    throw new Error('Airtable base ID is not configured');
  }

  if (!env.airtableTable) {
    throw new Error('Airtable table ID is not configured');
  }

  if (!recordId) {
    throw new Error('Record ID is required for upload');
  }

  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error(`File type ${file.type} is not supported. Accepted types: ${Array.from(ACCEPTED_IMAGE_TYPES.keys()).join(', ')}`);
  }
};

const normalizeFileName = (file: File): string => {
  const extension = ACCEPTED_IMAGE_TYPES.get(file.type);
  if (!extension) {
    throw new Error(`Unsupported file type: ${file.type}`);
  }

  // Remove the original extension and add the normalized one
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  // Remove any special characters and spaces
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');
  return `${sanitizedName}${extension}`;
};

// Convert File to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

const waitForAttachmentProcessing = async (
  recordId: string,
  fieldName: string,
  maxAttempts = 10,
  delayMs = 1000
): Promise<void> => {
  const recordUrl = `https://api.airtable.com/v0/${env.airtableBase}/${env.airtableTable}/${recordId}`;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await fetch(recordUrl, {
      headers: {
        'Authorization': `Bearer ${env.airtableToken}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to check attachment status: ${response.statusText}`);
    }

    const record = await response.json();
    const attachments = record.fields[fieldName] || [];
    
    // Check if the latest attachment has a URL
    const latestAttachment = attachments[attachments.length - 1];
    if (latestAttachment?.url) {
      return;
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  throw new Error('Timed out waiting for attachment to be processed');
};

export const uploadImageToAirtable = async (
  file: File,
  recordId: string,
  onProgress?: ProgressCallback,
  fieldName: string = 'Photos'
): Promise<UploadResult> => {
  try {
    validateUploadParams(file, recordId);

    const maxSize = 5 * 1024 * 1024; // 5MB
    const originalSize = file.size;

    console.log('Starting image upload process:', {
      filename: file.name,
      size: `${(originalSize / (1024 * 1024)).toFixed(2)}MB`,
      type: file.type,
      recordId
    });

    // Process image - compress if needed
    let processedFile = file;
    if (file.size > maxSize) {
      onProgress?.(0, 'compressing', `Compressing ${file.name} (${(originalSize / (1024 * 1024)).toFixed(2)}MB)`, originalSize);

      try {
        processedFile = await compressImage(file, (progress) => {
          onProgress?.(
            progress, 
            'compressing', 
            `Compressing: ${progress.toFixed(0)}%`, 
            originalSize
          );
        });
        
        const compressedSize = processedFile.size;
        const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
        
        console.log('Image compression results:', {
          filename: file.name,
          originalSize: `${(originalSize / (1024 * 1024)).toFixed(2)}MB`,
          compressedSize: `${(compressedSize / (1024 * 1024)).toFixed(2)}MB`,
          compressionRatio: `${compressionRatio}%`
        });

        onProgress?.(
          100, 
          'compressing', 
          `Compressed from ${(originalSize / (1024 * 1024)).toFixed(2)}MB to ${(compressedSize / (1024 * 1024)).toFixed(2)}MB (${compressionRatio}% reduction)`,
          originalSize,
          compressedSize
        );

        // Verify the compressed file is actually smaller and under limit
        if (compressedSize > originalSize || compressedSize > maxSize) {
          throw new Error(`Compression failed to reduce file size below ${(maxSize / (1024 * 1024)).toFixed(1)}MB`);
        }
      } catch (compressionError) {
        console.error('Image compression failed:', compressionError);
        throw new Error(`Failed to compress image: ${compressionError instanceof Error ? compressionError.message : 'Unknown error'}`);
      }
    } else {
      console.log('Image size within limits, skipping compression');
    }

    // Start upload process
    onProgress?.(0, 'uploading', 'Preparing upload...', originalSize, processedFile.size);

    const normalizedFilename = normalizeFileName(processedFile);
    const base64 = await fileToBase64(processedFile);

    // Use the content API endpoint for direct file upload
    const uploadUrl = `https://content.airtable.com/v0/${env.airtableBase}/${recordId}/${fieldName}/uploadAttachment`;
    
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.airtableToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contentType: processedFile.type,
        filename: normalizedFilename,
        file: base64
      })
    });

    if (!uploadResponse.ok) {
      const errorData: AirtableErrorResponse = await uploadResponse.json();
      console.error('Airtable upload failed:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorData
      });

      throw new Error(
        errorData.error?.message || 
        `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`
      );
    }

    onProgress?.(50, 'uploading', 'File uploaded, waiting for processing...', originalSize, processedFile.size);

    // Wait for Airtable to process the attachment
    await waitForAttachmentProcessing(recordId, fieldName);

    // Get the final record with processed attachment
    const recordUrl = `https://api.airtable.com/v0/${env.airtableBase}/${env.airtableTable}/${recordId}`;
    const finalResponse = await fetch(recordUrl, {
      headers: {
        'Authorization': `Bearer ${env.airtableToken}`,
      }
    });

    if (!finalResponse.ok) {
      throw new Error('Failed to get processed attachment');
    }

    const finalRecord = await finalResponse.json();
    const attachments = finalRecord.fields[fieldName] || [];
    const uploadedImage = attachments[attachments.length - 1];

    if (!uploadedImage?.url) {
      throw new Error('No image URL returned from Airtable');
    }

    onProgress?.(100, 'uploading', 'Upload complete!', originalSize, processedFile.size);

    console.log('Upload successful:', {
      filename: uploadedImage.filename,
      url: uploadedImage.url,
      finalSize: `${(processedFile.size / (1024 * 1024)).toFixed(2)}MB`
    });

    return {
      url: uploadedImage.url,
      filename: uploadedImage.filename
    };
  } catch (error) {
    console.error('Image upload error:', {
      file: file.name,
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    throw error;
  }
};