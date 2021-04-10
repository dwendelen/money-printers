import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {LoggedInUser, LoginService} from '../../login/login.service';
import {GameService} from '../game.service';
import {BidInfo, Game, LeftContext, Ownable, Player, Space, Station, Street, Utility} from '../game';
import {Event} from '../api/event';
import {
  AcceptTrade,
  AddOffer,
  AddPlayer,
  BuyThisSpace, BuyWonBid,
  Command,
  DeclineThisSpace,
  DemandRent,
  EndTurn, PassBid,
  PayRent, PlaceBid, RemoveOffer, RevokeTradeAcceptance,
  RollDice,
  StartGame, UpdateOfferValue
} from '../api/command';
import {Bidding} from '../bidding/bidding';
import {Acceptance, OfferInfo} from '../trade/trade.component';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit, OnDestroy {

  constructor(
    private readonly gameService: GameService
  ) {
  }

  @Input()
  user!: LoggedInUser;
  @Input()
  gameId!: string;
  @Input()
  initialEvents!: Event[];
  game!: Game;
  open = true;
  commandInFlight = false;
  playerColor!: string;
  rightContext: RightContext = new NoRightContext();

  ngOnInit(): void {
    this.game = new Game(this.user.getId());
    this.eventLoop(this.initialEvents, 0);
  }

  private eventLoop(events: Event[], expectedVersion: number): void {
    this.applyNewEvents(events, expectedVersion);

    const currentVersion = this.game.events.length;

    this.gameService.getEvents(
      this.gameId,
      currentVersion
    ).subscribe(e => {
      if (this.open) {
        this.eventLoop(e, currentVersion);
      }
    },err => {
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

  dontBuyThis(): void {
    this.sendCmd(new DeclineThisSpace(this.game.myId));
  }

  demandRent(demandId: number | null): void {
    if (demandId != null) {
      this.sendCmd(new DemandRent(this.game.myId, demandId));
    }
  }

  payRent(demandId: number): void {
    // TODO this ain't gonna work when there is not enough money
    this.sendCmd(new PayRent(
      this.game.myId,
      demandId
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

  passBid(): void {
    this.sendCmd(new PassBid(this.game.myId));
  }

  placeBid(amount: number): void {
    this.sendCmd(new PlaceBid(this.game.myId, amount));
  }

  buyWonBid(cash: number, borrowed: number) {
    this.sendCmd(new BuyWonBid(
      this.game.myId,
      cash,
      borrowed
    ));
  }

  private sendCmd(cmd: Command): void {
    if (this.commandInFlight) {
      console.log('Another command is already in flight');
      return;
    }
    const currentVersion = this.game.events.length;
    this.commandInFlight = true;
    this.gameService.sendCommand(
      this.gameId,
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

  ngOnDestroy(): void {
    this.open = false;
  }

  getPlayersOn(ground: Space): Player[] {
    return this.game.players
      .filter(p => p.position === ground);
  }

  getPlayerColors(): string[] {
    return this.game.players
      .map(p => p.color);
  }

  getBidding(bidInfo: BidInfo): Bidding {
    return new Bidding(
      bidInfo.space,
      bidInfo.player.name,
      bidInfo.bid,
      bidInfo.players.filter(p => p.id !== this.game.myId).length,
      bidInfo.player.id === this.game.myId,
      bidInfo.players.some(p => p.id === this.game.myId)
    );
  }

  get leftContext(): LeftContext {
    return this.game.getLeftContext();
  }

  viewGround(ground: Space): void {
    this.rightContext = new ViewSpace(ground, new NoRightContext());
  }

  popRightContext() {
    this.rightContext = this.rightContext.previous;
  }

  get myOwnables(): Ownable[] {
    return this.game.board
      .filter(o => o.ownable)
      .map(o =>  o as Ownable)
      .filter(o => o.owner?.id == this.game.myId);
  }

  openPlayerContext(player: Player): void {
    if(player.id != this.game.myId) {
      this.rightContext = new ViewTrade(player, new NoRightContext());
    }
  }

  addOffer(playerId: string, offer: OfferInfo): void {
    this.sendCmd(new AddOffer(
      this.game.myId,
      playerId,
      offer.ownable,
      offer.value
    ));
  }

  updateOffer(playerId: string, offer: OfferInfo): void {
    this.sendCmd(new UpdateOfferValue(
      this.game.myId,
      playerId,
      offer.ownable,
      offer.value
    ));
  }

  removeOffer(playerId: string, ownable: string): void {
    this.sendCmd(new RemoveOffer(
      this.game.myId,
      playerId,
      ownable
    ));
  }

  acceptTrade(playerId: string, acceptance: Acceptance): void {
    this.sendCmd(new AcceptTrade(
      this.game.myId,
      playerId,
      acceptance.getCash - acceptance.giveCash,
      acceptance.borrow - acceptance.payBack
    ))
  }

  revokeTradeAcceptance(playerId: string): void {
    this.sendCmd(new RevokeTradeAcceptance(
      this.game.myId,
      playerId
    ));
  }

  cheat(num: number) : number[]{
    return Array(num);
  }
}

type RightContext =
  NoRightContext |
  ViewSpace |
  ViewTrade;

class NoRightContext {
  type: 'none' = 'none'
  previous = this
}

class ViewSpace {
  type: 'ViewSpace' = 'ViewSpace'
  constructor(
    public space: Space,
    public previous: RightContext
  ) {
  }
}

class ViewTrade {
  type: 'ViewTrade' = 'ViewTrade'
  constructor(
    public otherParty: Player,
    public previous: RightContext
  ) {
  }
}
