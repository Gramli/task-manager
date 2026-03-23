export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  editing?: boolean;
  order?: number;
}
