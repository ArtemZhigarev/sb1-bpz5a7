import React, { useState, useEffect } from 'react';
import { TaskList } from './components/TaskList';
import { TaskDetail } from './components/TaskDetail';
import { Settings } from './components/Settings';
import { AddTaskForm } from './components/AddTaskForm';
import { LoadingBar } from './components/LoadingBar';
import { useTaskStore } from './store/taskStore';
import { useSettingsStore } from './store/settingsStore';
import { Plus, Wifi, WifiOff, RefreshCw, Sprout } from 'lucide-react';
import { sendTaskNotification } from './services/telegram';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Observations } from './components/Observations';
import { Menu } from './components/Menu';
import { FuelManagement } from './components/FuelManagement';
import { Calendar } from './components/Calendar';
import { useAccessLog } from './hooks/useAccessLog';

export default function App() {
  const { tasks, selectedTaskId, setTasks, appendTasks, syncPendingChanges, getCachedTasks } = useTaskStore();
  const { isConfigured, telegram, darkMode } = useSettingsStore();
  const [showSettings, setShowSettings] = useState(!isConfigured);
  const [showAddTask, setShowAddTask] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentOffset, setCurrentOffset] = useState<string>();
  const [hasMore, setHasMore] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [filterType, setFilterType] = useState<'upcoming' | 'all' | 'today'>('today');
  const [isSendingNotifications, setIsSendingNotifications] = useState(false);
  const [currentView, setCurrentView] = useState<'tasks' | 'observations' | 'fuel' | 'calendar'>('tasks');

  // Initialize access logging
  useAccessLog();

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      setIsSyncing(true);
      try {
        await syncPendingChanges();
        setCurrentOffset(undefined);
        setHasMore(true);
      } finally {
        setIsSyncing(false);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncPendingChanges]);

  const handleSendNotifications = async () => {
    if (!telegram?.botToken || !telegram?.authorizedUsers?.length) {
      toast.error('Please configure Telegram settings first');
      setShowSettings(true);
      return;
    }

    setIsSendingNotifications(true);
    const pendingTasks = tasks.filter(task => task.status !== 'Done');
    
    try {
      for (const user of telegram.authorizedUsers) {
        const success = await sendTaskNotification(
          telegram.botToken,
          user.id,
          pendingTasks.map(task => ({
            id: task.id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate,
            importance: task.importance,
            status: task.status
          }))
        );

        if (success) {
          toast.success(`Notifications sent to ${user.firstName}`);
        } else {
          toast.error(`Failed to send notifications to ${user.firstName}`);
        }
      }
    } catch (error) {
      toast.error('Failed to send notifications');
    } finally {
      setIsSendingNotifications(false);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900' : 'bg-gray-100'}`}>
      <LoadingBar isVisible={isLoading} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sprout className={`w-8 h-8 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Garden Manager
              </h1>
            </div>
            {isLoading ? (
              <RefreshCw className={`w-5 h-5 animate-spin ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            ) : isOnline ? (
              <div className="flex items-center gap-1">
                <Wifi className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                {isSyncing && <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />}
              </div>
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
          </div>
          <div className="flex gap-2">
            {currentView === 'tasks' && (
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
            )}
            <Menu
              currentView={currentView}
              onViewChange={setCurrentView}
              onOpenSettings={() => setShowSettings(true)}
              onSendNotifications={handleSendNotifications}
              isSendingNotifications={isSendingNotifications}
            />
          </div>
        </div>

        {!isConfigured && !showSettings && (
          <div className={`border-l-4 border-yellow-400 p-4 mb-4 ${
            darkMode ? 'bg-yellow-900/20' : 'bg-yellow-50'
          }`}>
            <div className="flex">
              <div className="ml-3">
                <p className={`text-sm ${
                  darkMode ? 'text-yellow-200' : 'text-yellow-700'
                }`}>
                  Please configure your Airtable connection in settings to sync your data.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isOnline && (
          <div className={`border-l-4 border-blue-400 p-4 mb-4 ${
            darkMode ? 'bg-blue-900/20' : 'bg-blue-50'
          }`}>
            <div className="flex">
              <div className="ml-3">
                <p className={`text-sm ${
                  darkMode ? 'text-blue-200' : 'text-blue-700'
                }`}>
                  You're currently offline. Using cached data and changes will be synced when you're back online.
                </p>
              </div>
            </div>
          </div>
        )}

        {loadError && loadError !== 'You are offline. Using cached tasks.' && (
          <div className={`border-l-4 border-red-400 p-4 mb-4 ${
            darkMode ? 'bg-red-900/20' : 'bg-red-50'
          }`}>
            <div className="flex">
              <div className="ml-3">
                <p className={`text-sm ${
                  darkMode ? 'text-red-200' : 'text-red-700'
                }`}>
                  {loadError}
                </p>
              </div>
            </div>
          </div>
        )}

        {currentView === 'tasks' ? (
          <>
            <TaskList filterType={filterType} onFilterChange={setFilterType} />
            {selectedTaskId && <TaskDetail />}
            {showSettings && <Settings onClose={() => setShowSettings(false)} />}
            {showAddTask && <AddTaskForm onClose={() => setShowAddTask(false)} />}
          </>
        ) : currentView === 'observations' ? (
          <Observations />
        ) : currentView === 'calendar' ? (
          <Calendar />
        ) : (
          <FuelManagement />
        )}
      </div>
      <Toaster 
        position="bottom-center"
        toastOptions={{
          style: darkMode ? {
            background: '#374151',
            color: '#fff',
          } : undefined,
        }}
      />
    </div>
  );
}