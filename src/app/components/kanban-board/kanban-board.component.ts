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
    return this.tasks.filter(task => task.status === 'draft');
  }

  get inProgressTasks(): Task[] {
    return this.tasks.filter(task => task.status === 'inProgress');
  }

  get doneTasks(): Task[] {
    return this.tasks.filter(task => task.status === 'done');
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
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      const task = event.container.data[event.currentIndex];
      this.taskService.updateTaskStatus(task.id, newStatus);
    }
  }
}