import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen" style="background:#0a0a0f">
      <!-- Scanline -->
      <div class="fixed inset-0 scanline opacity-20 pointer-events-none z-0"></div>

      <!-- Navbar -->
      <nav class="flex items-center justify-between px-8 py-4 relative z-10" style="background:#0f0f1a; border-bottom:1px solid #1a1a2e">
        <div class="flex items-center gap-3">
          <div class="text-xl font-bold" style="font-family:'Rajdhani',sans-serif; color:#ff2244; letter-spacing:3px">RANSOMFLOW</div>
          <span class="text-xs px-2 py-0.5 rounded" style="background:rgba(255,34,68,0.1); color:#ff2244; border:1px solid rgba(255,34,68,0.2)">v1.0.3</span>
        </div>
        <div class="flex items-center gap-6 text-xs font-mono">
          <a routerLink="/dashboard" style="color:#00d4ff">DASHBOARD</a>
          <a routerLink="/workflows" style="color:#666; hover:color:#00d4ff">WORKFLOWS</a>
          <a routerLink="/chat" style="color:#666">AI CHAT</a>
          <a routerLink="/settings" style="color:#666">SETTINGS</a>
          <button (click)="logout()" style="color:#ff2244; letter-spacing:1px">LOGOUT</button>
        </div>
      </nav>

      <div class="relative z-10 p-8 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8 animate-fade-in-up">
          <div class="text-xs font-mono mb-2" style="color:#666">// OPERATOR DASHBOARD</div>
          <h1 class="text-3xl font-bold" style="font-family:'Rajdhani',sans-serif; color:#e0e0e0; letter-spacing:2px">
            MISSION CONTROL
          </h1>
          <div class="mt-2 h-px w-48" style="background:linear-gradient(90deg,#ff2244,transparent)"></div>
        </div>

        <!-- Stats row -->
        <div class="grid grid-cols-4 gap-4 mb-8">
          <div *ngFor="let stat of stats" class="rf-card p-4 animate-fade-in-up">
            <div class="text-xs mb-1" style="color:#666; letter-spacing:2px">{{ stat.label }}</div>
            <div class="text-2xl font-bold" [style.color]="stat.color" style="font-family:'Rajdhani',sans-serif">{{ stat.value }}</div>
            <div class="text-xs mt-1" style="color:#444">{{ stat.sub }}</div>
          </div>
        </div>

        <!-- Workflows grid -->
        <div class="mb-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="text-xs font-mono" style="color:#666; letter-spacing:2px">// ACTIVE WORKFLOWS</div>
            <div class="h-px flex-1" style="background:#1a1a2e"></div>
            <a routerLink="/workflows" class="text-xs rf-btn" style="color:#00d4ff; letter-spacing:2px">VIEW ALL →</a>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div *ngFor="let flow of flows" class="rf-card p-5 cursor-pointer transition-all hover:border-red-500 animate-fade-in-up" style="border-color:#1a1a2e" (click)="runFlow(flow)">
              <div class="flex items-start justify-between mb-3">
                <div class="w-8 h-8 rounded flex items-center justify-center text-lg" [style.background]="flow.iconBg">{{ flow.icon }}</div>
                <span class="text-xs px-2 py-0.5 rounded" [style.background]="flow.tagBg" [style.color]="flow.tagColor">{{ flow.category }}</span>
              </div>
              <div class="font-bold mb-1" style="font-family:'Rajdhani',sans-serif; font-size:15px; letter-spacing:1px; color:#e0e0e0">{{ flow.name }}</div>
              <div class="text-xs" style="color:#555; line-height:1.5">{{ flow.description }}</div>
              <div class="mt-4 flex items-center gap-2">
                <div class="w-1.5 h-1.5 rounded-full" style="background:#00ff88"></div>
                <span class="text-xs" style="color:#00ff88">READY</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Terminal log -->
        <div class="rf-card p-4">
          <div class="text-xs mb-3 font-mono" style="color:#666; letter-spacing:2px">// SYSTEM LOG</div>
          <div class="font-mono text-xs space-y-1" style="color:#444">
            <div><span style="color:#ff6b00">[{{ ts() }}]</span> <span style="color:#00ff88">INFO</span> Platform initialized — 3 workflows active</div>
            <div><span style="color:#ff6b00">[{{ ts() }}]</span> <span style="color:#00d4ff">INFO</span> LM Studio proxy connected → {{ lmStatus }}</div>
            <div><span style="color:#ff6b00">[{{ ts() }}]</span> <span style="color:#666">DEBUG</span> NFS storage service reachable at :5000</div>
            <div><span style="color:#ff6b00">[{{ ts() }}]</span> <span style="color:#00ff88">INFO</span> n8n automation engine running — Telegram webhooks active</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  flows: any[] = [];
  lmStatus = 'google/gemma-3-4b';

  stats = [
    { label: 'WORKFLOWS ACTIVE', value: '3', color: '#00ff88', sub: 'All systems nominal' },
    { label: 'LLM TOKENS USED', value: '48.2K', color: '#00d4ff', sub: 'Today' },
    { label: 'RANSOM NOTES GEN', value: '127', color: '#ff2244', sub: 'Simulation mode' },
    { label: 'SYSTEM THREAT LVL', value: 'HIGH', color: '#ff6b00', sub: 'Active monitoring' },
  ];

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit() {
    this.api.getFlows().subscribe({
      next: (data: any[]) => {
        this.flows = data.map(f => ({
          ...f,
          icon: this.iconFor(f.id),
          iconBg: 'rgba(255,34,68,0.1)',
          tagBg: 'rgba(255,34,68,0.08)',
          tagColor: '#ff6b00',
        }));
      },
      error: () => this.flows = this.mockFlows(),
    });
    this.api.getLmHealth().subscribe({
      next: (h: any) => this.lmStatus = h.model || 'qwen2.5-7b',
      error: () => {}
    });
  }

  iconFor(id: string): string {
    const m: Record<string,string> = { ransom_generator: '🔐', file_encryptor: '🔒', threat_analyzer: '🎯', data_exfil_sim: '📡' };
    return m[id] || '⚡';
  }

  mockFlows() {
    return [
      { id:'ransom_generator', name:'Ransom Note Generator', description:'Generate AI ransom notes with custom parameters.', category:'security', icon:'🔐', iconBg:'rgba(255,34,68,0.1)', tagBg:'rgba(255,34,68,0.08)', tagColor:'#ff6b00' },
      { id:'file_encryptor',   name:'AI File Encryptor',    description:'Encrypt files with Fernet + AI key management.', category:'crypto', icon:'🔒', iconBg:'rgba(0,212,255,0.1)', tagBg:'rgba(0,212,255,0.08)', tagColor:'#00d4ff' },
      { id:'threat_analyzer',  name:'Threat Analyzer',      description:'Analyze CVEs and threat intelligence with local LLM.', category:'intel', icon:'🎯', iconBg:'rgba(0,255,136,0.1)', tagBg:'rgba(0,255,136,0.08)', tagColor:'#00ff88' },
    ];
  }

  runFlow(flow: any) { this.router.navigate(['/workflows']); }
  logout() { localStorage.removeItem('rf_token'); this.router.navigate(['/login']); }
  ts() { return new Date().toISOString().split('T')[1].split('.')[0]; }
}
