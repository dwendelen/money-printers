import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LoggedInUser, LoginService} from '../../login/login.service';
import {GameService} from '../game.service';
import {GameInfo} from '../api/api';
import {Game, Ownable, Player, Space, Station, Street, Utility} from '../game';
import {Event} from '../api/event';
import {AddPlayer, BuyThisSpace, Command, DemandRent, EndTurn, PayRent, RollDice, StartGame} from '../api/command';

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
  playerColor!: string;
  spaceInfo: Space | null = null;

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
      this.user.getName(), // TODO proper name
      this.playerColor
    ));
  }

  showStart(): boolean {
    return this.game.hasPowerToStartGame();
  }

  disableStart(): boolean {
    return this.commandInFlight || !this.game.canStartGame();
  }

  start(): void {
    this.sendCmd(new StartGame(this.game.myId));
  }

  showRoll(): boolean {
    return this.game.isMyTurn();
  }

  disableRoll(): boolean {
    return this.commandInFlight || !this.game.canRollDice();
  }

  roll(): void {
    this.sendCmd(new RollDice(this.game.myId));
  }

  buyThis(cash: number, borrowed: number): void {
    this.sendCmd(new BuyThisSpace(this.game.myId, cash, borrowed));
  }

  demandRent(demandId: number | null): void {
    if (demandId != null) {
      this.sendCmd(new DemandRent(this.game.myId, demandId));
    }
  }

  private isOwnable(space: Space): boolean {
    return space instanceof Street ||
      space instanceof Station ||
      space instanceof Utility;
  }

  payRent(): void {
    const myRentDemand = this.game.getMyRentDemand();
    this.sendCmd(new PayRent(
      this.game.myId,
      myRentDemand.demandEventId
    ));
  }

  showEndTurn(): boolean {
    return this.game.isMyTurn();
  }

  disableEndTurn(): boolean {
    return this.commandInFlight || !this.game.canEndTurn();
  }

  endTurn(): void {
    this.sendCmd(new EndTurn(this.game.myId));
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

  getPlayersOn(ground: Space): Player[] {
    return this.game.players
      .filter(p => p.position === ground);
  }

  isGroundUnBuilt(ground: Space): boolean {
    if (ground instanceof Street) {
      return ground.owner != null;
    } else if (ground instanceof Utility) {
      return ground.owner != null;
    } else if (ground instanceof Station) {
      return ground.owner != null;
    } else {
      return false;
    }
  }

  copyGameIdToClipboard(): void {
    navigator.clipboard.writeText(this.gameInfo.id)
      .then();
  }

  getPlayerColors(): string[] {
    return this.game.players
      .map(p => p.color);
  }

  getOwnerColor(ground: Space): string {
    const ownable = ground as Ownable;
    return ownable!.getOwner()!.color;
  }
}
