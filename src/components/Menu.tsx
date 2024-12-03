import React, { useState, useEffect, useRef } from 'react';
import { Menu as MenuIcon, X, ClipboardList, Eye, Settings as SettingsIcon, Droplet, Send, RefreshCw, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../store/settingsStore';

interface MenuProps {
  currentView: 'tasks' | 'observations' | 'fuel' | 'calendar';
  onViewChange: (view: 'tasks' | 'observations' | 'fuel' | 'calendar') => void;
  onOpenSettings: () => void;
  onSendNotifications: () => void;
  isSendingNotifications: boolean;
}

export const Menu: React.FC<MenuProps> = ({ 
  currentView, 
  onViewChange, 
  onOpenSettings,
  onSendNotifications,
  isSendingNotifications 
}) => {
  const { darkMode } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewChange = (view: 'tasks' | 'observations' | 'fuel' | 'calendar') => {
    onViewChange(view);
    setIsOpen(false);
  };

  const handleSettingsClick = () => {
    onOpenSettings();
    setIsOpen(false);
  };

  const handleSendNotifications = () => {
    onSendNotifications();
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-full ${
          darkMode
            ? 'text-gray-300 hover:bg-gray-800'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MenuIcon className="w-6 h-6" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50 ${
              darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
            }`}
          >
            <button
              onClick={() => handleViewChange('tasks')}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                currentView === 'tasks'
                  ? darkMode
                    ? 'bg-blue-900/20 text-blue-400'
                    : 'bg-blue-50 text-blue-700'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Tasks
            </button>
            <button
              onClick={() => handleViewChange('calendar')}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                currentView === 'calendar'
                  ? darkMode
                    ? 'bg-blue-900/20 text-blue-400'
                    : 'bg-blue-50 text-blue-700'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => handleViewChange('observations')}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                currentView === 'observations'
                  ? darkMode
                    ? 'bg-blue-900/20 text-blue-400'
                    : 'bg-blue-50 text-blue-700'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Eye className="w-4 h-4" />
              Observations
            </button>
            <button
              onClick={() => handleViewChange('fuel')}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                currentView === 'fuel'
                  ? darkMode
                    ? 'bg-blue-900/20 text-blue-400'
                    : 'bg-blue-50 text-blue-700'
                  : darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Droplet className="w-4 h-4" />
              Fuel
            </button>
            {currentView === 'tasks' && (
              <button
                onClick={handleSendNotifications}
                disabled={isSendingNotifications}
                className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                  darkMode
                    ? 'text-gray-300 hover:bg-gray-700 disabled:text-gray-500'
                    : 'text-gray-700 hover:bg-gray-100 disabled:text-gray-400'
                }`}
              >
                {isSendingNotifications ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send to Telegram
              </button>
            )}
            <div className={`my-1 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
            <button
              onClick={handleSettingsClick}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${
                darkMode
                  ? 'text-gray-300 hover:bg-gray-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};