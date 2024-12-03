import React, { useState } from 'react';
import { Image, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface PhotoManagerProps {
  photos: string[];
  onUpdate: (photos: string[]) => void;
  isEditing: boolean;
}

export const PhotoManager: React.FC<PhotoManagerProps> = ({ photos, onUpdate, isEditing }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos = [...photos];

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        // Convert file to base64 for Airtable
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });

        newPhotos.push(base64);
      }

      onUpdate(newPhotos);
      toast.success('Photos uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload photos');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onUpdate(newPhotos);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-gray-900">Photos</h3>
        {isEditing && (
          <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isUploading}
            />
            <Image className="w-4 h-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Add Photos'}
          </label>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <img
              src={photo}
              alt=""
              className="w-full h-48 object-cover rounded-lg"
            />
            {isEditing && (
              <button
                onClick={() => handleRemovePhoto(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};