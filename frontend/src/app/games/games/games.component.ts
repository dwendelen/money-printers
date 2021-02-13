import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {LoggedInUser, LoginService} from '../../login/login.service';
import {GameService} from '../game.service';
import {GameInfo} from '../api/api';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: []
})
export class GamesComponent implements OnInit {

  constructor(
    private readonly loginService: LoginService,
    private readonly gameService: GameService
  ) {
  }

  @Input()
  user!: LoggedInUser;
  @Output()
  gameToJoin = new EventEmitter<GameInfo>();

  gameId = '';

  errors: string[] = [];

  ngOnInit(): void {
  }

  logout(): void {
    this.loginService.logout();
  }

  newGame(): void {
    this.gameService.newGame(this.user.getId(), this.user.getToken())
      .then(game => this.gameToJoin.emit(game))
      .catch(() => this.errors.push('Could not create new game'));
  }

  openGame(): void {
    this.gameService.openGame(this.gameId)
      .then(game => this.gameToJoin.emit(game))
      .catch(() => this.errors.push('Could not join new game'));
  }
}
