import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Clock, CheckCircle, Edit2, Save, RefreshCw, Trash2, Flame, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useTaskStore } from '../store/taskStore';
import { useEmployeeStore } from '../store/employeeStore';
import { useSettingsStore } from '../store/settingsStore';
import { Task, TaskStatus } from '../types/task';
import { ImageViewer } from './ImageViewer';
import { ImageUploadButton } from './ImageUploadButton';
import toast from 'react-hot-toast';

interface TaskDetailProps {
  onClose?: () => void;
}

export const TaskDetail: React.FC<TaskDetailProps> = ({ onClose }) => {
  const { tasks, selectedTaskId, setSelectedTaskId, updateTask, updateTaskStatus, deleteTask } = useTaskStore();
  const { employees } = useEmployeeStore();
  const { darkMode } = useSettingsStore();
  const task = tasks.find((t) => t.id === selectedTaskId);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task> | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!task) return null;

  const assignee = employees.find(emp => emp.id === task.assigneeId);
  const currentTask = editedTask || task;

  const handleEdit = () => {
    setEditedTask(task);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (editedTask && selectedTaskId) {
      setIsSaving(true);
      try {
        await updateTask(selectedTaskId, editedTask);
        setIsEditing(false);
        setEditedTask(null);
        toast.success('Task updated successfully');
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to update task');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedTaskId || !window.confirm('Are you sure you want to delete this task?')) return;

    setIsDeleting(true);
    try {
      await deleteTask(selectedTaskId);
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleComplete = async () => {
    if (selectedTaskId) {
      try {
        await updateTaskStatus(selectedTaskId, 'Done');
        toast.success('Task marked as complete');
        setSelectedTaskId(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to complete task');
      }
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTask(null);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditedTask((prev) => {
      if (!prev) return null;
      if (name === 'dueDate') {
        return {
          ...prev,
          [name]: new Date(value),
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const toggleUrgency = () => {
    setEditedTask(prev => {
      if (!prev) return null;
      return {
        ...prev,
        importance: prev.importance === 'urgent' ? 'normal' : 'urgent'
      };
    });
  };

  const handleImageUploadComplete = async (imageUrl: string) => {
    if (!task) return;
    
    try {
      const newImages = [...task.images, imageUrl];
      await updateTask(task.id, { images: newImages });
      toast.success('Image added successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add image');
    }
  };

  const handleRemoveImage = async (index: number) => {
    if (!task) return;
    
    try {
      const newImages = [...task.images];
      newImages.splice(index, 1);
      await updateTask(task.id, { images: newImages });
      toast.success('Image removed successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove image');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      className={`fixed inset-0 z-50 overflow-y-auto ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
    >
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          {isEditing ? (
            <input
              type="text"
              name="title"
              value={currentTask.title}
              onChange={handleInputChange}
              className={`text-2xl font-bold rounded px-2 py-1 w-full ${
                darkMode 
                  ? 'bg-gray-800 border-gray-700 text-white'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              }`}
            />
          ) : (
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {currentTask.title}
            </h2>
          )}
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className={`px-4 py-2 flex items-center gap-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-red-400 hover:bg-red-900/20'
                      : 'text-red-600 hover:bg-red-50'
                  }`}
                >
                  {isDeleting ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="w-6 h-6" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`px-4 py-2 flex items-center gap-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-green-400 hover:bg-green-900/20'
                      : 'text-green-600 hover:bg-green-50'
                  }`}
                >
                  {isSaving ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-6 h-6" />
                      <span>Save</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className={`px-4 py-2 flex items-center gap-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <X className="w-6 h-6" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleEdit}
                  className={`px-4 py-2 flex items-center gap-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-blue-400 hover:bg-blue-900/20'
                      : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  <Edit2 className="w-6 h-6" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setSelectedTaskId(null)}
                  className={`px-4 py-2 flex items-center gap-2 rounded-lg transition-colors ${
                    darkMode
                      ? 'text-gray-300 hover:bg-gray-800'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <X className="w-6 h-6" />
                  <span>Close</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {currentTask.images.map((image, index) => (
              <div
                key={index}
                className="relative cursor-pointer group"
                onClick={() => setSelectedImageIndex(index)}
              >
                <img
                  src={image}
                  alt=""
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage(index);
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {selectedImageIndex !== null && (
            <ImageViewer
              images={currentTask.images}
              currentIndex={selectedImageIndex}
              onClose={() => setSelectedImageIndex(null)}
              onNext={() => setSelectedImageIndex((selectedImageIndex + 1) % currentTask.images.length)}
              onPrevious={() => setSelectedImageIndex((selectedImageIndex - 1 + currentTask.images.length) % currentTask.images.length)}
            />
          )}

          <ImageUploadButton
            taskId={task.id}
            onUploadComplete={handleImageUploadComplete}
            disabled={isEditing}
          />

          <div className="space-y-4">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Due Date
                  </label>
                  <input
                    type="date"
                    name="dueDate"
                    value={format(currentTask.dueDate, 'yyyy-MM-dd')}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Status
                  </label>
                  <select
                    name="status"
                    value={currentTask.status}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="To do">To do</option>
                    <option value="In progress">In progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Importance
                  </label>
                  <button
                    onClick={toggleUrgency}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      currentTask.importance === 'urgent'
                        ? darkMode
                          ? 'bg-orange-900/20 border-orange-500 text-orange-300'
                          : 'bg-orange-50 border-orange-500 text-orange-700'
                        : darkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-300'
                          : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                  >
                    {currentTask.importance === 'urgent' ? (
                      <>
                        <Flame className="w-5 h-5" />
                        Urgent
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        Normal
                      </>
                    )}
                  </button>
                </div>
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={currentTask.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-3 py-2 rounded-md ${
                      darkMode
                        ? 'bg-gray-800 border-gray-700 text-white'
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isRepeating"
                      checked={currentTask.isRepeating}
                      onChange={(e) => setEditedTask(prev => ({
                        ...prev!,
                        isRepeating: e.target.checked
                      }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className={`ml-2 block text-sm ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      Repeating Task
                    </label>
                  </div>
                  {currentTask.isRepeating && (
                    <div className="flex items-center gap-2 mt-2">
                      <label className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Repeat every
                      </label>
                      <input
                        type="number"
                        name="repeatEveryDays"
                        value={currentTask.repeatEveryDays || 1}
                        onChange={(e) => setEditedTask(prev => ({
                          ...prev!,
                          repeatEveryDays: Math.max(1, parseInt(e.target.value))
                        }))}
                        min="1"
                        className={`w-20 px-2 py-1 rounded-md ${
                          darkMode
                            ? 'bg-gray-800 border-gray-700 text-white'
                            : 'bg-gray-50 border-gray-300 text-gray-900'
                        }`}
                      />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>days</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      Due {format(currentTask.dueDate, 'MMMM d, yyyy')}
                    </span>
                  </div>
                  {assignee && (
                    <div className="flex items-center gap-2">
                      <img
                        src={assignee.avatar}
                        alt={assignee.name}
                        className="w-6 h-6 rounded-full"
                      />
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>
                        {assignee.name}
                      </span>
                    </div>
                  )}
                </div>
                {currentTask.importance === 'urgent' && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    darkMode
                      ? 'bg-orange-900/20 text-orange-300'
                      : 'bg-orange-50 text-orange-600'
                  }`}>
                    <Flame className="w-5 h-5" />
                    <span className="font-medium">Urgent Task</span>
                  </div>
                )}
                <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {currentTask.description}
                </p>
                {currentTask.isRepeating && (
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Repeats every {currentTask.repeatEveryDays} day{currentTask.repeatEveryDays !== 1 ? 's' : ''}
                  </div>
                )}
              </>
            )}

            {!isEditing && task.status !== 'Done' && (
              <button
                onClick={handleComplete}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg ${
                  darkMode
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                Mark as Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};