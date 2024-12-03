import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { createObservation } from '../services/airtable';
import { ImageUpload } from './ImageUpload';
import toast from 'react-hot-toast';

interface AddObservationFormProps {
  onClose: () => void;
}

export const AddObservationForm: React.FC<AddObservationFormProps> = ({ onClose }) => {
  const { darkMode } = useSettingsStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'pest' | 'disease' | 'growth' | 'weather' | 'other'>('pest');
  const [photos, setPhotos] = useState<string[]>([]);
  const [observer, setObserver] = useState<'David' | 'Artem'>('David');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    try {
      await createObservation({
        title: title.trim(),
        description: description.trim(),
        type,
        photos,
        date: new Date(),
        observer
      });
      toast.success('Observation added successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to add observation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-hidden flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`w-full max-w-lg mx-4 rounded-lg shadow-xl max-h-[90vh] flex flex-col ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              New Observation
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-full ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              <X className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
                placeholder="What did you observe?"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
              >
                <option value="pest">Pest</option>
                <option value="disease">Disease</option>
                <option value="growth">Growth</option>
                <option value="weather">Weather</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Who Observed?
              </label>
              <select
                value={observer}
                onChange={(e) => setObserver(e.target.value as 'David' | 'Artem')}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
              >
                <option value="David">David</option>
                <option value="Artem">Artem</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
                placeholder="Describe what you observed..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Photos
              </label>
              <ImageUpload
                images={photos}
                onImagesChange={setPhotos}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className={`flex justify-end gap-3 px-6 py-4 border-t ${
            darkMode ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                darkMode
                  ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                darkMode ? 'focus:ring-offset-gray-900' : ''
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Observation
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};