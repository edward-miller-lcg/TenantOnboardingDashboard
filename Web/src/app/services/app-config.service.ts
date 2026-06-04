import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

export interface AppConfig {
  apiUrl: string;
}

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  config?: AppConfig;

  constructor(private http: HttpClient) {}

  async loadConfig(): Promise<AppConfig | undefined> {
    try {
      this.config = await this.http.get<AppConfig>('/app.config.json').toPromise();
    } catch {
      this.config = { apiUrl: '/api' };
    }
    return this.config;
  }
}
