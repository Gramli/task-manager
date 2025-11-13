import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskCardComponent } from '../task-card/task-card.component';
import { Task } from '../../models/task.model';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-task-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, TaskCardComponent],
  templateUrl: './task-column.component.html',
  styleUrls: ['./task-column.component.scss']
})
export class TaskColumnComponent {
  @Input() title!: string;
  @Input() tasks: Task[] = [];
  @Input() status!: 'draft' | 'inProgress' | 'done';
  @Input() cdkDropListConnectedTo: string[] = [];
  @Output() taskDropped = new EventEmitter<CdkDragDrop<Task[]>>();

  onDrop(event: CdkDragDrop<Task[]>): void {
    this.taskDropped.emit(event);
  }
}