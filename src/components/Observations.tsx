import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Bug, Thermometer, Sprout, Cloud, MoreHorizontal, Settings as SettingsIcon, RefreshCw } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { AddObservationForm } from './AddObservationForm';
import { ObservationDetail } from './ObservationDetail';
import { Settings } from './Settings';
import { motion, AnimatePresence } from 'framer-motion';
import { loadObservations } from '../services/airtable';
import { Observation } from '../types/observation';
import toast from 'react-hot-toast';

export const Observations: React.FC = () => {
  const { darkMode, isConfigured } = useSettingsStore();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [selectedObservationId, setSelectedObservationId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showSettings, setShowSettings] = useState(!isConfigured);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentOffset, setCurrentOffset] = useState<string>();

  const loadMoreObservations = async () => {
    if (!isConfigured || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await loadObservations({ offset: currentOffset });
      if (currentOffset) {
        setObservations(prev => [...prev, ...result.observations]);
      } else {
        setObservations(result.observations);
      }
      setCurrentOffset(result.offset);
      setHasMore(result.hasMore);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load observations';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isConfigured) {
      setCurrentOffset(undefined);
      setHasMore(true);
      loadMoreObservations();
    }
  }, [isConfigured]);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100 &&
        !isLoading &&
        hasMore &&
        navigator.onLine
      ) {
        loadMoreObservations();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore, currentOffset]);

  const handleObservationDeleted = (deletedId: string) => {
    setObservations(prev => prev.filter(obs => obs.id !== deletedId));
    setSelectedObservationId(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pest':
        return <Bug className="w-5 h-5" />;
      case 'disease':
        return <Thermometer className="w-5 h-5" />;
      case 'growth':
        return <Sprout className="w-5 h-5" />;
      case 'weather':
        return <Cloud className="w-5 h-5" />;
      default:
        return <MoreHorizontal className="w-5 h-5" />;
    }
  };

  if (!isConfigured) {
    return (
      <div className="text-center py-12">
        <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
          Please configure your Airtable connection in settings first.
        </p>
        <button
          onClick={() => setShowSettings(true)}
          className={`mt-4 inline-flex items-center px-4 py-2 rounded-lg ${
            darkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <SettingsIcon className="w-5 h-5 mr-2" />
          Open Settings
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Observations
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(true)}
            className={`p-2 rounded-full ${
              darkMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
            title="Settings"
          >
            <SettingsIcon className="w-6 h-6" />
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className={`inline-flex items-center px-4 py-2 rounded-lg ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Observation
          </button>
        </div>
      </div>

      {isLoading && observations.length === 0 ? (
        <div className="text-center py-12">
          <RefreshCw className={`w-8 h-8 mx-auto mb-4 animate-spin ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
            Loading observations...
          </p>
        </div>
      ) : observations.length === 0 ? (
        <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <p>No observations recorded yet</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {observations.map((observation) => (
            <motion.div
              key={observation.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                darkMode
                  ? 'bg-gray-800 hover:bg-gray-700'
                  : 'bg-white hover:bg-gray-50'
              }`}
              onClick={() => setSelectedObservationId(observation.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className={`text-lg font-semibold mb-1 ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {observation.title}
                  </h3>
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {format(observation.date, 'MMMM d, yyyy')}
                  </p>
                </div>
                <div className={`p-2 rounded-full ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {getTypeIcon(observation.type)}
                </div>
              </div>

              {observation.photos && observation.photos.length > 0 && (
                <div className="mt-2">
                  <img
                    src={observation.photos[0]}
                    alt=""
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="mt-2">
                <p className={`text-sm line-clamp-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {observation.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {isLoading && observations.length > 0 && (
        <div className="text-center py-4">
          <RefreshCw className={`w-6 h-6 mx-auto animate-spin ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`} />
        </div>
      )}

      <AnimatePresence>
        {showAddForm && (
          <AddObservationForm onClose={() => setShowAddForm(false)} />
        )}
        {selectedObservationId && (
          <ObservationDetail 
            observationId={selectedObservationId} 
            onClose={() => setSelectedObservationId(null)}
            onDelete={handleObservationDeleted}
          />
        )}
        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};