import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AccessLog } from '../types/access';

interface AccessState {
  logs: AccessLog[];
  addLog: (log: Omit<AccessLog, 'id'>) => void;
  updateLogStatus: (id: string, online: boolean) => void;
  clearLogs: () => void;
}

export const useAccessStore = create<AccessState>()(
  persist(
    (set) => ({
      logs: [],
      addLog: (logData) => {
        const log: AccessLog = {
          ...logData,
          id: `log-${Date.now()}`
        };
        set((state) => ({
          logs: [log, ...state.logs]
        }));
      },
      updateLogStatus: (id, online) => {
        set((state) => ({
          logs: state.logs.map((log) =>
            log.id === id
              ? { ...log, online, lastSeen: new Date() }
              : log
          )
        }));
      },
      clearLogs: () => set({ logs: [] })
    }),
    {
      name: 'access-logs',
      partialize: (state) => ({
        logs: state.logs.map(log => ({
          ...log,
          timestamp: log.timestamp.toISOString(),
          lastSeen: log.lastSeen.toISOString()
        }))
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.logs = state.logs.map(log => ({
            ...log,
            timestamp: new Date(log.timestamp),
            lastSeen: new Date(log.lastSeen)
          }));
        }
      }
    }
  )
);