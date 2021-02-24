import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

export interface Config {
  googleClientId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly config: Promise<Config>;

  constructor(http: HttpClient) {
      this.config = http.get<Config>('api/config')
        .toPromise();
  }

  getConfig(): Promise<Config> {
    return this.config;
  }
}
