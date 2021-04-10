import {
  BidPassed,
  BidPlaced,
  BidStarted,
  BidWon,
  DiceRolled,
  Event,
  GameCreated,
  GameStarted,
  LandedOnBuyableSpace,
  LandedOnHostileSpace,
  LandedOnSafeSpace,
  NewTurnStarted, OfferAdded, OfferRemoved, OfferValueUpdated, Payment,
  PlayerAdded,
  RentDemanded,
  RentPaid,
  SpaceBought,
  StartMoneyReceived, TradeAcceptanceRevoked, TradeAccepted, TradeCompleted, Transfer,
  TurnEnded
} from './api/event';

export class Game {
  events: Event[] = [];
  players: Player[] = [];
  board: Space[] = [];
  economy = 0;
  state: GameState = new WaitingForStart();
  gameMasterId!: string;
  fixedStartMoney!: number;
  interestRate!: number;
  returnRate!: number;

  constructor(
    public myId: string
  ) {
  }

  apply(event: Event): void {
    console.log('Event', event);
    switch (event.type) {
      case 'GameCreated':
        this.applyGameCreated(event);
        break;
      case 'PlayerAdded':
        this.applyPlayerAdded(event);
        break;
      case 'GameStarted':
        this.applyGameStarted(event);
        break;
      case 'NewTurnStarted':
        this.applyNewTurnStarted(event);
        break;
      case 'DiceRolled':
        this.applyDiceRolled(event);
        break;
      case 'StartMoneyReceived':
        this.applyStartMoneyReceived(event);
        break;
      case 'LandedOnSafeSpace':
        this.applyLandedOnSafeSpace(event);
        break;
      case 'LandedOnBuyableSpace':
        this.applyLandedOnBuyableSpace(event);
        break;
      case 'SpaceBought':
        this.applySpaceBought(event);
        break;
      case 'BidStarted':
        this.applyBidStarted(event);
        break;
      case 'BidPlaced':
        this.applyBidPlaced(event);
        break;
      case 'BidPassed':
        this.applyBidPassed(event);
        break;
      case 'BidWon':
        this.applyBidWon(event);
        break;
      case 'LandedOnHostileSpace':
        this.applyLandedOnHostileSpace(event);
        break;
      case 'RentDemanded':
        this.applyRentDemanded(event);
        break;
      case 'RentPaid':
        this.applyRentPaid(event);
        break;
      case 'TurnEnded':
        this.applyTurnEnded(event);
        break;
      case 'OfferAdded':
        this.applyOfferAdded(event);
        break;
      case 'OfferValueUpdated':
        this.OfferValueUpdated(event);
        break;
      case 'OfferRemoved':
        this.applyOfferRemoved(event);
        break;
      case 'TradeAccepted':
        this.applyTradeAccepted(event);
        break;
      case 'TradeAcceptanceRevoked':
        this.applyTraceAcceptanceRevoked(event);
        break;
      case 'TradeCompleted':
        this.applyTradeCompleted(event);
        break;
    }
    this.events.push(event);
  }

  private applyGameCreated(event: GameCreated): void {
    this.board = event.board
      .map(s => {
        switch (s.type) {
          case 'ActionSpace':
            return new ActionSpace(s.id, s.text);
          case 'Street':
            return new Street(
              s.id,
              s.text,
              s.color,
              s.initialPrice,
              s.rent,
              s.rentHouse,
              s.rentHotel,
              s.priceHouse,
              s.priceHotel
            );
          case 'FreeParking':
            return new FreeParking(s.id, s.text);
          case 'Prison':
            return new Prison(s.id, s.text);
          case 'Station':
            return new Station(
              s.id,
              s.text,
              s.initialPrice,
              s.rent
            );
          case 'Utility':
            return new Utility(
              s.id,
              s.text,
              s.initialPrice,
              s.rent,
              s.rentAll
            );
        }
      });
    this.gameMasterId = event.gameMaster;
    this.fixedStartMoney = event.fixedStartMoney;
    this.interestRate = event.interestRate;
    this.returnRate = event.returnRate;
  }

  private applyPlayerAdded(event: PlayerAdded): void {
    this.players.push(new Player(
      event.id,
      event.name,
      event.color,
      this.board[0],
      event.startDebt
    ));
  }

  private applyGameStarted(_: GameStarted): void {
    this.state = new NotMyTurn();
  }

  private applyNewTurnStarted(event: NewTurnStarted): void {
    if (event.player === this.myId) {
      this.state = new MyTurn();
    } else {
      this.state = new NotMyTurn();
    }
  }

  private applyDiceRolled(_: DiceRolled): void {
  }

  private applyStartMoneyReceived(event: StartMoneyReceived): void {
    const player = this.getPlayer(event.player);
    player.applyStartMoneyReceived(event);
    this.economy -= event.amount;
  }

  private applyLandedOnSafeSpace(event: LandedOnSafeSpace): void {
    const player = this.getPlayer(event.player);
    const space = this.getSpace(event.ground);

    player.applyLandedOnSafeSpace(event, space);
    this.state.applyLandedOnSafeSpace(event, space);
  }

  private applyLandedOnBuyableSpace(event: LandedOnBuyableSpace): void {
    const player = this.getPlayer(event.player);
    const space = this.getSpace(event.ground);

    player.applyLandedOnBuyableSpace(event, space);
    this.state.applyLandedOnBuyableSpace(event, space);
  }

  private applySpaceBought(event: SpaceBought): void {
    const player = this.getPlayer(event.player);
    const ownable = this.getOwnable(event.ground);

    const value = event.cash + event.borrowed;
    this.economy += value;
    ownable.owner = player;
    ownable.assetValue = value;
    player.applySpaceBought(event);

    this.state = this.state.applySpaceBought(event);
  }

  private applyBidStarted(event: BidStarted): void {
    const player = this.getPlayer(event.defaultWinner);
    const ground = this.getOwnable(event.ground);
    this.state = new Bidding(ground, new BidInfo(ground, player, 0, this.players), this.state);
  }

  private applyBidPlaced(event: BidPlaced): void {
    const player = this.getPlayer(event.player);
    this.state.applyBidPlaced(event, player);
  }

  private applyBidPassed(event: BidPassed): void {
    this.state.applyBidPassed(event);
  }

  private applyBidWon(event: BidWon): void {
    const won = event.player === this.myId;
    this.state = this.state.applyBidWon(event, won);
  }

  private applyLandedOnHostileSpace(event: LandedOnHostileSpace): void {
    const player = this.getPlayer(event.player);
    const space = this.getSpace(event.ground);

    player.applyLandedOnHostileSpace(event, space, this.myId);
    this.state.applyLandedOnHostileSpace(event, space);
  }

  private applyRentDemanded(event: RentDemanded): void {
    if (event.player === this.myId) {
      const rentDemand = new RentDemand(
        event.owner,
        event.rent,
        this.events.length
      );
      this.state = new RentDemandedForMe(rentDemand, this.state);
    } else {
      this.state = new RentDemandedNotForMe(this.state);
    }
  }

  private applyRentPaid(event: RentPaid): void {
    const owner = this.getPlayer(event.owner);
    const player = this.getPlayer(event.player);
    owner.applyRentPaidOwner(event);
    player.applyRentPaidPlayer(event);
    this.state = this.state.applyRentPaid(event);
  }

  private applyTurnEnded(_: TurnEnded): void {
    this.state = new NotMyTurn();
  }

  private applyOfferAdded(event: OfferAdded): void {
    const ownable = this.getOwnable(event.ownable);
    this.applyToTradeParty(
      event.from,
      event.to,
      t => t.applyOfferAdded(event, ownable)
    );
  }

  private OfferValueUpdated(event: OfferValueUpdated): void {
    this.applyToTradeParty(
      event.from,
      event.to,
      t => t.applyOfferValueUpdated(event)
    );
  }

  private applyOfferRemoved(event: OfferRemoved): void {
    this.applyToTradeParty(
      event.from,
      event.to,
        t => t.applyOfferRemoved(event)
    );
  }

  private applyTradeAccepted(event: TradeAccepted): void {
    this.applyToTradeParty(
      event.by,
      event.other,
      t => t.applyTradeAccepted(event)
    );
  }

  private applyTraceAcceptanceRevoked(event: TradeAcceptanceRevoked): void {
    this.applyToTradeParty(
      event.by,
      event.other,
      t => t.applyTraceAcceptanceRevoked(event)
    );
  }

  private applyTradeCompleted(event: TradeCompleted): void {
    this.applyToTradeParty(event.party1, event.party2, p => {
      p.applyTradeCompleted(event)
    })
    this.applyToTradeParty(event.party2, event.party1, p => {
      p.applyTradeCompleted(event)
    })
    event.payments.forEach(p => {
      this.getPlayer(p.player).applyPayment(p)
    })
    event.transfers.forEach(t => {
      const to = this.getPlayer(t.to);
      const from = this.getPlayer(t.from);
      const ownable = this.getOwnable(t.ownable);
      to.applyTransferTo(t)
      // This needs to happen before the asset value is updated
      from.applyTransferFrom(t, ownable)
      ownable.owner = to
      ownable.assetValue = t.value
    })
  }

  private applyToTradeParty(from: string, to: string, fn: (party: TradeParty) => void) {
    if(from == this.myId) {
      const other = this.getPlayer(to);
      fn(other.trade.me);
    }
    if(to == this.myId) {
      const other = this.getPlayer(from);
      fn(other.trade.other);
    }
  }

  getPlayer(id: string): Player {
    const player = this.players
      .filter(p => p.id === id)[0];
    if (!player) {
      throw new Error('Player not found');
    }
    return player;
  }

  getSpace(id: string): Space {
    const space = this.board
      .filter(p => p.id === id)[0];
    if (!space) {
      throw new Error('Space not found');
    }
    return space;
  }

  private getOwnable(id: string): Ownable {
    return this.getSpace(id) as Ownable;
  }

  hasPowerToStartGame(): boolean {
    return this.state instanceof WaitingForStart &&
      this.myId === this.gameMasterId;
  }

  canJoin(): boolean {
    const iHaveJoined = !this.players
      .some(p => p.id === this.myId);

    return iHaveJoined && this.state instanceof WaitingForStart;
  }

  canStartGame(): boolean {
    return this.state instanceof WaitingForStart &&
      this.hasPowerToStartGame() &&
      this.players.length >= 2;
  }

  canRollDice(): boolean {
    return this.state.canRollDice();
  }

  canEndTurn(): boolean {
    return this.state.canEndTurn();
  }

  isMyTurn(): boolean {
    return this.state instanceof MyTurn;
  }

  getMyCash(): number {
    return this.getMe().money;
  }

  getMe(): Player {
    return this.getPlayer(this.myId);
  }

  getStartMoney(player: Player): number {
    const interest = Math.floor(this.interestRate * player.debt);
    const economyMoney = Math.ceil(this.returnRate * this.economy);
    return this.fixedStartMoney + economyMoney - interest;
  }

  getLeftContext(): LeftContext {
    return this.state.getLeftContext();
  }
}

export type LeftContext =
  NoLeftContext |
  RentDemandedForMe |
  Bidding |
  BuyingWonBid |
  LandedOnNewGround;

class NoLeftContext {
  type: 'none' = 'none'
}

export class Player {
  money = 0;
  debt = 0;
  assets = 0;
  lastDemandId: number | null = null;
  trade = new Trade()

  constructor(
    public id: string,
    public name: string,
    public color: string,
    public position: Space,
    startDebt: number
  ) {
    this.money = startDebt;
    this.debt = startDebt;
  }

  applyStartMoneyReceived(event: StartMoneyReceived): void {
    this.money += event.amount;
  }

  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): void {
    this.position = space;
    this.lastDemandId = null;
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): void {
    this.position = space;
    this.lastDemandId = null;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space, myId: string): void {
    this.position = space;
    if (event.owner === myId) {
      this.lastDemandId = event.demandId;
    } else {
      this.lastDemandId = null;
    }
  }

  applySpaceBought(event: SpaceBought): void {
    this.money -= event.cash;
    this.debt += event.borrowed;
    this.assets += event.cash + event.borrowed;
  }

  applyRentPaidOwner(event: RentPaid): void {
    this.money += event.rent;
  }

  applyRentPaidPlayer(event: RentPaid): void {
    this.money -= event.rent;
  }

  applyPayment(payment: Payment): void {
    this.money += payment.cashDelta
    this.debt += payment.debtDelta
  }

  applyTransferTo(t: Transfer): void {
    this.assets += t.value
  }

  applyTransferFrom(t: Transfer, ownable: Ownable) {
    this.assets -= ownable.assetValue!
  }
}

export class Trade {
  me: TradeParty = new TradeParty()
  other: TradeParty = new TradeParty();
}

export class TradeParty {
  offers: Offer[] = []
  accepted: boolean = false

  applyOfferAdded(event: OfferAdded, ownable: Ownable): void {
    this.offers.push(new Offer(ownable, event.value));
  }

  applyOfferValueUpdated(event: OfferValueUpdated): void {
    const offer = this.offers
      .find(o => o.ownable.id == event.ownable);
    if (offer) {
      offer.value = event.value
    }
  }

  applyOfferRemoved(event: OfferRemoved): void {
    this.offers = this.offers
      .filter(o => o.ownable.id != event.ownable);
  }

  applyTradeAccepted(event: TradeAccepted): void {
    this.accepted = true
  }

  applyTraceAcceptanceRevoked(event: TradeAcceptanceRevoked): void {
    this.accepted = false
  }

  applyTradeCompleted(event: TradeCompleted): void {
    this.accepted = false
    this.offers = []
  }
}

export class Offer {
  constructor(
    public ownable: Ownable,
    public value: number
  ) {
  }
}

interface GameState {
  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): void;

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): void;

  applySpaceBought(event: SpaceBought): GameState;

  applyBidStarted(event: BidStarted): void;

  applyBidPlaced(event: BidPlaced, player: Player): void;

  applyBidPassed(event: BidPassed): void;

  applyBidWon(event: BidWon, won: boolean): GameState;

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void;

  applyRentPaid(event: RentPaid): GameState;

  canRollDice(): boolean;

  canEndTurn(): boolean;

  getLeftContext(): LeftContext;
}

class WaitingForStart implements GameState {
  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): void {
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): void {
  }

  applySpaceBought(event: SpaceBought): GameState {
    return this;
  }

  applyBidStarted(event: BidStarted): void {
  }

  applyBidPlaced(event: BidPlaced, player: Player): void {
  }

  applyBidPassed(event: BidPassed): void {
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    return this;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
  }

  applyRentPaid(event: RentPaid): GameState {
    return this;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getLeftContext(): LeftContext {
    return new NoLeftContext();
  }
}

class NotMyTurn implements GameState {
  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): void {
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): void {
  }

  applySpaceBought(event: SpaceBought): GameState {
    return this;
  }

  applyBidStarted(event: BidStarted): void {
  }

  applyBidPlaced(event: BidPlaced, player: Player): void {
  }

  applyBidPassed(event: BidPassed): void {
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    return this;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
  }

  applyRentPaid(event: RentPaid): GameState {
    return this;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getLeftContext(): LeftContext {
    return new NoLeftContext();
  }
}

class MyTurn implements GameState {
  private state: TurnState = new WaitingForDiceRoll();

  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): void {
    this.state = this.state.applyLandedOnSafeSpace(event, space);
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): void {
    this.state = this.state.applyLandedOnBuyableSpace(event, space);
  }

  applySpaceBought(event: SpaceBought): GameState {
    this.state = new WaitingForEndTurn()
    return this;
  }

  applyBidStarted(event: BidStarted): void {
  }

  applyBidPlaced(event: BidPlaced, player: Player): void {
  }

  applyBidPassed(event: BidPassed): void {
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    return this;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
    this.state = this.state.applyLandedOnHostileSpace(event, space);
  }

  applyRentPaid(event: RentPaid): GameState {
    return this;
  }

  canEndTurn(): boolean {
    return this.state.canEndTurn();
  }

  canRollDice(): boolean {
    return this.state.canRollDice();
  }

  getLeftContext(): LeftContext {
    return this.state.getLeftContext();
  }
}

class RentDemandedNotForMe implements GameState {
  constructor(
    private previousState: GameState
  ) {
  }

  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): void {
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): void {
  }

  applySpaceBought(event: SpaceBought): GameState {
    return this;
  }

  applyBidStarted(event: BidStarted): void {
  }

  applyBidPlaced(event: BidPlaced, player: Player): void {
  }

  applyBidPassed(event: BidPassed): void {
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    return this;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
  }

  applyRentPaid(event: RentPaid): GameState {
    return this.previousState;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getLeftContext(): LeftContext {
    return new NoLeftContext();
  }
}

class RentDemandedForMe implements GameState {
  constructor(
    public rentDemand: RentDemand,
    private previousState: GameState
  ) {
  }

  type: 'RentDemandedForMe' = 'RentDemandedForMe'

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): void {
  }

  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): void {
  }

  applySpaceBought(event: SpaceBought): GameState {
    return this;
  }

  applyBidStarted(event: BidStarted): void {
  }

  applyBidPlaced(event: BidPlaced, player: Player): void {
  }

  applyBidPassed(event: BidPassed): void {
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    return this;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
  }

  applyRentPaid(event: RentPaid): GameState {
    return this.previousState;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getLeftContext(): LeftContext {
    return this;
  }
}

class Bidding implements GameState {
  constructor(
    public space: Space,
    public bidInfo: BidInfo,
    public previousState: GameState,
  ) {
  }

  type: 'Bidding' = 'Bidding'

  applyBidPassed(event: BidPassed): void {
    this.bidInfo.players = this.bidInfo.players.filter(p => p.id !== event.player);
  }

  applyBidPlaced(event: BidPlaced, player: Player): void {
    if (!this.bidInfo.players.includes(player)) {
      this.bidInfo.players.push(player);
    }
    this.bidInfo.player = player;
    this.bidInfo.bid = event.bid;
  }

  applyBidStarted(event: BidStarted): void {
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    if (won) {
      return new BuyingWonBid(this.space, this.bidInfo, this.previousState);
    } else {
      return new WaitingForAnotherToBuyBid(this.space, this.previousState)
    }
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): void {
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
  }

  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): void {
  }

  applyRentPaid(event: RentPaid): GameState {
    return this;
  }

  applySpaceBought(event: SpaceBought): GameState {
    return this;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getLeftContext(): LeftContext {
    return this;
  }
}


class BuyingWonBid implements GameState {
  constructor(
    public space: Space,
    public bidInfo: BidInfo,
    public previousState: GameState,
  ) {
  }

  type: 'BuyingWonBid' = 'BuyingWonBid'

  applyBidPassed(event: BidPassed): void {
  }

  applyBidPlaced(event: BidPlaced, player: Player): void {
  }

  applyBidStarted(event: BidStarted): void {
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    return this
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): void {
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
  }

  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): void {
  }

  applyRentPaid(event: RentPaid): GameState {
    return this;
  }

  applySpaceBought(event: SpaceBought): GameState {
    return this.previousState.applySpaceBought(event)
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getLeftContext(): LeftContext {
    return this;
  }
}

class WaitingForAnotherToBuyBid implements GameState {
  constructor(
    public space: Space,
    public previousState: GameState,
  ) {
  }

  applyBidPassed(event: BidPassed): void {
  }

  applyBidPlaced(event: BidPlaced, player: Player): void {
  }

  applyBidStarted(event: BidStarted): void {
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    return this
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): void {
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
  }

  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): void {
  }

  applyRentPaid(event: RentPaid): GameState {
    return this;
  }

  applySpaceBought(event: SpaceBought): GameState {
    return this.previousState.applySpaceBought(event)
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getLeftContext(): LeftContext {
    return new NoLeftContext();
  }
}

interface TurnState {
  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): TurnState;

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): TurnState;

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): TurnState;

  canRollDice(): boolean;

  canEndTurn(): boolean;

  getLeftContext(): LeftContext;
}

class WaitingForDiceRoll implements TurnState {
  canRollDice(): boolean {
    return true;
  }

  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): TurnState {
    return new WaitingForEndTurn();
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Ownable): TurnState {
    return new LandedOnNewGround(space);
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): TurnState {
    return new WaitingForEndTurn();
  }

  canEndTurn(): boolean {
    return false;
  }

  getLeftContext(): LeftContext {
    return new NoLeftContext();
  }
}

class LandedOnNewGround implements TurnState {
  type: 'LandedOnNewGround' = 'LandedOnNewGround'

  constructor(
    public ownable: Ownable
  ) {
  }

  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): TurnState {
    return this;
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): TurnState {
    return this;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): TurnState {
    return this;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getLeftContext(): LeftContext {
    return this;
  }
}

class WaitingForEndTurn implements TurnState {

  canEndTurn(): boolean {
    return true;
  }

  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): TurnState {
    return this;
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): TurnState {
    return this;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): TurnState {
    return this;
  }

  canRollDice(): boolean {
    return false;
  }

  getLeftContext(): LeftContext {
    return new NoLeftContext();
  }
}

export class RentDemand {
  constructor(
    public owner: string,
    public rent: number,
    public demandEventId: number
  ) {
  }
}

export type Space =
  Ownable |
  FreeParking |
  Prison |
  ActionSpace;

export type Ownable =
  Street |
  Station |
  Utility;

abstract class AbstractOwnable {
  owner: Player | null = null;
  assetValue: number | null = null;
  ownable: true = true;
}

export class Street extends AbstractOwnable {
  constructor(
    public id: string,
    public text: string,
    public color: string,
    public initialPrice: number,
    public rent: number,
    public rentHouse: number[],
    public rentHotel: number,
    public priceHouse: number,
    public priceHotel: number,
    public buildState: BuildState = new Unbuilt()
  ) {
    super()
  }

  type: 'Street' = 'Street'

  getRentAll(): number {
    return 2 * this.rent;
  }

  getHouseRent(nbOfHouses: number): number {
    return this.rentHouse[nbOfHouses - 1];
  }
}

type BuildState =
  Unbuilt |
  Houses |
  Hotel

export class Unbuilt {
  type: 'Unbuilt' = 'Unbuilt'
}

export class Houses {
  constructor(
    public nbOfHouses: number
  ) {
  }
  type: 'Houses' = 'Houses'
}

export class Hotel {
  type: 'Hotel' = 'Hotel'
}

export class ActionSpace {
  constructor(
    public id: string,
    public text: string
  ) {
  }

  type: 'ActionSpace' = 'ActionSpace'
  ownable: false = false;
  color = null;
}

export class Utility extends AbstractOwnable {
  constructor(
    public id: string,
    public text: string,
    public initialPrice: number,
    public rent: number,
    public rentAll: number
  ) {
    super()
  }

  type: 'Utility' = 'Utility'

  color = null;
}

export class Station extends AbstractOwnable {
  constructor(
    public id: string,
    public text: string,
    public initialPrice: number,
    public rent: number[]
  ) {
    super()
  }

  type: 'Station' = 'Station'

  color = 'lightgrey';

  getStationRent(nbOfStations: number): number {
    return this.rent[nbOfStations - 1];
  }
}

export class Prison {
  constructor(
    public id: string,
    public text: string
  ) {
  }

  type: 'Prison' = 'Prison'
  ownable: false = false;
  color = null;
}

export class FreeParking {
  constructor(
    public id: string,
    public text: string
  ) {
  }

  type: 'FreeParking' = 'FreeParking'
  ownable: false = false;
  color = null;
}

export class BidInfo {
  public constructor(
    public space: Ownable,
    public player: Player,
    public bid: number,
    public players: Player[],
  ) {
  }
}
