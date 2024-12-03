import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { env } from '../config/env';

interface TelegramConfig {
  botToken: string;
  authorizedUsers: Array<{
    id: string;
    username: string;
    firstName: string;
  }>;
}

export type CacheDuration = '5min' | '12h' | 'infinite';

interface SettingsState {
  airtableToken: string;
  airtableBase: string;
  airtableTable: string;
  observationsTable: string;
  telegram: TelegramConfig;
  darkMode: boolean;
  cacheDuration: CacheDuration;
  isConfigured: boolean;
  setAirtableConfig: (token: string, base: string, table: string, observationsTable: string) => void;
  setTelegramConfig: (config: Partial<TelegramConfig>) => void;
  addTelegramUser: (user: TelegramConfig['authorizedUsers'][0]) => void;
  removeTelegramUser: (userId: string) => void;
  toggleDarkMode: () => void;
  setCacheDuration: (duration: CacheDuration) => void;
  clearConfig: () => void;
}

const initialTelegramConfig: TelegramConfig = {
  botToken: env.telegramBotToken,
  authorizedUsers: [],
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      airtableToken: env.airtableToken,
      airtableBase: env.airtableBase,
      airtableTable: env.airtableTable,
      observationsTable: env.observationsTable,
      telegram: initialTelegramConfig,
      darkMode: false,
      cacheDuration: '12h',
      isConfigured: Boolean(env.airtableToken && env.airtableBase && env.airtableTable && env.observationsTable),
      setAirtableConfig: (token, base, table, observationsTable) =>
        set({ 
          airtableToken: token, 
          airtableBase: base, 
          airtableTable: table,
          observationsTable,
          isConfigured: true 
        }),
      setTelegramConfig: (config) =>
        set((state) => ({
          telegram: {
            ...state.telegram || initialTelegramConfig,
            ...config,
            authorizedUsers: state.telegram?.authorizedUsers || []
          }
        })),
      addTelegramUser: (user) =>
        set((state) => {
          const currentUsers = state.telegram?.authorizedUsers || [];
          return {
            telegram: {
              ...state.telegram || initialTelegramConfig,
              authorizedUsers: [...currentUsers.filter(u => u.id !== user.id), user]
            }
          };
        }),
      removeTelegramUser: (userId) =>
        set((state) => {
          const currentUsers = state.telegram?.authorizedUsers || [];
          return {
            telegram: {
              ...state.telegram || initialTelegramConfig,
              authorizedUsers: currentUsers.filter(user => user.id !== userId)
            }
          };
        }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      setCacheDuration: (duration) => set({ cacheDuration: duration }),
      clearConfig: () =>
        set({ 
          airtableToken: env.airtableToken, 
          airtableBase: env.airtableBase, 
          airtableTable: env.airtableTable,
          observationsTable: env.observationsTable,
          telegram: initialTelegramConfig, 
          isConfigured: Boolean(env.airtableToken && env.airtableBase && env.airtableTable && env.observationsTable)
        }),
    }),
    {
      name: 'taskflow-settings',
      partialize: (state) => ({
        telegram: state.telegram || initialTelegramConfig,
        darkMode: state.darkMode,
        cacheDuration: state.cacheDuration,
      }),
    }
  )
);