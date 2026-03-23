import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subscription } from 'rxjs';
import { TodoService } from '../../services/todo.service';
import { TodoItem } from '../../models/todo.model';

@Component({
  selector: 'app-todos',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './todos.component.html',
  styleUrls: ['./todos.component.scss']
})
export class TodosComponent implements OnInit, OnDestroy {
  todos: TodoItem[] = [];
  newTodoText = '';
  private subscription?: Subscription;

  constructor(private todoService: TodoService) {}

  ngOnInit(): void {
    this.subscription = this.todoService.getTodos().subscribe(todos => {
      this.todos = todos;
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  addTodo(): void {
    if (this.newTodoText.trim()) {
      this.todoService.addTodo(this.newTodoText.trim());
      this.newTodoText = '';
    }
  }

  onDrop(event: CdkDragDrop<TodoItem[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const updatedTodos = [...this.todos];
    moveItemInArray(updatedTodos, event.previousIndex, event.currentIndex);
    this.todoService.updateTodosOrder(updatedTodos);
  }

  toggleTodo(id: string): void {
    this.todoService.toggleTodo(id);
  }

  onTodoItemClick(todo: TodoItem, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (todo.editing || this.isInteractiveElement(target)) {
      return;
    }
    this.toggleTodo(todo.id);
  }

  finishEditing(todo: TodoItem, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.editTodo(todo.id, value);
    todo.editing = false;
  }

  editTodo(id: string, newText: string): void {
    if (newText.trim()) {
      this.todoService.editTodo(id, newText.trim());
    }
  }

  deleteTodo(id: string): void {
    this.todoService.deleteTodo(id);
  }

  private isInteractiveElement(element: HTMLElement): boolean {
    return Boolean(element.closest('button, input, textarea, a, label'));
  }
}
