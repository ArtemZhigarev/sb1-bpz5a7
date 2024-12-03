export type Priority = 'low' | 'medium' | 'high';
export type DelayOption = 1 | 2 | 7 | 14;
export type TaskStatus = 'To do' | 'In progress' | 'Done';
export type TaskImportance = 'normal' | 'urgent';

export interface Employee {
  id: string;
  name: string;
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: Date;
  status: TaskStatus;
  completedDate?: Date;
  priority: Priority;
  importance: TaskImportance;
  images: string[];
  assigneeId: string | null;
  isRepeating?: boolean;
  repeatEveryDays?: number;
}