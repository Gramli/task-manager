import { Routes } from '@angular/router';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';
import { StickyDashboardComponent } from './components/sticky-dasboard/sticky-dashboard.component';
import { TodosComponent } from './components/todos/todos.component';

export const routes: Routes = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  { path: 'tasks', component: KanbanBoardComponent },
  { path: 'stickies', component: StickyDashboardComponent },
  { path: 'todos', component: TodosComponent },
];
