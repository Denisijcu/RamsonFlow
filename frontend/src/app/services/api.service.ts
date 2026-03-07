import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    const token = localStorage.getItem('rf_token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.base}/auth/login`, { email, password });
  }

  getFlows(): Observable<any> {
    return this.http.get(`${this.base}/v1/flows`, { headers: this.headers });
  }

  processFlow(flowId: string, input: string): Observable<any> {
    return this.http.post(`${this.base}/v1/process`, { flow_id: flowId, input }, { headers: this.headers });
  }

  chat(message: string, history: any[] = []): Observable<any> {
    return this.http.post(`${this.base}/chat`, { message, history }, { headers: this.headers });
  }

  getConfig(): Observable<any> {
    return this.http.get(`${this.base}/config`, { headers: this.headers });
  }

  getLmSettings(): Observable<any> {
    return this.http.get('/lm/settings');
  }

  updateLmSettings(settings: any): Observable<any> {
    return this.http.post('/lm/settings', settings);
  }

  getLmHealth(): Observable<any> {
    return this.http.get('/lm/health');
  }
}
