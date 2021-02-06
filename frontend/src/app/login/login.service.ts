import {Injectable, NgZone} from '@angular/core';
import {Config, ConfigService} from '../config/config.service';
import {Observable, from} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';
import GoogleAuth = gapi.auth2.GoogleAuth;
import {flatMap} from 'rxjs/internal/operators';
import GoogleUser = gapi.auth2.GoogleUser;

export interface LoginService {
  getLoggedInUser(): Observable<LoggedInUser>;
  logout(): void;
}

export interface LoggedInUser {
  getName(): string;
  getToken(): string;
}

@Injectable({
  providedIn: 'root'
})
export class LoginService implements LoginService {
  constructor(configService: ConfigService, private ngZone: NgZone) {
    this.googleAuth = Promise.all([configService.getConfig(), LoginService.apiLoaded()])
      .then(arr => LoginService.initAuth(arr[0]));

    this.user = from(this.googleAuth).pipe(
      flatMap(ga => LoginService.loggedInUser(ga, ngZone)),
      map(gu => gu ? new GoogleLoggedInUser(gu) : null),
      shareReplay()
    );
  }

  private readonly googleAuth: Promise<GoogleAuth>;
  private readonly user: Observable<GoogleLoggedInUser | null>;

  private static initAuth(config: Config): Promise<GoogleAuth> {
    return gapi.auth2.init({
      client_id: config.googleClientId
    }).then(ga => ga);
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
          onerror: () => rej()
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

  getName(): string {
    return this.googleUser.getBasicProfile().getGivenName();
  }

  getToken(): string {
    return this.googleUser.getAuthResponse().id_token;
  }
}
