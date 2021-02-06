import {Component, OnDestroy, OnInit} from '@angular/core';
import {LoggedInUser, LoginService} from './login/login.service';
import {Subscription} from 'rxjs/internal/Subscription';
import {GameInfo} from './games/api/api';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  page: any = new LoginPage();
  user!: LoggedInUser | null;
  errors: string[] = [];

  loginSubscription!: Subscription;

  constructor(private login: LoginService) {
  }

  ngOnInit(): void {
    this.loginSubscription = this.login.getLoggedInUser()
      .subscribe(user => {
        if (user == null) {
          this.page = new LoginPage();
        } else {
          this.user = user;
          this.page = new GamesPage();
        }
      }, (err) => {
        this.errors.push(err);
      });
  }

  joinGame(game: GameInfo): void {
    this.page = new GamePage(game);
  }

  getLoginPage(): LoginPage | null {
    return this.getPage(LoginPage);
  }

  getGamesPage(): GamesPage | null {
    return this.getPage(GamesPage);
  }

  getGamePage(): GamePage | null {
    return this.getPage(GamePage);
  }

  private getPage<T>(clazz: any): T | null {
    if (this.page instanceof clazz) {
      return this.page as T;
    } else {
      return null;
    }
  }

  ngOnDestroy(): void {
    this.loginSubscription.unsubscribe();
  }
}

class LoginPage {
}

class GamesPage {
}

class GamePage {
  constructor(public gameInfo: GameInfo) {
  }
}
