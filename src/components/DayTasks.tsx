import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { X, Clock, AlertTriangle, Plus } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { useTaskStore } from '../store/taskStore';
import { Task } from '../types/task';
import { AddTaskForm } from './AddTaskForm';
import { TaskDetail } from './TaskDetail';

interface DayTasksProps {
  date: Date;
  tasks: Task[];
  onClose: () => void;
}

export const DayTasks: React.FC<DayTasksProps> = ({ date, tasks, onClose }) => {
  const { darkMode } = useSettingsStore();
  const { setSelectedTaskId } = useTaskStore();
  const [showAddTask, setShowAddTask] = useState(false);

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={`w-full max-w-lg rounded-lg shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Tasks for {format(date, 'MMMM d, yyyy')}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddTask(true)}
                  className={`inline-flex items-center px-4 py-2 rounded-md ${
                    darkMode
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Task
                </button>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full ${
                    darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X className={`w-6 h-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                </button>
              </div>
            </div>

            {tasks.length === 0 ? (
              <p className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No tasks scheduled for this day
              </p>
            ) : (
              <div className="space-y-4">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      darkMode 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className={`text-lg font-medium ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </h3>
                          {task.importance === 'urgent' && (
                            <AlertTriangle className="w-5 h-5 text-orange-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Clock className={`w-4 h-4 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`} />
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Due {format(new Date(task.dueDate), 'h:mm a')}
                          </span>
                        </div>
                        {task.description && (
                          <p className={`mt-2 text-sm ${
                            darkMode ? 'text-gray-300' : 'text-gray-600'
                          }`}>
                            {task.description}
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          task.status === 'In progress'
                            ? darkMode
                              ? 'bg-blue-900/20 text-blue-400'
                              : 'bg-blue-100 text-blue-800'
                            : task.status === 'Done'
                            ? darkMode
                              ? 'bg-green-900/20 text-green-400'
                              : 'bg-green-100 text-green-800'
                            : darkMode
                              ? 'bg-gray-600 text-gray-300'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {task.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      {showAddTask && (
        <AddTaskForm 
          onClose={() => setShowAddTask(false)}
          initialDate={date}
        />
      )}
      <TaskDetail />
    </>
  );
};