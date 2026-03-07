import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-workflows',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-screen" style="background:#0a0a0f">
      <div class="fixed inset-0 scanline opacity-20 pointer-events-none z-0"></div>

      <nav class="flex items-center justify-between px-8 py-4 relative z-10" style="background:#0f0f1a; border-bottom:1px solid #1a1a2e">
        <div class="text-xl font-bold" style="font-family:'Rajdhani',sans-serif; color:#ff2244; letter-spacing:3px">RANSOMFLOW</div>
        <div class="flex items-center gap-6 text-xs font-mono">
          <a routerLink="/dashboard" style="color:#666">DASHBOARD</a>
          <a routerLink="/workflows" style="color:#00d4ff">WORKFLOWS</a>
          <a routerLink="/chat" style="color:#666">AI CHAT</a>
          <a routerLink="/settings" style="color:#666">SETTINGS</a>
        </div>
      </nav>

      <div class="relative z-10 p-8 max-w-6xl mx-auto">
        <div class="mb-8">
          <div class="text-xs font-mono mb-2" style="color:#666; letter-spacing:2px">// WORKFLOW EXECUTOR</div>
          <h1 class="text-3xl font-bold" style="font-family:'Rajdhani',sans-serif; letter-spacing:2px; color:#e0e0e0">ACTIVE WORKFLOWS</h1>
          <div class="mt-2 h-px w-48" style="background:linear-gradient(90deg,#ff2244,transparent)"></div>
        </div>

        <div class="grid grid-cols-3 gap-6 mb-8">
          <div *ngFor="let flow of flows" class="rf-card p-5 animate-fade-in-up" [style.borderColor]="selected?.id===flow.id ? '#ff2244' : '#1a1a2e'" style="cursor:pointer" (click)="select(flow)">
            <div class="text-lg mb-2">{{ flow.icon }}</div>
            <div class="font-bold mb-1" style="font-family:'Rajdhani',sans-serif; letter-spacing:1px; color:#e0e0e0">{{ flow.name }}</div>
            <div class="text-xs mb-3" style="color:#555">{{ flow.description }}</div>
            <div class="flex items-center gap-2">
              <div class="w-1.5 h-1.5 rounded-full" style="background:#00ff88"></div>
              <span class="text-xs font-mono" style="color:#00ff88">READY</span>
            </div>
          </div>
        </div>

        <!-- Executor panel -->
        <div *ngIf="selected" class="rf-card p-6 animate-fade-in-up" style="border-color:#ff2244">
          <div class="text-sm font-bold mb-4" style="font-family:'Rajdhani',sans-serif; letter-spacing:2px; color:#ff2244">
            EXECUTING: {{ selected.name }}
          </div>
          <div class="mb-4">
            <label class="block text-xs mb-2 font-mono" style="color:#666; letter-spacing:2px">INPUT PAYLOAD</label>
            <textarea class="rf-input" rows="4" [(ngModel)]="payload" placeholder="Enter workflow input..." style="resize:vertical"></textarea>
          </div>
          <div class="flex gap-3">
            <button class="rf-btn rf-btn-primary px-8 py-2" (click)="run()" [disabled]="running" style="letter-spacing:2px">
              {{ running ? 'EXECUTING...' : '▶ EXECUTE' }}
            </button>
            <button class="rf-btn px-6 py-2" (click)="selected=null; result=''" style="background:rgba(255,255,255,0.03); color:#666; border:1px solid #1a1a2e; letter-spacing:2px; font-size:12px">CANCEL</button>
          </div>
          <div *ngIf="result" class="mt-4 p-4 rounded font-mono text-xs whitespace-pre-wrap" style="background:rgba(0,0,0,0.4); border:1px solid #1a1a2e; color:#00ff88; max-height:300px; overflow-y:auto">{{ result }}</div>
        </div>
      </div>
    </div>
  `,
})
export class WorkflowsComponent implements OnInit {
  flows: any[] = [];
  selected: any = null;
  payload = '';
  result = '';
  running = false;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.getFlows().subscribe({
      next: (data: any[]) => this.flows = data.map(f => ({ ...f, icon: this.iconFor(f.id) })),
      error: () => this.flows = this.mockFlows(),
    });
  }

  select(flow: any) { this.selected = flow; this.payload = ''; this.result = ''; }

  run() {
    if (!this.payload.trim()) return;
    this.running = true;
    this.api.processFlow(this.selected.id, this.payload).subscribe({
      next: (res: any) => { this.result = JSON.stringify(res, null, 2); this.running = false; },
      error: (e: any) => { this.result = `Error: ${e.message}`; this.running = false; }
    });
  }

  iconFor(id: string): string {
    const m: Record<string,string> = { ransom_generator:'🔐', file_encryptor:'🔒', threat_analyzer:'🎯' };
    return m[id] || '⚡';
  }

  mockFlows() {
    return [
      { id:'ransom_generator', name:'Ransom Note Generator', description:'Generate AI-powered ransom notes.', icon:'🔐' },
      { id:'file_encryptor',   name:'AI File Encryptor',    description:'Encrypt files with Fernet + AI.', icon:'🔒' },
      { id:'threat_analyzer',  name:'Threat Analyzer',      description:'Analyze CVEs with local LLM.', icon:'🎯' },
    ];
  }
}
