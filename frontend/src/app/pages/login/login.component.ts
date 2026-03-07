import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center relative overflow-hidden" style="background:#0a0a0f">
      <!-- Scanline overlay -->
      <div class="absolute inset-0 scanline opacity-40 pointer-events-none"></div>

      <!-- Grid background -->
      <div class="absolute inset-0 opacity-5" style="background-image: linear-gradient(#ff2244 1px, transparent 1px), linear-gradient(90deg, #ff2244 1px, transparent 1px); background-size: 40px 40px;"></div>

      <!-- Corner decorations -->
      <div class="absolute top-6 left-6 text-xs font-mono" style="color:#ff2244">
        <span>RF://AUTH_GATE_v1.0</span><br>
        <span style="color:#333">{{ currentTime }}</span>
      </div>
      <div class="absolute top-6 right-6 text-xs font-mono text-right" style="color:#333">
        <span>NODE: ransomflow-prod</span><br>
        <span style="color:#00ff88">● ONLINE</span>
      </div>

      <!-- Login card -->
      <div class="rf-card rf-glow-red p-10 w-full max-w-sm animate-fade-in-up relative" style="border-color:#ff2244">
        <!-- Logo -->
        <div class="text-center mb-8">
          <div class="text-4xl font-bold mb-1" style="font-family:'Rajdhani',sans-serif; color:#ff2244; letter-spacing:4px; text-shadow: 0 0 30px rgba(255,34,68,0.5)">
            RANSOMFLOW
          </div>
          <div class="text-xs" style="color:#666; letter-spacing:3px">AI AUTOMATION PLATFORM</div>
          <div class="mt-3 h-px w-full" style="background: linear-gradient(90deg, transparent, #ff2244, transparent)"></div>
        </div>

        <!-- Status -->
        <div class="flex items-center gap-2 mb-6 text-xs font-mono p-2 rounded" style="background:rgba(0,255,136,0.05); border:1px solid rgba(0,255,136,0.1)">
          <div class="w-2 h-2 rounded-full" style="background:#00ff88; animation: pulse-red 2s infinite; box-shadow: 0 0 6px #00ff88"></div>
          <span style="color:#00ff88">SYSTEM READY — AWAITING CREDENTIALS</span>
        </div>

        <!-- Form -->
        <div class="space-y-4">
          <div>
            <label class="block text-xs mb-1" style="color:#666; letter-spacing:2px">EMAIL</label>
            <input
              class="rf-input"
              type="email"
              placeholder="operator@ransomflow.htb"
              [(ngModel)]="email"
              (keyup.enter)="login()"
            />
          </div>
          <div>
            <label class="block text-xs mb-1" style="color:#666; letter-spacing:2px">PASSWORD</label>
            <input
              class="rf-input"
              type="password"
              placeholder="••••••••••••"
              [(ngModel)]="password"
              (keyup.enter)="login()"
            />
          </div>
        </div>

        <!-- Error -->
        <div *ngIf="error" class="mt-3 text-xs p-2 rounded" style="background:rgba(255,34,68,0.1); border:1px solid rgba(255,34,68,0.3); color:#ff2244">
          ✗ {{ error }}
        </div>

        <!-- Submit -->
        <button
          class="rf-btn rf-btn-primary w-full mt-6 py-3"
          (click)="login()"
          [disabled]="loading"
          style="font-size:14px; letter-spacing:3px"
        >
          <span *ngIf="!loading">AUTHENTICATE</span>
          <span *ngIf="loading" class="terminal-cursor">VERIFYING</span>
        </button>

        <!-- Footer -->
        <div class="mt-6 text-center text-xs" style="color:#333">
          RansomFlow v1.0.3 — Vertex Coders LLC<br>
          <span style="color:#ff2244">UNAUTHORIZED ACCESS IS MONITORED</span>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';
  currentTime = new Date().toISOString();

  constructor(private api: ApiService, private router: Router) {
    setInterval(() => this.currentTime = new Date().toISOString(), 1000);
  }

  login() {
    if (!this.email || !this.password) { this.error = 'Credentials required'; return; }
    this.loading = true;
    this.error = '';
    this.api.login(this.email, this.password).subscribe({
      next: (res) => {
        localStorage.setItem('rf_token', res.access_token);
        this.router.navigate(['/dashboard']);
      },
      error: () => { this.error = 'Invalid credentials'; this.loading = false; }
    });
  }
}
