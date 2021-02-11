import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {LoggedInUser, LoginService} from '../../login/login.service';
import {GameService} from '../game.service';
import {GameInfo} from '../api/api';
import {Game} from './game';
import {Event} from '../api/event';
import {AddPlayer} from '../api/command';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {

  constructor(
    private readonly loginService: LoginService,
    private readonly gameService: GameService
  ) {
  }

  @Input()
  user!: LoggedInUser;
  @Input()
  gameInfo!: GameInfo;
  game!: Game;
  open = true;

  ngOnInit(): void {
    this.game = new Game(this.user.getId());
    this.onNewEvents(this.gameInfo.events);
  }

  private onNewEvents(events: Event[]): void {
    events.forEach(e => this.game.apply(e));
    this.gameService.getEvents(
      this.gameInfo.id,
      this.game.events.length
    ).then(e => {
      if (this.open) {
        this.onNewEvents(e);
      }
    }).catch(err => {
      console.error('Could not get more events, trying again in 10 seconds', err);
      setTimeout(() => {
        this.onNewEvents([]);
      }, 10000);
    });
  }

  join(): void {
    this.gameService.sendCommand(
      this.gameInfo.id,
      new AddPlayer(
        this.user.getId(),
        this.user.getName() // TODO proper name
      ),
      this.game.events.length
    );
  }

  logout(): void {
    this.loginService.logout();
  }

  ngOnDestroy(): void {
    this.open = false;
  }
}
