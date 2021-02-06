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

  name = '';
  gameId = '';

  errors: string[] = [];

  ngOnInit(): void {
    this.name = this.user.getName();
  }

  logout(): void {
    this.loginService.logout();
  }

  newGame(): void {
    this.gameService.newGame(this.user.getId(), this.name, this.user.getToken())
      .then(game => this.gameToJoin.emit(game))
      .catch(() => this.errors.push('Could not create new game'));
  }

  joinGame(): void {
    this.gameService.joinGame(this.gameId, this.user.getId(), this.user.getName(), this.user.getToken())
      .then(game => this.gameToJoin.emit(game))
      .catch(() => this.errors.push('Could not join new game'));
  }
}
