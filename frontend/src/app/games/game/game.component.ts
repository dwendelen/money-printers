import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LoggedInUser, LoginService} from '../../login/login.service';
import {GameService} from '../game.service';
import {GameInfo} from '../api/api';
import {Game, Space} from '../game';
import {Event} from '../api/event';
import {AddPlayer, BuyThisSpace, Command, EndTurn, RollDice, StartGame} from '../api/command';

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
  commandInFlight = false;

  ngOnInit(): void {
    this.game = new Game(this.user.getId());
    this.eventLoop(this.gameInfo.events, 0);
  }

  private eventLoop(events: Event[], expectedVersion: number): void {
    this.applyNewEvents(events, expectedVersion);

    const currentVersion = this.game.events.length;

    this.gameService.getEvents(
      this.gameInfo.id,
      currentVersion
    ).then(e => {
      if (this.open) {
        this.eventLoop(e, currentVersion);
      }
    }).catch(err => {
      console.error('Could not get more events, trying again in 10 seconds', err);
      setTimeout(() => {
        if (this.open) {
          this.eventLoop([], currentVersion);
        }
      }, 10000);
    });
  }

  private applyNewEvents(events: Event[], expectedVersion: number): void {
    if (this.game.events.length === expectedVersion) {
      events.forEach(e => this.game.apply(e));
    }
  }

  showJoin(): boolean {
    return this.game.canJoin();
  }

  disableJoin(): boolean {
    return this.commandInFlight || !this.game.canJoin();
  }

  join(): void {
    this.sendCmd(new AddPlayer(
      this.user.getId(),
      this.user.getName() // TODO proper name
    ));
  }

  showStart(): boolean {
    return this.game.hasPowerToStartGame();
  }

  disableStart(): boolean {
    return this.commandInFlight || !this.game.canStartGame();
  }

  start(): void {
    this.sendCmd(new StartGame());
  }

  showRoll(): boolean {
    return this.game.isMyTurn();
  }

  disableRoll(): boolean {
    return this.commandInFlight || !this.game.canRollDice();
  }

  roll(): void {
    this.sendCmd(new RollDice());
  }

  buyThis(cash: number, borrowed: number): void {
    this.sendCmd(new BuyThisSpace(cash, borrowed));
  }

  showEndTurn(): boolean {
    return this.game.isMyTurn();
  }

  disableEndTurn(): boolean {
    return this.commandInFlight || !this.game.canEndTurn();
  }

  endTurn(): void {
    this.sendCmd(new EndTurn());
  }

  private sendCmd(cmd: Command): void {
    if (this.commandInFlight) {
      console.log('Another command is already in flight');
      return;
    }
    const currentVersion = this.game.events.length;
    this.commandInFlight = true;
    this.gameService.sendCommand(
      this.gameInfo.id,
      cmd,
      currentVersion
    ).then(events => {
      if (events !== null) {
        this.applyNewEvents(events, currentVersion);
      } // TODO what if failed?
    }).finally(() => {
      this.commandInFlight = false;
    });
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

  getPlayerNamesOn(ground: Space): string {
      return this.game.players
        .filter(p => p.position === ground)
        .map(p => p.name)
        .join(', ');
  }

  getOwnerName(ground: Space): string {
    const owner = ground.getOwner();
    if (owner) {
      return owner.name;
    } else {
      return '';
    }
  }

  copyGameIdToClipboard(): void {
    navigator.clipboard.writeText(this.gameInfo.id)
      .then();
  }
}
