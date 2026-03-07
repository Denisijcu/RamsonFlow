import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen" style="background:#0a0a0f">
      <div class="fixed inset-0 scanline opacity-20 pointer-events-none z-0"></div>

      <nav class="flex items-center justify-between px-8 py-4 relative z-10" style="background:#0f0f1a; border-bottom:1px solid #1a1a2e">
        <div class="text-xl font-bold" style="font-family:'Rajdhani',sans-serif; color:#ff2244; letter-spacing:3px">RANSOMFLOW</div>
        <div class="flex items-center gap-6 text-xs font-mono">
          <a routerLink="/dashboard" style="color:#666">DASHBOARD</a>
          <a routerLink="/workflows" style="color:#666">WORKFLOWS</a>
          <a routerLink="/chat" style="color:#666">AI CHAT</a>
          <a routerLink="/settings" style="color:#00d4ff">SETTINGS</a>
        </div>
      </nav>

      <div class="relative z-10 p-8 max-w-4xl mx-auto">
        <div class="mb-8">
          <div class="text-xs font-mono mb-2" style="color:#666; letter-spacing:2px">// PLATFORM CONFIGURATION</div>
          <h1 class="text-3xl font-bold" style="font-family:'Rajdhani',sans-serif; letter-spacing:2px; color:#e0e0e0">AI ENGINE SETTINGS</h1>
          <div class="mt-2 h-px w-48" style="background:linear-gradient(90deg,#ff2244,transparent)"></div>
        </div>

        <!-- LM Studio Status -->
        <div class="rf-card p-5 mb-6 animate-fade-in-up">
          <div class="flex items-center justify-between mb-4">
            <div class="text-sm font-bold" style="font-family:'Rajdhani',sans-serif; letter-spacing:2px; color:#e0e0e0">LM STUDIO CONNECTION</div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full" [style.background]="lmConnected ? '#00ff88' : '#ff2244'" [style.boxShadow]="lmConnected ? '0 0 6px #00ff88' : '0 0 6px #ff2244'"></div>
              <span class="text-xs font-mono" [style.color]="lmConnected ? '#00ff88' : '#ff2244'">{{ lmConnected ? 'CONNECTED' : 'DISCONNECTED' }}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs mb-1 font-mono" style="color:#666; letter-spacing:2px">LM STUDIO URL</label>
              <input class="rf-input" [(ngModel)]="settings.lmStudioUrl" placeholder="http://host.docker.internal:1234" />
            </div>
            <div>
              <label class="block text-xs mb-1 font-mono" style="color:#666; letter-spacing:2px">ACTIVE MODEL</label>
              <select class="rf-input" [(ngModel)]="settings.activeModel" style="cursor:pointer">
                <option *ngFor="let m of models" [value]="m.id" style="background:#0f0f1a">
                  {{ m.name }} ({{ m.size }}) {{ m.recommended ? '★' : '' }}
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Model Cards -->
        <div class="rf-card p-5 mb-6 animate-fade-in-up">
          <div class="text-sm font-bold mb-4" style="font-family:'Rajdhani',sans-serif; letter-spacing:2px; color:#e0e0e0">SUPPORTED MODELS</div>
          <div class="grid grid-cols-2 gap-3">
            <div *ngFor="let m of models"
              class="p-3 rounded cursor-pointer transition-all"
              [style.background]="settings.activeModel === m.id ? 'rgba(255,34,68,0.1)' : 'rgba(255,255,255,0.02)'"
              [style.border]="settings.activeModel === m.id ? '1px solid rgba(255,34,68,0.4)' : '1px solid #1a1a2e'"
              (click)="settings.activeModel = m.id">
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold font-mono" style="color:#e0e0e0">{{ m.name }}</span>
                <span *ngIf="m.recommended" class="text-xs px-1.5 py-0.5 rounded" style="background:rgba(0,255,136,0.1); color:#00ff88; border:1px solid rgba(0,255,136,0.2)">RECOMMENDED</span>
              </div>
              <div class="flex gap-3 text-xs font-mono" style="color:#555">
                <span>{{ m.size }}</span>
                <span [style.color]="m.speed === 'fast' ? '#00ff88' : '#ff6b00'">{{ m.speed.toUpperCase() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Inference params -->
        <div class="rf-card p-5 mb-6 animate-fade-in-up">
          <div class="text-sm font-bold mb-4" style="font-family:'Rajdhani',sans-serif; letter-spacing:2px; color:#e0e0e0">INFERENCE PARAMETERS</div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="block text-xs mb-1 font-mono" style="color:#666; letter-spacing:2px">TEMPERATURE: {{ settings.temperature }}</label>
              <input type="range" min="0" max="2" step="0.1" [(ngModel)]="settings.temperature" class="w-full" style="accent-color:#ff2244" />
            </div>
            <div>
              <label class="block text-xs mb-1 font-mono" style="color:#666; letter-spacing:2px">MAX TOKENS</label>
              <input class="rf-input" type="number" [(ngModel)]="settings.maxTokens" min="100" max="8192" />
            </div>
            <div>
              <label class="block text-xs mb-1 font-mono" style="color:#666; letter-spacing:2px">CONTEXT WINDOW</label>
              <input class="rf-input" type="number" [(ngModel)]="settings.contextWindow" min="1024" max="32768" />
            </div>
          </div>
        </div>

        <!-- Save -->
        <div class="flex gap-4">
          <button class="rf-btn rf-btn-primary px-8 py-3" (click)="save()" style="letter-spacing:3px">
            {{ saved ? '✓ SAVED' : 'SAVE SETTINGS' }}
          </button>
          <button class="rf-btn px-8 py-3" (click)="testConnection()" style="background:rgba(0,212,255,0.1); color:#00d4ff; border:1px solid rgba(0,212,255,0.2); letter-spacing:2px; font-size:13px">
            TEST CONNECTION
          </button>
        </div>

        <div *ngIf="statusMsg" class="mt-4 text-xs font-mono p-3 rounded" [style.background]="statusOk ? 'rgba(0,255,136,0.05)' : 'rgba(255,34,68,0.05)'" [style.color]="statusOk ? '#00ff88' : '#ff2244'">
          {{ statusMsg }}
        </div>
      </div>
    </div>
  `,
})
export class SettingsComponent implements OnInit {
  settings: any = { lmStudioUrl:'http://host.docker.internal:1234', activeModel:'qwen2.5-7b-instruct', temperature:0.7, maxTokens:1000, contextWindow:4096 };
  models: any[] = [];
  lmConnected = false;
  saved = false;
  statusMsg = '';
  statusOk = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getLmSettings().subscribe({
      next: (data: any) => { this.settings = data.settings; this.models = data.models; },
      error: () => this.models = this.defaultModels(),
    });
    this.api.getLmHealth().subscribe({
      next: (h: any) => this.lmConnected = h.status === 'ok',
      error: () => {}
    });
  }

  save() {
    this.api.updateLmSettings(this.settings).subscribe({
      next: () => { this.saved = true; setTimeout(() => this.saved = false, 2000); },
      error: () => {}
    });
  }

  testConnection() {
    this.api.getLmHealth().subscribe({
      next: (h: any) => {
        this.lmConnected = h.status === 'ok';
        this.statusOk = this.lmConnected;
        this.statusMsg = this.lmConnected ? `✓ Connected — Model: ${h.model}` : '✗ LM Studio unreachable. Start LM Studio and load a model.';
      },
      error: () => { this.statusOk = false; this.statusMsg = '✗ Proxy error'; }
    });
  }

  defaultModels() {
    return [
      { id:'qwen2.5-7b-instruct', name:'Qwen 2.5 7B', size:'4.7GB', speed:'fast', recommended:true },
      { id:'llama-3.1-8b-instruct', name:'LLaMA 3.1 8B', size:'4.9GB', speed:'medium', recommended:false },
      { id:'mistral-7b-instruct-v0.3', name:'Mistral 7B', size:'4.1GB', speed:'fast', recommended:false },
      { id:'phi-3.5-mini-instruct', name:'Phi 3.5 Mini', size:'2.2GB', speed:'fast', recommended:false },
    ];
  }
}
