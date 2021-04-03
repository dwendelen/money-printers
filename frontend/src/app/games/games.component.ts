import {Component,  OnInit} from '@angular/core';
import {LoggedInUser, LoginService} from '../login/login.service';
import {GameService} from '../game/game.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: []
})
export class GamesComponent implements OnInit {

  constructor(
    private readonly loginService: LoginService,
    private readonly gameService: GameService,
    private readonly router: Router
  ) {
  }

  user!: LoggedInUser;

  gameId = '';

  errors: string[] = [];

  ngOnInit(): void {
    this.user = this.loginService.getLoggedInUser()!;
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['login'])
  }

  newGame(): void {
    this.gameService.newGame(this.user.getId(), this.user.getToken())
      .subscribe(
        gameId => this.router.navigate(['games', gameId]),
        () => this.errors.push('Could not create new game')
      );
  }

  openGame(): void {
    this.gameService.openGame(this.gameId)
      .subscribe(
        gameId => this.router.navigate(['games', gameId]),
        () => this.errors.push('Could not join new game')
      );
  }
}
