import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { X, Edit2, Save, Trash2, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { ImageUpload } from './ImageUpload';
import toast from 'react-hot-toast';
import { Observation } from '../types/observation';
import { updateObservation, deleteObservation, loadObservations } from '../services/airtable';

interface ObservationDetailProps {
  observationId: string;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const ObservationDetail: React.FC<ObservationDetailProps> = ({ observationId, onClose, onDelete }) => {
  const { darkMode } = useSettingsStore();
  const [observation, setObservation] = useState<Observation | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedObservation, setEditedObservation] = useState<Observation | null>(null);

  useEffect(() => {
    const loadObservation = async () => {
      try {
        const result = await loadObservations();
        const found = result.observations.find(o => o.id === observationId);
        if (found) {
          setObservation(found);
          setEditedObservation(found);
        } else {
          toast.error('Observation not found');
          onClose();
        }
      } catch (error) {
        toast.error('Failed to load observation');
        onClose();
      }
    };

    loadObservation();
  }, [observationId]);

  if (!observation) return null;

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this observation?')) return;
    setIsDeleting(true);
    try {
      await deleteObservation(observation.id);
      toast.success('Observation deleted');
      onDelete(observation.id);
    } catch (error) {
      toast.error('Failed to delete observation');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!editedObservation) return;
    setIsSaving(true);
    try {
      await updateObservation(editedObservation);
      setObservation(editedObservation);
      setIsEditing(false);
      toast.success('Observation updated');
    } catch (error) {
      toast.error('Failed to update observation');
    } finally {
      setIsSaving(false);
    }
  };

  const currentObservation = isEditing ? editedObservation : observation;
  if (!currentObservation) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            {isEditing ? (
              <input
                type="text"
                value={editedObservation?.title}
                onChange={(e) =>
                  setEditedObservation(prev => prev ? { ...prev, title: e.target.value } : prev)
                }
                className={`text-2xl font-bold w-full px-2 py-1 rounded ${
                  darkMode
                    ? 'bg-gray-800 text-white border-gray-700'
                    : 'bg-gray-50 text-gray-900 border-gray-200'
                }`}
              />
            ) : (
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {currentObservation.title}
              </h2>
            )}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'text-green-400 hover:bg-green-900/20'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {isSaving ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Save className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedObservation(observation);
                    }}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'text-gray-400 hover:bg-gray-800'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'text-blue-400 hover:bg-blue-900/20'
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <Edit2 className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'text-red-400 hover:bg-red-900/20'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    {isDeleting ? (
                      <RefreshCw className="w-6 h-6 animate-spin" />
                    ) : (
                      <Trash2 className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? 'text-gray-400 hover:bg-gray-800'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <X className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {currentObservation.photos && currentObservation.photos.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {currentObservation.photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt=""
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    Type
                  </label>
                  <select
                    value={editedObservation?.type}
                    onChange={(e) =>
                      setEditedObservation(prev =>
                        prev ? { ...prev, type: e.target.value as any } : prev
                      )
                    }
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
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
                    Description
                  </label>
                  <textarea
                    value={editedObservation?.description}
                    onChange={(e) =>
                      setEditedObservation(prev =>
                        prev ? { ...prev, description: e.target.value } : prev
                      )
                    }
                    rows={4}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    }`}
                  />
                </div>

                <ImageUpload
                  images={editedObservation?.photos || []}
                  onImagesChange={(images) =>
                    setEditedObservation(prev =>
                      prev ? { ...prev, photos: images } : prev
                    )
                  }
                  disabled={false}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {format(currentObservation.date, 'MMMM d, yyyy')}
                  </span>
                </div>
                <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {currentObservation.description}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};