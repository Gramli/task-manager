import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KanbanBoardComponent } from './components/kanban-board/kanban-board.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [KanbanBoardComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  currentTheme: 'dark' | 'light' = 'dark';

  ngOnInit(): void {
    const saved = (localStorage.getItem('theme') as 'dark' | 'light' | null) ?? 'dark';
    this.setTheme(saved);
  }

  toggleTheme(): void {
    this.setTheme(this.currentTheme === 'dark' ? 'light' : 'dark');
  }

  private setTheme(theme: 'dark' | 'light'): void {
    this.currentTheme = theme;
    try {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    } catch {
      /* no-op for non-browser environments */
    }
  }
}