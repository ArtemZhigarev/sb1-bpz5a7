import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Save, RefreshCw, Database, Table, Trash2, MessageCircle, AlertCircle, Moon, Sun, Clock, List } from 'lucide-react';
import { useSettingsStore, CacheDuration } from '../store/settingsStore';
import { fetchBases, fetchTables } from '../services/airtable';
import { getBotUsername, getUpdates } from '../services/telegram';
import { AccessLogs } from './AccessLogs';
import toast from 'react-hot-toast';

interface SettingsProps {
  onClose: () => void;
}

interface Base {
  id: string;
  name: string;
}

interface Table {
  id: string;
  name: string;
}

const CACHE_DURATION_OPTIONS: { value: CacheDuration; label: string }[] = [
  { value: '5min', label: '5 Minutes' },
  { value: '12h', label: '12 Hours' },
  { value: 'infinite', label: 'Indefinitely' },
];

export const Settings: React.FC<SettingsProps> = ({ onClose }) => {
  const { 
    airtableToken, 
    airtableBase, 
    airtableTable,
    observationsTable,
    telegram = { botToken: '', authorizedUsers: [] },
    darkMode,
    cacheDuration,
    setAirtableConfig, 
    setTelegramConfig,
    addTelegramUser,
    removeTelegramUser,
    toggleDarkMode,
    setCacheDuration
  } = useSettingsStore();
  
  const [token, setToken] = useState(airtableToken);
  const [selectedBase, setSelectedBase] = useState(airtableBase);
  const [selectedTable, setSelectedTable] = useState(airtableTable);
  const [selectedObservationsTable, setSelectedObservationsTable] = useState(observationsTable);
  const [telegramToken, setTelegramToken] = useState(telegram?.botToken || '');
  const [botUsername, setBotUsername] = useState<string | null>(null);
  const [bases, setBases] = useState<Base[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBases, setLoadingBases] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [activeTab, setActiveTab] = useState<'airtable' | 'telegram' | 'appearance' | 'access'>('airtable');
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      loadBases();
    }
  }, [token]);

  useEffect(() => {
    if (selectedBase) {
      loadTables();
    } else {
      setTables([]);
      setSelectedTable('');
      setSelectedObservationsTable('');
    }
  }, [selectedBase]);

  useEffect(() => {
    if (telegramToken) {
      updateBotUsername();
    } else {
      setBotUsername(null);
      setTelegramError(null);
    }
  }, [telegramToken]);

  const updateBotUsername = async () => {
    if (!telegramToken) return;
    setTelegramError(null);
    try {
      const username = await getBotUsername(telegramToken);
      if (!username) {
        setTelegramError('Invalid bot token or bot not found');
        return;
      }
      setBotUsername(username);
    } catch (error) {
      setTelegramError(error instanceof Error ? error.message : 'Failed to connect to bot');
      setBotUsername(null);
    }
  };

  const loadBases = async () => {
    if (!token) return;
    setLoadingBases(true);
    try {
      const basesList = await fetchBases(token);
      setBases(basesList);
      if (!selectedBase && basesList.length > 0) {
        setSelectedBase(basesList[0].id);
      }
    } catch (error) {
      toast.error('Failed to load bases. Please check your API token.');
      setBases([]);
    } finally {
      setLoadingBases(false);
    }
  };

  const loadTables = async () => {
    if (!selectedBase || !token) return;
    
    setLoadingTables(true);
    try {
      const tablesList = await fetchTables(token, selectedBase);
      setTables(tablesList);
      if (!selectedTable && tablesList.length > 0) {
        setSelectedTable(tablesList[0].id);
      }
      if (!selectedObservationsTable && tablesList.length > 0) {
        setSelectedObservationsTable(tablesList[0].id);
      }
    } catch (error) {
      toast.error('Failed to load tables.');
      setTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleCheckUpdates = async () => {
    if (!telegramToken) {
      toast.error('Please enter a Telegram bot token first');
      return;
    }

    setCheckingUpdates(true);
    setTelegramError(null);
    try {
      const users = await getUpdates(telegramToken);
      if (users.length === 0) {
        toast.error('No new users found. Make sure they\'ve messaged the bot!');
      } else {
        users.forEach(user => {
          addTelegramUser({
            id: user.id,
            username: user.username || '',
            firstName: user.first_name
          });
        });
        toast.success(`Found ${users.length} user(s)!`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to check for new users';
      setTelegramError(message);
      toast.error(message);
    } finally {
      setCheckingUpdates(false);
    }
  };

  const handleSave = async () => {
    if (activeTab === 'telegram' && !telegramToken) {
      toast.error('Please enter a Telegram bot token');
      return;
    }

    setLoading(true);
    try {
      // Always verify Airtable connection
      await fetchTables(token, selectedBase);
      
      // Save both configurations
      setAirtableConfig(token, selectedBase, selectedTable, selectedObservationsTable);
      setTelegramConfig({ botToken: telegramToken });
      
      toast.success('Settings saved successfully!');
      onClose();
    } catch (error) {
      toast.error('Failed to verify connection. Please check your settings.');
    } finally {
      setLoading(false);
    }
  };

  const authorizedUsers = telegram?.authorizedUsers || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl max-w-md w-full mx-4`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Settings</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-full ${
                darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('airtable')}
              className={`flex-1 py-2 px-4 rounded-lg ${
                activeTab === 'airtable'
                  ? darkMode 
                    ? 'bg-blue-900 text-blue-100'
                    : 'bg-blue-100 text-blue-700'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Airtable
            </button>
            <button
              onClick={() => setActiveTab('telegram')}
              className={`flex-1 py-2 px-4 rounded-lg ${
                activeTab === 'telegram'
                  ? darkMode 
                    ? 'bg-blue-900 text-blue-100'
                    : 'bg-blue-100 text-blue-700'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Telegram
            </button>
            <button
              onClick={() => setActiveTab('appearance')}
              className={`flex-1 py-2 px-4 rounded-lg ${
                activeTab === 'appearance'
                  ? darkMode 
                    ? 'bg-blue-900 text-blue-100'
                    : 'bg-blue-100 text-blue-700'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Appearance
            </button>
            <button
              onClick={() => setActiveTab('access')}
              className={`flex-1 py-2 px-4 rounded-lg ${
                activeTab === 'access'
                  ? darkMode 
                    ? 'bg-blue-900 text-blue-100'
                    : 'bg-blue-100 text-blue-700'
                  : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Access
            </button>
          </div>

          {activeTab === 'access' ? (
            <AccessLogs onClose={() => setActiveTab('airtable')} />
          ) : activeTab === 'appearance' ? (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Dark Mode
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      Toggle dark mode appearance
                    </p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`p-2 rounded-lg ${
                      darkMode
                        ? 'bg-gray-600 text-yellow-300 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="space-y-2">
                  <div>
                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      Offline Storage
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                      How long to keep cached data
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <select
                      value={cacheDuration}
                      onChange={(e) => setCacheDuration(e.target.value as CacheDuration)}
                      className={`flex-1 px-3 py-2 rounded-md ${
                        darkMode
                          ? 'bg-gray-800 text-white border-gray-600'
                          : 'bg-white text-gray-900 border-gray-300'
                      }`}
                    >
                      {CACHE_DURATION_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'telegram' ? (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Telegram Bot Token
                </label>
                <input
                  type="password"
                  value={telegramToken}
                  onChange={(e) => setTelegramToken(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Enter your Telegram bot token"
                />
              </div>

              {telegramError && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${
                  darkMode ? 'bg-red-900/20' : 'bg-red-50'
                }`}>
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className={`text-sm ${darkMode ? 'text-red-200' : 'text-red-700'}`}>
                    {telegramError}
                  </p>
                </div>
              )}

              {botUsername && (
                <div className="flex flex-col gap-4">
                  <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                    <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                      To receive notifications, start a chat with{' '}
                      <a
                        href={`https://t.me/${botUsername}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium underline"
                      >
                        @{botUsername}
                      </a>
                      {' '}and send any message.
                    </p>
                  </div>

                  <button
                    onClick={handleCheckUpdates}
                    disabled={checkingUpdates}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                      darkMode
                        ? 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-offset-gray-800'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {checkingUpdates ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <MessageCircle className="w-5 h-5" />
                    )}
                    {checkingUpdates ? 'Checking...' : 'Check for New Users'}
                  </button>

                  <div className="space-y-2">
                    <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                      Authorized Users
                    </h3>
                    {authorizedUsers.length === 0 ? (
                      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        No users authorized yet
                      </p>
                    ) : (
                      authorizedUsers.map((user) => (
                        <div 
                          key={user.id} 
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            darkMode ? 'bg-gray-700' : 'bg-gray-50'
                          }`}
                        >
                          <div>
                            <p className={darkMode ? 'text-white' : 'text-gray-900'}>
                              {user.firstName}
                            </p>
                            {user.username && (
                              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                @{user.username}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => removeTelegramUser(user.id)}
                            className={`p-2 rounded-full ${
                              darkMode
                                ? 'text-red-400 hover:bg-red-900/20'
                                : 'text-red-500 hover:bg-red-50'
                            }`}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Airtable API Token
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className={`w-full px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter your Airtable API token"
                  />
                  {loadingBases && (
                    <RefreshCw className="w-5 h-5 absolute right-3 top-2.5 animate-spin text-gray-400" />
                  )}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Select Base
                </label>
                <div className="relative">
                  <select
                    value={selectedBase}
                    onChange={(e) => setSelectedBase(e.target.value)}
                    disabled={!token || loadingBases}
                    className={`w-full px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white disabled:bg-gray-800'
                        : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100'
                    }`}
                  >
                    <option value="">Select a base</option>
                    {bases.map((base) => (
                      <option key={base.id} value={base.id}>
                        {base.name}
                      </option>
                    ))}
                  </select>
                  <Database className="w-5 h-5 absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Tasks Table
                </label>
                <div className="relative">
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    disabled={!selectedBase || loadingTables}
                    className={`w-full px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white disabled:bg-gray-800'
                        : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100'
                    }`}
                  >
                    <option value="">Select tasks table</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                  <Table className="w-5 h-5 absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Observations Table
                </label>
                <div className="relative">
                  <select
                    value={selectedObservationsTable}
                    onChange={(e) => setSelectedObservationsTable(e.target.value)}
                    disabled={!selectedBase || loadingTables}
                    className={`w-full px-3 py-2 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white disabled:bg-gray-800'
                        : 'bg-white border-gray-300 text-gray-900 disabled:bg-gray-100'
                    }`}
                  >
                    <option value="">Select observations table</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                  <Table className="w-5 h-5 absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={handleSave}
              disabled={loading || !token || !selectedBase || !selectedTable || !selectedObservationsTable}
              className={`flex items-center px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                darkMode
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-offset-gray-800'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};