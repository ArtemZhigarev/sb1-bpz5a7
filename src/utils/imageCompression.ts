import imageCompression from 'browser-image-compression';

const MAX_SIZE_MB = 5;
const MAX_WIDTH_OR_HEIGHT = 2048;

export const compressImage = async (
  file: File,
  onProgress?: (progress: number) => void
): Promise<File> => {
  const fileSizeMB = file.size / (1024 * 1024);
  
  // Log initial file details
  console.log('Processing image:', {
    fileName: file.name,
    fileSize: `${fileSizeMB.toFixed(2)}MB`,
    fileType: file.type,
    dimensions: await getImageDimensions(file)
  });
  
  // If file is under MAX_SIZE_MB, return it as is
  if (fileSizeMB <= MAX_SIZE_MB) {
    console.log('Image size within limits, skipping compression');
    onProgress?.(100);
    return file;
  }

  const options = {
    maxSizeMB: MAX_SIZE_MB - 0.1, // Slightly under limit to ensure we're safely under
    maxWidthOrHeight: MAX_WIDTH_OR_HEIGHT,
    useWebWorker: true,
    onProgress: (progress: number) => {
      console.log(`Compression progress: ${Math.round(progress * 100)}%`);
      onProgress?.(progress * 100);
    },
  };

  try {
    console.log('Starting compression with options:', {
      maxSizeMB: options.maxSizeMB,
      maxWidthOrHeight: options.maxWidthOrHeight
    });

    const compressedFile = await imageCompression(file, options);
    const compressedSizeMB = compressedFile.size / (1024 * 1024);
    
    const compressionStats = {
      fileName: file.name,
      originalSize: `${fileSizeMB.toFixed(2)}MB`,
      compressedSize: `${compressedSizeMB.toFixed(2)}MB`,
      compressionRatio: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`,
      originalDimensions: await getImageDimensions(file),
      compressedDimensions: await getImageDimensions(compressedFile)
    };
    
    console.log('Compression complete:', compressionStats);

    // Verify the compressed file is actually smaller
    if (compressedSizeMB > fileSizeMB) {
      console.warn('Compression resulted in larger file, using original');
      return file;
    }

    // Verify the compressed file is under the max size
    if (compressedSizeMB > MAX_SIZE_MB) {
      throw new Error(`Compressed image still exceeds ${MAX_SIZE_MB}MB limit`);
    }

    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', {
      fileName: file.name,
      fileSize: `${fileSizeMB.toFixed(2)}MB`,
      fileType: file.type,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw new Error(`Failed to compress image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to get image dimensions
const getImageDimensions = async (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height
      });
    };
    img.src = URL.createObjectURL(file);
  });
};