import React from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { compressImage } from '../utils/imageCompression';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  disabled?: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ images, onImagesChange, disabled = false }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newImages = [...images];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      try {
        let processedFile = file;
        if (file.size > maxSize) {
          toast.loading(`Compressing ${file.name}...`, { id: 'compression' });
          processedFile = await compressImage(file);
          toast.success(`Compressed ${file.name}`, { id: 'compression' });
        }

        // Convert to base64 for Airtable
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(processedFile);
        });

        newImages.push(base64);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        toast.error(`Failed to process ${file.name}`);
        console.error('Upload error:', error);
      }
    }

    onImagesChange(newImages);
    event.target.value = ''; // Reset input
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {images.map((image, index) => (
          <div key={index} className="relative group">
            <img
              src={image}
              alt=""
              className="w-full h-48 object-cover rounded-lg"
            />
            {!disabled && (
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {!disabled && (
        <label className="block border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-blue-500">
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600">
            Click to upload images or drag & drop
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Large images will be automatically compressed
          </p>
        </label>
      )}
    </div>
  );
};