import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, RefreshCw } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import toast from 'react-hot-toast';

interface AddTaskFormProps {
  onClose: () => void;
  initialDate?: Date;
}

export const AddTaskForm: React.FC<AddTaskFormProps> = ({ onClose, initialDate }) => {
  const { addTask } = useTaskStore();
  const { darkMode } = useSettingsStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [toDoDate, setToDoDate] = useState(
    initialDate ? initialDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRepeating, setIsRepeating] = useState(false);
  const [repeatEveryDays, setRepeatEveryDays] = useState(1);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }

    setIsSubmitting(true);
    try {
      const taskData = {
        title: title.trim(),
        description: description.trim(),
        dueDate: new Date(toDoDate),
        status: 'To do' as const,
        priority: 'medium' as const,
        images: [],
        assigneeId: null,
        isRepeating,
        repeatEveryDays: isRepeating ? repeatEveryDays : undefined,
        importance: 'normal' as const
      };

      toast.loading('Creating task...', { id: 'task-creation' });
      await addTask(taskData);
      toast.success('Task created', { id: 'task-creation' });
      onClose();
    } catch (error) {
      console.error('Task creation error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to create task. Please try again.'
      );
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
              New Task
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
                placeholder="Enter task title"
                required
              />
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
                placeholder="Enter task description"
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-1 ${
                darkMode ? 'text-gray-200' : 'text-gray-700'
              }`}>
                Due Date
              </label>
              <input
                type="date"
                value={toDoDate}
                onChange={(e) => setToDoDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-md ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'border-gray-300 text-gray-900'
                }`}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isRepeating"
                  checked={isRepeating}
                  onChange={(e) => setIsRepeating(e.target.checked)}
                  className={`h-4 w-4 rounded focus:ring-blue-500 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-blue-600'
                      : 'border-gray-300 text-blue-600'
                  }`}
                />
                <label htmlFor="isRepeating" className={`ml-2 block text-sm ${
                  darkMode ? 'text-gray-200' : 'text-gray-900'
                }`}>
                  Repeating Task
                </label>
              </div>

              {isRepeating && (
                <div className="flex items-center gap-2">
                  <label htmlFor="repeatEveryDays" className={`text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Repeat every
                  </label>
                  <input
                    type="number"
                    id="repeatEveryDays"
                    value={repeatEveryDays}
                    onChange={(e) => setRepeatEveryDays(Math.max(1, parseInt(e.target.value)))}
                    min="1"
                    className={`w-20 px-2 py-1 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'border-gray-300 text-gray-900'
                    }`}
                  />
                  <span className={`text-sm ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>days</span>
                </div>
              )}
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Task
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};