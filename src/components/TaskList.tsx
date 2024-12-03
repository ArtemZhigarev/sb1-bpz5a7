import React, { useState, useEffect } from 'react';
import { format, isValid } from 'date-fns';
import { Clock, ArrowRight, CheckCircle, PlayCircle, AlertTriangle, Flame } from 'lucide-react';
import { useTaskStore } from '../store/taskStore';
import { useEmployeeStore } from '../store/employeeStore';
import { useSettingsStore } from '../store/settingsStore';
import { DelayOption, TaskStatus } from '../types/task';
import { motion, AnimatePresence } from 'framer-motion';

type FilterType = 'upcoming' | 'all' | 'today';

interface TaskListProps {
  filterType: FilterType;
  onFilterChange: (type: FilterType) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ filterType, onFilterChange }) => {
  const { tasks, delayTask, setSelectedTaskId, updateTaskStatus, refreshTasks, setCurrentFilter } = useTaskStore();
  const { employees } = useEmployeeStore();
  const { darkMode } = useSettingsStore();
  const [openDelayId, setOpenDelayId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Handle filter changes
  const handleFilterChange = async (newFilter: FilterType) => {
    setIsLoading(true);
    setCurrentFilter(newFilter);
    onFilterChange(newFilter);
    try {
      await refreshTasks(newFilter);
    } catch (error) {
      console.error('Failed to load tasks for filter:', newFilter, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load and filter changes
  useEffect(() => {
    const loadInitialTasks = async () => {
      setIsLoading(true);
      try {
        await refreshTasks(filterType);
      } catch (error) {
        console.error('Failed to load initial tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialTasks();
  }, [filterType]);

  const delayOptions: { days: DelayOption; label: string }[] = [
    { days: 1, label: 'Tomorrow' },
    { days: 2, label: '2 Days' },
    { days: 7, label: '1 Week' },
    { days: 14, label: '2 Weeks' },
  ];

  const formatDate = (date: Date) => {
    if (!isValid(date)) {
      return 'No date set';
    }
    return format(date, 'MMM d, yyyy');
  };

  const handleStatusChange = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newStatus: TaskStatus = task.status === 'To do' ? 'In progress' : 'Done';
    await updateTaskStatus(taskId, newStatus);
  };

  const handleDelayClick = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDelayId(openDelayId === taskId ? null : taskId);
  };

  const handleDelayOptionClick = async (taskId: string, days: DelayOption, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await delayTask(taskId, days);
      setOpenDelayId(null);
    } catch (error) {
      // Error handling is done in the store
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.delay-button') && !target.closest('.delay-options')) {
        setOpenDelayId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter out completed tasks
  const activeTasks = tasks.filter(task => task.status !== 'Done');

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => handleFilterChange('upcoming')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filterType === 'upcoming'
              ? darkMode
                ? 'bg-blue-900 text-blue-100'
                : 'bg-blue-100 text-blue-800'
              : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          disabled={isLoading}
        >
          Next 7 Days
        </button>
        <button
          onClick={() => handleFilterChange('today')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filterType === 'today'
              ? darkMode
                ? 'bg-blue-900 text-blue-100'
                : 'bg-blue-100 text-blue-800'
              : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          disabled={isLoading}
        >
          Today ±1 Day
        </button>
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filterType === 'all'
              ? darkMode
                ? 'bg-blue-900 text-blue-100'
                : 'bg-blue-100 text-blue-800'
              : darkMode
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          }`}
          disabled={isLoading}
        >
          All Tasks
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-32 rounded-lg ${
                  darkMode ? 'bg-gray-800' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>
      ) : activeTasks.length === 0 ? (
        <div className="text-center py-12">
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>No tasks found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTasks.map((task) => {
            const assignee = employees.find(emp => emp.id === task.assigneeId);
            const isUrgent = task.importance === 'urgent';

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`relative ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md overflow-visible cursor-pointer`}
                onClick={() => setSelectedTaskId(task.id)}
              >
                <div
                  className={`absolute inset-0 rounded-lg ${
                    isUrgent ? 'border-4 border-orange-500 animate-urgent-pulse' : ''
                  } ${task.id.startsWith('temp-') ? 'border-2 border-yellow-400' : ''}`}
                />
                {isUrgent && (
                  <div className="absolute -top-3 left-4 px-3 py-1 bg-orange-500 text-white text-sm font-semibold rounded-full shadow-lg flex items-center gap-1">
                    <Flame className="w-4 h-4" />
                    Urgent
                  </div>
                )}
                <div className="relative p-4">
                  <div className="flex items-start gap-4">
                    {task.images[0] && !failedImages.has(task.images[0]) && (
                      <img
                        src={task.images[0]}
                        alt=""
                        className="w-20 h-20 object-cover rounded-lg"
                        onError={() => setFailedImages(prev => new Set(prev).add(task.images[0]))}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-lg font-semibold hover:text-blue-600 ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {task.title}
                        </h3>
                        {isUrgent && (
                          <AlertTriangle className="w-5 h-5 text-orange-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                          <span className={darkMode ? 'text-gray-300' : 'text-gray-500'}>
                            {formatDate(task.dueDate)}
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
                      <div className="mt-2 flex gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            task.status === 'In progress'
                              ? darkMode
                                ? 'bg-blue-900 text-blue-100'
                                : 'bg-blue-100 text-blue-800'
                              : task.status === 'Done'
                              ? darkMode
                                ? 'bg-green-900 text-green-100'
                                : 'bg-green-100 text-green-800'
                              : darkMode
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {task.status}
                        </span>
                        {task.isRepeating && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            darkMode
                              ? 'bg-purple-900 text-purple-100'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            Repeating
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <div className="relative">
                      <button
                        className={`delay-button inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg ${
                          darkMode
                            ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        onClick={(e) => handleDelayClick(task.id, e)}
                      >
                        Delay
                        <ArrowRight 
                          className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                            openDelayId === task.id ? 'rotate-90' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence>
                        {openDelayId === task.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className={`delay-options absolute left-0 mt-2 w-40 rounded-lg shadow-xl z-50 py-1 border ${
                              darkMode
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            {delayOptions.map((option) => (
                              <button
                                key={option.days}
                                onClick={(e) => handleDelayOptionClick(task.id, option.days, e)}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                  darkMode
                                    ? 'text-gray-300 hover:bg-gray-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(task.id);
                      }}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        darkMode
                          ? 'bg-blue-600 hover:bg-blue-700 focus:ring-offset-gray-900'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {task.status === 'To do' ? (
                        <>
                          <PlayCircle className="w-4 h-4 mr-2" />
                          Start
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};