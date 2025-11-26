import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { DBService } from './services/db.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  currentTheme: 'dark' | 'light' = 'dark';

  constructor(private dbService: DBService) {}

  ngOnInit(): void {
    this.dbService.init().catch((err) => {
      console.error('Failed to initialize database', err);
    });

    const saved =
      (localStorage.getItem('theme') as 'dark' | 'light' | null) ?? 'dark';
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
    } catch {}
  }
}
