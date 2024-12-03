import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, isSameMonth, isSameDay, parseISO, subMonths, addMonths } from 'date-fns';
import { useTaskStore } from '../store/taskStore';
import { useSettingsStore } from '../store/settingsStore';
import { CalendarDays, Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DayTasks } from './DayTasks';
import { AddTaskForm } from './AddTaskForm';
import { TaskDetail } from './TaskDetail';
import { Task } from '../types/task';

export const Calendar: React.FC = () => {
  const { tasks, selectedTaskId, setSelectedTaskId } = useTaskStore();
  const { darkMode } = useSettingsStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);

  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleTaskClick = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTaskId(taskId);
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentDate(prev => addDays(prev, -7))}
            className={`p-2 rounded-full ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {format(days[0], 'MMM d')} - {format(days[6], 'MMM d, yyyy')}
          </h3>
          <button
            onClick={() => setCurrentDate(prev => addDays(prev, 7))}
            className={`p-2 rounded-full ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {days.map((day, index) => {
            const dayTasks = tasks.filter(task => isSameDay(new Date(task.dueDate), day));
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`cursor-pointer p-4 rounded-lg transition-colors ${
                  darkMode
                    ? isToday
                      ? 'bg-blue-900/20 hover:bg-blue-900/30'
                      : 'bg-gray-800 hover:bg-gray-700'
                    : isToday
                    ? 'bg-blue-50 hover:bg-blue-100'
                    : 'bg-white hover:bg-gray-50'
                } border ${
                  darkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {format(day, 'EEEE')}
                    </span>
                    <span className={`text-sm ${
                      isToday
                        ? 'font-bold text-blue-600'
                        : darkMode
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}>
                      {format(day, 'MMM d')}
                    </span>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    dayTasks.length > 0
                      ? darkMode
                        ? 'bg-blue-900/20 text-blue-400'
                        : 'bg-blue-100 text-blue-800'
                      : darkMode
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {dayTasks.length} tasks
                  </span>
                </div>
                <div className="space-y-2">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => handleTaskClick(task.id, e)}
                      className={`p-2 rounded ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {task.importance === 'urgent' && (
                          <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        )}
                        <span className={`truncate ${
                          darkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}>
                          {task.title}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ml-auto flex-shrink-0 ${
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
                              : 'bg-gray-200 text-gray-700'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startWeek = startOfWeek(start);
    const days = [];
    let day = startWeek;

    while (day <= end || days.length % 7 !== 0) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentDate(prev => subMonths(prev, 1))}
            className={`p-2 rounded-full ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {format(currentDate, 'MMMM yyyy')}
          </h3>
          <button
            onClick={() => setCurrentDate(prev => addMonths(prev, 1))}
            className={`p-2 rounded-full ${
              darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div
              key={day}
              className={`text-sm font-medium text-center ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              {day}
            </div>
          ))}
          {days.map((day, index) => {
            const dayTasks = tasks.filter(task => isSameDay(new Date(task.dueDate), day));
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);

            return (
              <div
                key={index}
                onClick={() => handleDayClick(day)}
                className={`cursor-pointer p-2 rounded-lg transition-colors ${
                  !isCurrentMonth
                    ? darkMode
                      ? 'bg-gray-900/50'
                      : 'bg-gray-50'
                    : darkMode
                    ? isToday
                      ? 'bg-blue-900/20 hover:bg-blue-900/30'
                      : 'bg-gray-800 hover:bg-gray-700'
                    : isToday
                    ? 'bg-blue-50 hover:bg-blue-100'
                    : 'bg-white hover:bg-gray-50'
                } border ${
                  darkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
              >
                <div className="text-right mb-1">
                  <span className={`text-sm ${
                    isToday
                      ? 'font-bold text-blue-600'
                      : !isCurrentMonth
                      ? darkMode
                        ? 'text-gray-600'
                        : 'text-gray-400'
                      : darkMode
                      ? 'text-gray-300'
                      : 'text-gray-900'
                  }`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map((task) => (
                    <div
                      key={task.id}
                      onClick={(e) => handleTaskClick(task.id, e)}
                      className={`text-xs p-1 rounded ${
                        darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        {task.importance === 'urgent' && (
                          <AlertTriangle className="w-3 h-3 text-orange-500" />
                        )}
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayTasks.length > 2 && (
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      +{dayTasks.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Calendar
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
            onClick={() => setViewType('week')}
            className={`p-2 rounded-lg flex items-center gap-2 ${
              viewType === 'week'
                ? darkMode
                  ? 'bg-blue-900/20 text-blue-400'
                  : 'bg-blue-100 text-blue-700'
                : darkMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CalendarDays className="w-5 h-5" />
            Week
          </button>
          <button
            onClick={() => setViewType('month')}
            className={`p-2 rounded-lg flex items-center gap-2 ${
              viewType === 'month'
                ? darkMode
                  ? 'bg-blue-900/20 text-blue-400'
                  : 'bg-blue-100 text-blue-700'
                : darkMode
                ? 'text-gray-300 hover:bg-gray-800'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            Month
          </button>
        </div>
      </div>

      {viewType === 'week' ? renderWeekView() : renderMonthView()}

      <AnimatePresence>
        {selectedDate && (
          <DayTasks
            date={selectedDate}
            tasks={tasks.filter(task => isSameDay(new Date(task.dueDate), selectedDate))}
            onClose={() => setSelectedDate(null)}
          />
        )}
        {showAddTask && (
          <AddTaskForm 
            onClose={() => setShowAddTask(false)}
            initialDate={currentDate}
          />
        )}
        {selectedTaskId && <TaskDetail />}
      </AnimatePresence>
    </div>
  );
};