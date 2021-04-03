import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConnectableObservable, Observable, Subscription} from 'rxjs';
import {multicast, publish, publishLast, publishReplay, share, shareReplay} from 'rxjs/operators';

export interface Config {
  googleClientId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private readonly config: ConnectableObservable<Config>;

  constructor(http: HttpClient) {
    this.config = http.get<Config>('api/config')
      .pipe(publishReplay(1)) as ConnectableObservable<Config>
    this.config.connect()
  }

  getConfig(): Observable<Config> {
    return this.config;
  }
}
