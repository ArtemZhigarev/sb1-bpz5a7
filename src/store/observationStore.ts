import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Observation } from '../types/observation';
import { addDays } from 'date-fns';

interface ObservationState {
  observations: Observation[];
  selectedObservationId: string | null;
  addObservation: (observation: Omit<Observation, 'id'>) => void;
  updateObservation: (id: string, updates: Partial<Observation>) => void;
  deleteObservation: (id: string) => void;
  setSelectedObservationId: (id: string | null) => void;
}

export const useObservationStore = create<ObservationState>()(
  persist(
    (set) => ({
      observations: [],
      selectedObservationId: null,
      addObservation: (observationData) => {
        const observation: Observation = {
          ...observationData,
          id: `obs-${Date.now()}`,
        };
        set((state) => ({
          observations: [observation, ...state.observations],
        }));
      },
      updateObservation: (id, updates) => {
        set((state) => ({
          observations: state.observations.map((obs) =>
            obs.id === id ? { ...obs, ...updates } : obs
          ),
        }));
      },
      deleteObservation: (id) => {
        set((state) => ({
          observations: state.observations.filter((obs) => obs.id !== id),
          selectedObservationId: null,
        }));
      },
      setSelectedObservationId: (id) => set({ selectedObservationId: id }),
    }),
    {
      name: 'observations-storage',
      partialize: (state) => ({
        observations: state.observations.map((obs) => ({
          ...obs,
          date: obs.date.toISOString(),
        })),
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.observations = state.observations.map((obs) => ({
            ...obs,
            date: new Date(obs.date),
          }));
        }
      },
    }
  )
);