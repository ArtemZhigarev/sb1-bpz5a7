export interface Observation {
  id: string;
  title: string;
  description: string;
  date: Date;
  photos?: string[];
  type: 'pest' | 'disease' | 'growth' | 'weather' | 'other';
  observer?: 'David' | 'Artem';
  relatedTasks?: string[];
}