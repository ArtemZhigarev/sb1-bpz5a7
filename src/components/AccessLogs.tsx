import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useAccessStore } from '../store/accessStore';
import { useSettingsStore } from '../store/settingsStore';
import { format } from 'date-fns';

interface AccessLogsProps {
  onClose: () => void;
}

export const AccessLogs: React.FC<AccessLogsProps> = ({ onClose }) => {
  const { logs, clearLogs } = useAccessStore();
  const { darkMode } = useSettingsStore();

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
        className={`w-full max-w-4xl mx-4 rounded-lg shadow-xl max-h-[90vh] flex flex-col ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Access Logs
            </h2>
            <div className="flex gap-2">
              <button
                onClick={clearLogs}
                className={`p-2 rounded-full ${
                  darkMode
                    ? 'text-red-400 hover:bg-red-900/20'
                    : 'text-red-600 hover:bg-red-50'
                }`}
                title="Clear Logs"
              >
                <Trash2 className="w-6 h-6" />
              </button>
              <button
                onClick={onClose}
                className={`p-2 rounded-full ${
                  darkMode
                    ? 'text-gray-400 hover:bg-gray-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <RefreshCw className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {logs.length === 0 ? (
            <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No access logs available
            </p>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {log.online ? (
                          <Wifi className="w-5 h-5 text-green-500" />
                        ) : (
                          <WifiOff className="w-5 h-5 text-red-500" />
                        )}
                        <span className={`font-medium ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {log.ipAddress}
                        </span>
                      </div>
                      <div className={`text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>
                        <p>Browser: {log.browser}</p>
                        <p>OS: {log.os}</p>
                        <p>Device: {log.device}</p>
                      </div>
                    </div>
                    <div className={`text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <p>First seen: {format(log.timestamp, 'MMM d, yyyy HH:mm:ss')}</p>
                      <p>Last seen: {format(log.lastSeen, 'MMM d, yyyy HH:mm:ss')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};