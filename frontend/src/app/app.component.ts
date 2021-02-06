import {Component, OnInit} from '@angular/core';
import {LoggedInUser, LoginService} from './login/login.service';
import {filter, flatMap, map, mergeMap, shareReplay} from 'rxjs/operators';
import {merge, Observable, of} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  page: Observable<{}> | undefined;

  constructor(private login: LoginService) {
  }

  ngOnInit(): void {
    this.page = this.login.getLoggedInUser()
      .pipe(
        map(user => user ? new GamesPage(user) : new LoginPage()),
      );
  }

  getLoginPage(): Observable<LoginPage | null> {
    return this.getPage(LoginPage);
  }

  getGamesPage(): Observable<GamesPage | null> {
    return this.getPage(GamesPage);
  }

  private getPage<T>(clazz: any): Observable<T | null> {
    return this.page?.pipe(
      mergeMap(p => {
        if (p instanceof clazz) {
          return of(p as T);
        } else {
          return of(null);
        }
      }),
    ) || of(null);
  }
}


class LoginPage {
}

class GamesPage {
  constructor(public loggedInUser: LoggedInUser) {
  }
}
