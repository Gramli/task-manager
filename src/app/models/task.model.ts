export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'inProgress' | 'done';
  timeSpent: number; // accumulated seconds when timer not running
  isTimerActive: boolean;
  startedAt?: number; // timestamp ms when timer was started
  createdAt: Date;
}