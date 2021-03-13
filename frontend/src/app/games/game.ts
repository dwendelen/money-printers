import {
  BidPassed,
  BidPlaced,
  BidStarted, BidWon,
  DiceRolled,
  Event,
  GameCreated,
  GameStarted,
  LandedOnBuyableSpace, LandedOnHostileSpace, LandedOnSafeSpace,
  NewTurnStarted,
  PlayerAdded, RentDemanded, RentPaid,
  SpaceBought,
  StartMoneyReceived,
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
      this.board[0]
    ));
  }

  private applyGameStarted(event: GameStarted): void {
    this.state = new NotMyTurn();
  }

  private applyNewTurnStarted(event: NewTurnStarted): void {
    if (event.player === this.myId) {
      this.state = new MyTurn();
    } else {
      this.state = new NotMyTurn();
    }
  }

  private applyDiceRolled(event: DiceRolled): void {
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
    ownable.setOwner(player);
    ownable.setAssetValue(value);
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

  private applyBidPassed(event: BidPassed): void{
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

  private applyTurnEnded(event: TurnEnded): void {
    this.state = new NotMyTurn();
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

  canBuyThis(): boolean {
    return this.state.canBuyGround() &&
      this.getMe().canBuyThis();
  }

  isMyTurn(): boolean {
    return this.state instanceof MyTurn;
  }

  getMyCash(): number {
    return this.getMe().money;
  }

  getMyOwnable(): Ownable {
    return this.getMe().position as Ownable;
  }

  private getMe(): Player {
    return this.getPlayer(this.myId);
  }

  getStartMoney(player: Player): number {
    const interest = Math.floor(this.interestRate * player.debt);
    const economyMoney = Math.ceil(this.returnRate * this.economy);
    return this.fixedStartMoney + economyMoney - interest;
  }

  hasMyRentDemand(): boolean {
    return this.state instanceof RentDemandedForMe;
  }

  getMyRentDemand(): RentDemand {
      return (this.state as RentDemandedForMe).rentDemand;
  }

  isBidding(): boolean {
    return this.state.isBidding();
  }

  getBidInfo(): BidInfo | null {
    return this.state.getBidInfo();
  }

  hasWonBid() {
    return this.state.hasWonBid();
  }
}

export class Player {
  money = 0;
  debt = 0;
  assets = 0;
  lastDemandId: number | null = null;

  constructor(
    public id: string,
    public name: string,
    public color: string,
    public position: Space
  ) {
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

  canBuyThis(): boolean {
    return this.position.canBuy();
  }

  applyRentPaidOwner(event: RentPaid): void {
    this.money += event.rent;
  }

  applyRentPaidPlayer(event: RentPaid): void {
    this.money -= event.rent;
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

  canBuyGround(): boolean;

  getBidInfo(): BidInfo | null;

  hasWonBid(): boolean;

  isBidding(): boolean;
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

  applyBidPassed(event: BidPassed): void{
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    return this;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
  }

  applyRentPaid(event: RentPaid): GameState {
    return this;
  }

  canBuyGround(): boolean {
    return false;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getBidInfo(): BidInfo | null {
    return null;
  }

  hasWonBid(): boolean {
    return false;
  }

  isBidding(): boolean {
    return false;
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

  applyBidPassed(event: BidPassed): void{
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    return this;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
  }

  applyRentPaid(event: RentPaid): GameState {
    return this;
  }

  canBuyGround(): boolean {
    return false;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getBidInfo(): BidInfo | null {
    return null;
  }

  hasWonBid(): boolean {
    return false;
  }

  isBidding(): boolean {
    return false;
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

  applyBidPassed(event: BidPassed): void{
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

  canBuyGround(): boolean {
    return this.state.canBuyGround();
  }

  canEndTurn(): boolean {
    return this.state.canEndTurn();
  }

  canRollDice(): boolean {
    return this.state.canRollDice();
  }

  getBidInfo(): BidInfo | null {
    return null;
  }

  hasWonBid(): boolean {
    return false;
  }

  isBidding(): boolean {
    return false;
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

  applyBidPassed(event: BidPassed): void{
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    return this;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
  }

  applyRentPaid(event: RentPaid): GameState {
    return this.previousState;
  }

  canBuyGround(): boolean {
    return false;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getBidInfo(): BidInfo | null {
    return null;
  }

  hasWonBid(): boolean {
    return false;
  }

  isBidding(): boolean {
    return false;
  }
}

class RentDemandedForMe implements GameState {
  constructor(
    public rentDemand: RentDemand,
    private previousState: GameState
  ) {
  }

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

  applyBidPassed(event: BidPassed): void{
  }

  applyBidWon(event: BidWon, won: boolean): GameState {
    return this;
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): void {
  }

  applyRentPaid(event: RentPaid): GameState {
    return this.previousState;
  }

  canBuyGround(): boolean {
    return false;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getBidInfo(): BidInfo | null {
    return null;
  }

  hasWonBid(): boolean {
    return false;
  }

  isBidding(): boolean {
    return false;
  }
}

class Bidding implements GameState {
  constructor(
    public space: Space,
    public bidInfo: BidInfo,
    public previousState: GameState,
  ) {
  }
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
    if(won ) {
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

  canBuyGround(): boolean {
    return false;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getBidInfo(): BidInfo | null {
    return this.bidInfo;
  }

  hasWonBid(): boolean {
    return false;
  }

  isBidding(): boolean {
    return true;
  }
}


class BuyingWonBid implements GameState {
  constructor(
    public space: Space,
    public bidInfo: BidInfo,
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
    const state = this.previousState;
    return state.applySpaceBought(event)
  }

  canBuyGround(): boolean {
    return false;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getBidInfo(): BidInfo | null {
    return this.bidInfo;
  }

  hasWonBid(): boolean {
    return true;
  }

  isBidding(): boolean {
    return false;
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
    const state = this.previousState;// TODO something is fucked somewhere
    return state.applySpaceBought(event)
  }

  canBuyGround(): boolean {
    return false;
  }

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  getBidInfo(): BidInfo | null {
    return null;
  }

  hasWonBid(): boolean {
    return false;
  }

  isBidding(): boolean {
    return false;
  }
}

interface TurnState {
  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): TurnState;

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): TurnState;

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): TurnState;

  canRollDice(): boolean;

  canBuyGround(): boolean;

  canEndTurn(): boolean;
}

class WaitingForDiceRoll implements TurnState {

  canRollDice(): boolean {
    return true;
  }

  applyLandedOnSafeSpace(event: LandedOnSafeSpace, space: Space): TurnState {
    return new WaitingForEndTurn();
  }

  applyLandedOnBuyableSpace(event: LandedOnBuyableSpace, space: Space): TurnState {
    return new LandedOnNewGround();
  }

  applyLandedOnHostileSpace(event: LandedOnHostileSpace, space: Space): TurnState {
    return new WaitingForEndTurn();
  }

  canBuyGround(): boolean {
    return false;
  }

  canEndTurn(): boolean {
    return false;
  }
}

class LandedOnNewGround implements TurnState {
  canBuyGround(): boolean {
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

  canEndTurn(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
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

  canBuyGround(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

}

class RentDemand {
  constructor(
    public owner: string,
    public rent: number,
    public demandEventId: number
  ) {
  }
}

export interface Space {
  id: string;
  text: string;
  color: string | null;

  canBuy(): boolean;

  getRent(): number | undefined;

  getRentAll(): number | undefined;

  getHouseRent(nbOfHouses: number): number | undefined;

  getHotelRent(): number | undefined;

  getHousePrice(): number | undefined;

  getHotelPrice(): number | undefined;

  getStationRent(nbOfStations: number): number | undefined;
}

export interface Ownable extends Space {
  setOwner(player: Player): void;

  getOwner(): Player | null;

  getInitialPrice(): number;

  getAssetValue(): number | null;

  setAssetValue(assetValue: number): void;
}

export class Street implements Ownable {
  constructor(
    public id: string,
    public text: string,
    public color: string,
    public initialPrice: number,
    public rent: number,
    public rentHouse: number[],
    public rentHotel: number,
    public priceHouse: number,
    public priceHotel: number
  ) {
  }

  owner: Player | null = null;
  assetValue: number | null = null;

  setOwner(player: Player): void {
    this.owner = player;
  }

  getOwner(): Player | null {
    return this.owner;
  }

  canBuy(): boolean {
    return this.owner === null;
  }

  getInitialPrice(): number {
    return this.initialPrice;
  }

  setAssetValue(assetValue: number): void {
    this.assetValue = assetValue;
  }

  getAssetValue(): number | null {
    return this.assetValue;
  }

  getRent(): number {
    return this.rent;
  }

  getRentAll(): number {
    return 2 * this.rent;
  }

  getHouseRent(nbOfHouses: number): number {
    return this.rentHouse[nbOfHouses - 1];
  }

  getHotelRent(): number {
    return this.rentHotel;
  }

  getHousePrice(): number {
    return this.priceHouse;
  }

  getHotelPrice(): number {
    return this.priceHotel;
  }

  getStationRent(nbOfStations: number): undefined {
    return undefined;
  }
}

export class ActionSpace implements Space {
  constructor(
    public id: string,
    public text: string
  ) {
  }

  color = null;

  setOwner(player: Player): void {
  }

  getOwner(): Player | null {
    return null;
  }

  canBuy(): boolean {
    return false;
  }

  getRent(): undefined {
    return undefined;
  }

  getRentAll(): undefined {
    return undefined;
  }

  getHouseRent(nbOfHouses: number): undefined {
    return undefined;
  }

  getHotelRent(): undefined {
    return undefined;
  }

  getHousePrice(): undefined {
    return undefined;
  }

  getHotelPrice(): undefined {
    return undefined;
  }

  getStationRent(nbOfStations: number): undefined {
    return undefined;
  }
}

export class Utility implements Ownable {
  constructor(
    public id: string,
    public text: string,
    public initialPrice: number,
    public rent: number,
    public rentAll: number
  ) {
  }

  owner: Player | null = null;
  assetValue: number | null = null;
  color = null;

  setOwner(player: Player): void {
    this.owner = player;
  }

  getOwner(): Player | null {
    return this.owner;
  }

  canBuy(): boolean {
    return this.owner == null;
  }

  getInitialPrice(): number {
    return this.initialPrice;
  }

  getAssetValue(): number | null {
    return this.assetValue;
  }

  setAssetValue(assetValue: number): void {
    this.assetValue = assetValue;
  }

  getRent(): number {
    return this.rent;
  }

  getRentAll(): number {
    return this.rentAll;
  }

  getHouseRent(nbOfHouses: number): undefined {
    return undefined;
  }

  getHotelRent(): undefined {
    return undefined;
  }

  getHousePrice(): undefined {
    return undefined;
  }

  getHotelPrice(): undefined {
    return undefined;
  }

  getStationRent(nbOfStations: number): undefined {
    return undefined;
  }
}

export class Station implements Ownable {
  constructor(
    public id: string,
    public text: string,
    public initialPrice: number,
    public rent: number[]
  ) {
  }

  owner: Player | null = null;
  assetValue: number | null = null;
  color = 'lightgrey';

  setOwner(player: Player): void {
    this.owner = player;
  }

  getOwner(): Player | null {
    return this.owner;
  }

  canBuy(): boolean {
    return this.owner === null;
  }

  getInitialPrice(): number {
    return this.initialPrice;
  }

  getAssetValue(): number | null {
    return this.assetValue;
  }

  setAssetValue(assetValue: number): void {
    this.assetValue = assetValue;
  }

  getRent(): undefined {
    return undefined;
  }

  getRentAll(): undefined {
    return undefined;
  }

  getHouseRent(nbOfHouses: number): undefined {
    return undefined;
  }

  getHotelRent(): undefined {
    return undefined;
  }

  getHousePrice(): undefined {
    return undefined;
  }

  getHotelPrice(): undefined {
    return undefined;
  }

  getStationRent(nbOfStations: number): number {
    return this.rent[nbOfStations - 1];
  }
}

export class Prison implements Space {
  constructor(
    public id: string,
    public text: string
  ) {
  }

  color = null;

  setOwner(player: Player): void {
  }

  getOwner(): Player | null {
    return null;
  }

  canBuy(): boolean {
    return false;
  }

  getRent(): undefined {
    return undefined;
  }

  getRentAll(): undefined {
    return undefined;
  }

  getHouseRent(nbOfHouses: number): undefined {
    return undefined;
  }

  getHotelRent(): undefined {
    return undefined;
  }

  getHousePrice(): undefined {
    return undefined;
  }

  getHotelPrice(): undefined {
    return undefined;
  }

  getStationRent(nbOfStations: number): undefined {
    return undefined;
  }
}

export class FreeParking implements Space {
  constructor(
    public id: string,
    public text: string
  ) {
  }

  color = null;

  setOwner(player: Player): void {
  }

  getOwner(): Player | null {
    return null;
  }

  canBuy(): boolean {
    return false;
  }

  getRent(): undefined {
    return undefined;
  }

  getRentAll(): undefined {
    return undefined;
  }

  getHouseRent(nbOfHouses: number): undefined {
    return undefined;
  }

  getHotelRent(): undefined {
    return undefined;
  }

  getHousePrice(): undefined {
    return undefined;
  }

  getHotelPrice(): undefined {
    return undefined;
  }

  getStationRent(nbOfStations: number): undefined {
    return undefined;
  }
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
