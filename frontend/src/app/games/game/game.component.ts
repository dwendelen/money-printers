import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LoggedInUser, LoginService} from '../../login/login.service';
import {GameService} from '../game.service';
import {GameInfo} from '../api/api';
import {Game} from './game';
import {Event} from '../api/event';
import {AddPlayer, Command, EndTurn, RollDice, StartGame} from '../api/command';

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

  @Output()
  exit = new EventEmitter<void>();
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
        if (this.open) {
          this.onNewEvents([]);
        }
      }, 10000);
    });
  }

  join(): void {
    this.sendCmd(new AddPlayer(
      this.user.getId(),
      this.user.getName() // TODO proper name
    ));
  }

  start(): void {
    this.sendCmd(new StartGame());
  }

  roll(): void {
    this.sendCmd(new RollDice());
  }

  endTurn(): void {
    this.sendCmd(new EndTurn());
  }

  private sendCmd(cmd: Command): void {
    this.gameService.sendCommand(
      this.gameInfo.id,
      cmd,
      this.game.events.length
    );
  }

  exitGame(): void {
    this.exit.emit();
  }

  logout(): void {
    this.loginService.logout();
  }

  ngOnDestroy(): void {
    this.open = false;
  }
}
