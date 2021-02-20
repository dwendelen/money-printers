import {Injectable, NgZone} from '@angular/core';
import {Config, ConfigService} from '../config/config.service';
import {Observable, from, BehaviorSubject} from 'rxjs';
import {map, mergeMap, shareReplay} from 'rxjs/operators';
import GoogleAuth = gapi.auth2.GoogleAuth;
import GoogleUser = gapi.auth2.GoogleUser;

export abstract class LoginService {
  abstract getLoggedInUser(): Observable<LoggedInUser | null>;
  abstract logout(): void;
}

export interface LoggedInUser {
  getId(): string;
  getName(): string;
  getToken(): string;
}

@Injectable({
  providedIn: 'root'
})
export class GoogleLoginService implements LoginService {
  constructor(configService: ConfigService, private ngZone: NgZone) {
    this.googleAuth = Promise.all([configService.getConfig(), GoogleLoginService.apiLoaded()])
      .then(arr => GoogleLoginService.initAuth(arr[0]))
      .catch(() => Promise.reject('Could not load google api'));

    this.user = from(this.googleAuth).pipe(
      mergeMap(ga => GoogleLoginService.loggedInUser(ga, ngZone)),
      map(gu => gu ? new GoogleLoggedInUser(gu) : null),
      shareReplay()
    );
  }

  private readonly googleAuth: Promise<GoogleAuth>;
  private readonly user: Observable<GoogleLoggedInUser | null>;

  private static initAuth(config: Config): Promise<GoogleAuth> {
    return gapi.auth2.init({
      client_id: config.googleClientId
    }).then(
      ga => ga,
        err => Promise.reject(err.error)
    );
  }

  private static loggedInUser(auth: GoogleAuth, ngZone: NgZone): Observable<GoogleUser | null> {
    return new Observable<GoogleUser>(sub => {
        auth.currentUser.listen(usr => {
          ngZone.run(() => {
            sub.next(usr);
          });
        });
        sub.next(auth.currentUser.get());
    }).pipe(
      map(user => user.isSignedIn() ? user : null)
    );
  }

  private static apiLoaded(): Promise<void> {
    return new Promise((res, rej) => {
        gapi.load('auth2', {
          callback: () => res(),
          onerror: () => rej('Could not load google api')
        });
    });
  }

  getGoogleAuth(): Promise<GoogleAuth> {
    return this.googleAuth;
  }

  getLoggedInUser(): Observable<LoggedInUser | null> {
    return this.user;
  }

  logout(): void {
    this.googleAuth.then(ga => ga.signOut());
  }
}

class GoogleLoggedInUser implements LoggedInUser {
  constructor(private googleUser: GoogleUser) {  }

  getId(): string {
    return this.googleUser.getBasicProfile().getId();
  }

  getName(): string {
    return this.googleUser.getBasicProfile().getGivenName();
  }

  getToken(): string {
    return this.googleUser.getAuthResponse().id_token;
  }
}

@Injectable({
  providedIn: 'root'
})
export class TestLoginService implements LoginService {
  private readonly user!: TestLoggedInUser;
  private readonly subject!: BehaviorSubject<TestLoggedInUser | null>;

  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    const usr = urlParams.get('user');
    if (!usr) {
      throw new Error('Invalid user param');
    }
    this.user = new TestLoggedInUser(usr);
    this.subject = new BehaviorSubject<TestLoggedInUser | null>(this.user);
  }

  getLoggedInUser(): Observable<LoggedInUser | null> {
    return this.subject;
  }

  logout(): void {
    this.subject.next(null);
  }
}

class TestLoggedInUser implements LoggedInUser {
  constructor(
    private name: string
  ) {
  }

  getId(): string {
    return this.name;
  }

  getName(): string {
    return this.name;
  }

  getToken(): string {
    return this.name;
  }
}
