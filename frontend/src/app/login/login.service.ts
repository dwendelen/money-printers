import {Injectable, NgZone} from '@angular/core';
import {Config, ConfigService} from '../config/config.service';
import {Observable, from, Subject, BehaviorSubject} from 'rxjs';
import {map, mergeMap, shareReplay} from 'rxjs/operators';
import GoogleAuth = gapi.auth2.GoogleAuth;
import GoogleUser = gapi.auth2.GoogleUser;
import {v4 as uuid_v4} from 'uuid';


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
  private user = new TestLoggedInUser();
  private subject = new BehaviorSubject<TestLoggedInUser | null>(this.user);

  getLoggedInUser(): Observable<LoggedInUser | null> {
    return this.subject;
  }

  logout(): void {
    this.subject.next(null);
  }
}

class TestLoggedInUser implements LoggedInUser {
  private id = uuid_v4();

  getId(): string {
    return this.id;
  }

  getName(): string {
    return 'Test';
  }

  getToken(): string {
    return 'token';
  }
}
