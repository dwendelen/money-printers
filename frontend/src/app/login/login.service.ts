import {Injectable, NgZone, OnInit} from '@angular/core';
import {ConfigService} from '../config/config.service';
import GoogleAuth = gapi.auth2.GoogleAuth;
import GoogleUser = gapi.auth2.GoogleUser;
import {ActivatedRoute} from '@angular/router';
import {ConnectableObservable, Observable, ReplaySubject, zip} from 'rxjs';
import {map, mergeMap, publishReplay} from 'rxjs/operators';
import * as $ from 'jquery';

export abstract class LoginService {
  abstract getLoggedInUser(): LoggedInUser | null;
  abstract getLoggedInUser$(): Observable<LoggedInUser | null>;
  abstract renderButton(id: string): void
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
  private readonly googleAuth: ConnectableObservable<GoogleAuth>;
  private readonly user$: ConnectableObservable<GoogleLoggedInUser | null>
  private user: GoogleLoggedInUser | null = null;

  constructor(configService: ConfigService, private ngZone: NgZone) {
    this.googleAuth = zip(configService.getConfig(), GoogleService.apiLoaded()).pipe(
      mergeMap(arr => GoogleService.getAuth2$(arr[0].googleClientId)),
      publishReplay(1)
    ) as ConnectableObservable<GoogleAuth>;
    this.googleAuth.connect();
    this.user$ = this.googleAuth.pipe(
      mergeMap(ga => GoogleService.getUser$(ga, ngZone)),
      map(gu => gu.isSignedIn()? new GoogleLoggedInUser(gu): null),
      publishReplay(1)
    ) as ConnectableObservable<GoogleLoggedInUser | null>;
    this.user$.connect();
    this.user$.subscribe(usr => this.user = usr);
  }

  getLoggedInUser(): LoggedInUser | null {
    return this.user;
  }

  getLoggedInUser$(): Observable<LoggedInUser | null> {
    return this.user$;
  }

  renderButton(id: string): void {
    this.googleAuth.subscribe(_ => {
      gapi.signin2.render('googleSignIn', {});
    })
  }

  logout(): void {
    this.googleAuth.subscribe(ga => ga.signOut());
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

class GoogleService {
  static apiLoaded(): Observable<void> {
    return new Observable(sub => {
      gapi.load('auth2', {
        callback: () => {
          sub.next();
          sub.complete()
        },
        onerror: () => sub.error('Could not load google api')
      });
    });
  }

  static getAuth2$(clientId: string): Observable<GoogleAuth> {
    return new Observable(gapi.auth2.init({
      client_id: clientId
    }).then(
      ga => ga,
      err => Promise.reject(err.error)
    ));
  }

  static getUser$(googleAuth: GoogleAuth, ngZone: NgZone): Observable<GoogleUser> {
    return new Observable(sub => {
      googleAuth.currentUser.listen(usr => {
        ngZone.run(() => {
          sub.next(usr);
        });
      });
      if (googleAuth.isSignedIn.get()) {
        googleAuth.signIn();
      }
    });
  }
}

@Injectable({
  providedIn: 'root'
})
export class TestLoginService implements LoginService {
  private readonly userName!: string;
  private readonly user$ = new ReplaySubject<TestLoggedInUser | null>(1);
  private user: TestLoggedInUser | null = null;

  constructor() {
    const urlParams = new URLSearchParams(window.location.search);
    this.userName = urlParams.get('user') || '';
    if(!this.userName) {
      this.user$.error("Invalid user parameter");
    } else {
      this.user$.next(new TestLoggedInUser(this.userName));
    }
    this.user$.subscribe(usr => this.user = usr);
  }

  getLoggedInUser(): LoggedInUser | null {
    return this.user;
  }

  getLoggedInUser$(): Observable<LoggedInUser | null> {
    return this.user$;
  }

  logout(): void {
    this.user$.next(null);
  }

  renderButton(id: string): void {
    $(`#${id}`)
      .css('width', '100px')
      .css('height', '18px')
      .css('border-style', 'solid')
      .text('Log In')
      .on('click', () => {
      this.user$.next(new TestLoggedInUser(this.userName));
    });
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

