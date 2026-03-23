import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskColumnComponent } from '../task-column/task-column.component';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskColumnComponent],
  templateUrl: './kanban-board.component.html',
  styleUrls: ['./kanban-board.component.scss']
})
export class KanbanBoardComponent implements OnInit {
  tasks: Task[] = [];
  newTaskTitle = '';
  newTaskDescription = '';

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
    });
  }

  get draftTasks(): Task[] {
    return this.tasks.filter(task => task.status === 'draft').sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  get inProgressTasks(): Task[] {
    return this.tasks.filter(task => task.status === 'inProgress').sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  get doneTasks(): Task[] {
    return this.tasks.filter(task => task.status === 'done').sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  createTask(): void {
    if (this.newTaskTitle.trim() && this.newTaskDescription.trim()) {
      this.taskService.addTask(this.newTaskTitle, this.newTaskDescription);
      this.newTaskTitle = '';
      this.newTaskDescription = '';
    }
  }

  onTaskDrop(event: CdkDragDrop<Task[]>, newStatus: 'draft' | 'inProgress' | 'done'): void {
    if (event.previousContainer === event.container) {
      // Reordering within the same column
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      // Update orders
      event.container.data.forEach((task, index) => {
        task.order = index;
      });
    } else {
      // Moving to different column
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      const task = event.container.data[event.currentIndex];
      task.status = newStatus;
      // Update orders for both containers
      event.previousContainer.data.forEach((t, index) => {
        t.order = index;
      });
      event.container.data.forEach((t, index) => {
        t.order = index;
      });
    }
    this.taskService.updateTasks(this.tasks);
  }
}