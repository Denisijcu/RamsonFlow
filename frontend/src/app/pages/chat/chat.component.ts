import { Component, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

interface Message { role: 'user'|'assistant'|'system'; content: string; ts: string; }

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col" style="background:#0a0a0f">
      <div class="fixed inset-0 scanline opacity-20 pointer-events-none z-0"></div>

      <!-- Nav -->
      <nav class="flex items-center justify-between px-8 py-4 relative z-10" style="background:#0f0f1a; border-bottom:1px solid #1a1a2e">
        <div class="text-xl font-bold" style="font-family:'Rajdhani',sans-serif; color:#ff2244; letter-spacing:3px">RANSOMFLOW</div>
        <div class="flex items-center gap-6 text-xs font-mono">
          <a routerLink="/dashboard" style="color:#666">DASHBOARD</a>
          <a routerLink="/workflows" style="color:#666">WORKFLOWS</a>
          <a routerLink="/chat" style="color:#00d4ff">AI CHAT</a>
          <a routerLink="/settings" style="color:#666">SETTINGS</a>
        </div>
      </nav>

      <!-- Chat layout -->
      <div class="flex flex-1 relative z-10" style="height:calc(100vh - 61px)">
        <!-- Sidebar -->
        <div class="w-56 p-4 flex flex-col gap-2" style="background:#0f0f1a; border-right:1px solid #1a1a2e">
          <div class="text-xs mb-2 font-mono" style="color:#666; letter-spacing:2px">// SESSIONS</div>
          <div *ngFor="let s of sessions" class="p-3 rounded cursor-pointer text-xs font-mono" [style.background]="s.active ? 'rgba(255,34,68,0.1)' : 'transparent'" [style.borderColor]="s.active ? '#ff2244' : 'transparent'" style="border:1px solid">
            <div style="color:#e0e0e0">{{ s.name }}</div>
            <div style="color:#444">{{ s.ts }}</div>
          </div>
          <button class="mt-auto text-xs rf-btn py-2" style="background:rgba(255,34,68,0.1); color:#ff2244; border:1px solid rgba(255,34,68,0.2); letter-spacing:2px" (click)="clearChat()">+ NEW SESSION</button>
        </div>

        <!-- Main chat -->
        <div class="flex-1 flex flex-col">
          <!-- Model badge -->
          <div class="flex items-center gap-3 px-6 py-2" style="background:#0f0f1a; border-bottom:1px solid #1a1a2e">
            <div class="w-2 h-2 rounded-full" style="background:#00ff88; box-shadow:0 0 6px #00ff88"></div>
            <span class="text-xs font-mono" style="color:#666">MODEL: {{ activeModel }}</span>
            <span class="text-xs font-mono ml-auto" style="color:#333">TOOL CALLS: ENABLED</span>
          </div>

          <!-- Messages -->
          <div #msgContainer class="flex-1 overflow-y-auto p-6 space-y-4">
            <!-- Welcome -->
            <div *ngIf="messages.length === 0" class="text-center py-16">
              <div class="text-4xl mb-4">🔐</div>
              <div class="text-sm font-mono" style="color:#444">RansomFlow AI — Powered by Vertex Coders LLC  - Model Active: {{ activeModel }}</div>
              <div class="text-xs mt-2" style="color:#333">Workflow automation & security simulation</div>
            </div>

            <div *ngFor="let msg of messages" class="flex" [class.justify-end]="msg.role==='user'">
              <div class="max-w-2xl">
                <div class="text-xs mb-1 font-mono" [style.color]="msg.role==='user' ? '#666' : '#ff6b00'">
                  {{ msg.role === 'user' ? 'OPERATOR' : 'RANSOMFLOW AI' }} · {{ msg.ts }}
                </div>
                <div class="p-4 rounded text-sm font-mono leading-relaxed whitespace-pre-wrap"
                  [style.background]="msg.role==='user' ? 'rgba(0,212,255,0.05)' : 'rgba(255,34,68,0.05)'"
                  [style.border]="msg.role==='user' ? '1px solid rgba(0,212,255,0.1)' : '1px solid rgba(255,34,68,0.1)'"
                  [style.color]="msg.role==='user' ? '#00d4ff' : '#e0e0e0'">
                  {{ msg.content }}
                </div>
              </div>
            </div>

            <!-- Typing indicator -->
            <div *ngIf="loading" class="flex">
              <div class="p-4 rounded text-sm font-mono" style="background:rgba(255,34,68,0.05); border:1px solid rgba(255,34,68,0.1)">
                <span class="terminal-cursor" style="color:#ff6b00">RANSOMFLOW AI PROCESSING</span>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="p-4" style="background:#0f0f1a; border-top:1px solid #1a1a2e">
            <div class="flex gap-3">
              <input
                class="rf-input flex-1"
                placeholder="Enter workflow query or command..."
                [(ngModel)]="input"
                (keyup.enter)="send()"
                [disabled]="loading"
              />
              <button class="rf-btn rf-btn-primary px-6" (click)="send()" [disabled]="loading || !input.trim()">
                SEND
              </button>
            </div>
            <div class="text-xs mt-2 font-mono" style="color:#333">
              ⚠ Tool calls active — execute_command, read_storage, send_alert
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('msgContainer') private msgContainer!: ElementRef;

  messages: Message[] = [];
  input = '';
  loading = false;
  activeModel = 'google/gemma-3-4b';

  sessions = [
    { name: 'Session #1', ts: '07/03/2026', active: true },
    { name: 'Session #2', ts: '06/03/2026', active: false },
  ];

  constructor(private api: ApiService) {}

  ngAfterViewChecked() {
    if (this.msgContainer) {
      const el = this.msgContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  send() {
    if (!this.input.trim() || this.loading) return;
    const userMsg: Message = { role: 'user', content: this.input, ts: this.ts() };
    this.messages.push(userMsg);
    const history = this.messages.map(m => ({ role: m.role, content: m.content }));
    this.loading = true;
    this.input = '';

    this.api.chat(userMsg.content, history).subscribe({
      next: (res: any) => {
        this.messages.push({ role: 'assistant', content: res.response || res.result || 'No response', ts: this.ts() });
        this.loading = false;
      },
      error: () => {
        this.messages.push({ role: 'assistant', content: '[ERROR] AI service unreachable. Check LM Studio.', ts: this.ts() });
        this.loading = false;
      }
    });
  }

  clearChat() { this.messages = []; }
  ts() { return new Date().toISOString().split('T')[1].split('.')[0]; }
}
