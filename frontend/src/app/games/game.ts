import {
  DiceRolled,
  Event,
  GameCreated,
  GameStarted,
  LandedOn,
  NewTurnStarted,
  PlayerAdded, SpaceBought, StartMoneyReceived,
  TurnEnded
} from './api/event';

export class Game {
  events: Event[] = [];
  players: Player[] = [];
  board: Space[] = [];
  economy = 0;
  state: State = new WaitingForStart(this);
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
        break;
      case 'PlayerAdded':
        this.state.applyPlayerAdded(event);
        break;
      case 'GameStarted':
        this.state.applyGameStarted(event);
        break;
      case 'NewTurnStarted':
        this.state.applyNewTurnStarted(event);
        break;
      case 'DiceRolled':
        this.state.applyDiceRolled(event);
        break;
      case 'StartMoneyReceived':
        this.state.applyStartMoneyReceived(event);
        break;
      case 'LandedOn':
        this.state.applyLandedOn(event);
        break;
      case 'SpaceBought':
        this.state.applySpaceBought(event);
        break;
      case 'TurnEnded':
        this.state.applyTurnEnded(event);
        break;
    }
    this.events.push(event);
  }

  hasPowerToStartGame(): boolean {
    return this.state.hasPowerToStartGame();
  }

  canJoin(): boolean {
    return this.state.canJoin();
  }

  canStartGame(): boolean {
    return this.state.canStartGame();
  }

  canRollDice(): boolean {
    return this.state.canRollDice();
  }

  canEndTurn(): boolean {
    return this.state.canEndTurn();
  }

  canBuyThis(): boolean {
    return this.state.canBuyGround();
  }

  isMyTurn(): boolean {
    return this.state.isMyTurn();
  }

  getMyCash(): number {
    const thisPlayer = this.players
      .filter(p => p.id === this.myId)[0];
    return thisPlayer.money;
  }

  getMyOwnable(): Ownable {
    const thisPlayer = this.players
      .filter(p => p.id === this.myId)[0];
    return thisPlayer.position as Ownable;
  }

  getStartMoney(player: Player): number {
    const interest = Math.floor(this.interestRate * player.debt);
    const economyMoney = Math.ceil(this.returnRate * this.economy);
    return this.fixedStartMoney + economyMoney  - interest;
  }
}

export class Player {
  money = 0;
  debt = 0;
  assets = 0;

  constructor(
    public id: string,
    public name: string,
    public color: string,
    public position: Space
  ) {
  }
}

interface State {
  applyPlayerAdded(event: PlayerAdded): void;

  applyGameStarted(event: GameStarted): void;

  applyNewTurnStarted(event: NewTurnStarted): void;

  applyDiceRolled(event: DiceRolled): void;

  applyStartMoneyReceived(event: StartMoneyReceived): void;

  applyLandedOn(event: LandedOn): void;

  applySpaceBought(event: SpaceBought): void;

  applyTurnEnded(event: TurnEnded): void;

  canJoin(): boolean;

  hasPowerToStartGame(): boolean;

  canStartGame(): boolean;

  canRollDice(): boolean;

  canBuyGround(): boolean;

  canEndTurn(): boolean;

  isMyTurn(): boolean;
}

abstract class NothingState implements State {
  applyGameStarted(event: GameStarted): void {
  }

  applyPlayerAdded(event: PlayerAdded): void {
  }

  applyNewTurnStarted(event: NewTurnStarted): void {
  }

  applyDiceRolled(event: DiceRolled): void {
  }

  applyStartMoneyReceived(event: StartMoneyReceived): void {
  }

  applyLandedOn(event: LandedOn): void {
  }

  applySpaceBought(event: SpaceBought): void {
  }

  applyTurnEnded(event: TurnEnded): void {
  }

  abstract isMyTurn(): boolean;

  canJoin(): boolean {
    return false;
  }

  hasPowerToStartGame(): boolean {
    return false;
  }

  canStartGame(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  canBuyGround(): boolean {
    return false;
  }

  canEndTurn(): boolean {
    return false;
  }
}

class WaitingForStart extends NothingState {
  constructor(private game: Game) {
    super();
  }

  applyPlayerAdded(event: PlayerAdded): void {
    this.game.players.push(new Player(
      event.id,
      event.name,
      event.color,
      this.game.board[0]
    ));
  }

  applyGameStarted(event: GameStarted): void {
    this.game.state = new WaitingForTurn(this.game);
  }

  canJoin(): boolean {
    return !this.game.players
      .some(p => p.id === this.game.myId);
  }

  hasPowerToStartGame(): boolean {
    return this.game.myId === this.game.gameMasterId;
  }

  canStartGame(): boolean {
    return this.hasPowerToStartGame() && this.game.players.length >= 2;
  }

  isMyTurn(): boolean {
    return false;
  }
}

class WaitingForTurn extends NothingState {
  constructor(private game: Game) {
    super();
  }

  applyNewTurnStarted(event: NewTurnStarted): void {
    const player = this.game.players
      .find(p => p.id === event.player);
    if (!player) {
      throw new Error('Player not found');
    }
    this.game.state = new WaitingForDiceRoll(this.game, player);
  }

  isMyTurn(): boolean {
    return false;
  }
}

class WaitingForDiceRoll extends NothingState {
  constructor(
    private game: Game,
    private player: Player
  ) {
    super();
  }

  applyDiceRolled(event: DiceRolled): void {
    this.game.state = new WaitingForDiceOutcome(this.game, this.player);
  }

  canRollDice(): boolean {
    return this.isMyTurn();
  }

  isMyTurn(): boolean {
    return this.player.id === this.game.myId;
  }
}

class WaitingForDiceOutcome extends NothingState {
  constructor(
    private game: Game,
    private player: Player
  ) {
    super();
  }

  applyStartMoneyReceived(event: StartMoneyReceived): void {
    const player = this.game.players
      .find(p => p.id === event.player);
    if (!player) {
      throw new Error('Player not found');
    }
    player.money += event.amount;
    this.game.economy -= event.amount;
  }

  applyLandedOn(event: LandedOn): void {
    this.player.position = this.game.board
      .filter(g => g.id === event.ground)[0];

    if (this.player.position.canBuy()) {
      this.game.state = new LandedOnNewGround(this.game, this.player);
    } else {
      this.game.state = new WaitingForEndTurn(this.game, this.player);
    }
  }

  isMyTurn(): boolean {
    return this.player.id === this.game.myId;
  }
}

class LandedOnNewGround extends NothingState {
  constructor(
    private game: Game,
    private player: Player
  ) {
    super();
  }

  canBuyGround(): boolean {
    return this.isMyTurn();
  }

  applySpaceBought(event: SpaceBought): void {
    const value = event.cash + event.borrowed;
    // TODO other players could also have bought
    this.player.position.setOwner(this.player);
    this.player.position.setAssetValue(value);
    this.player.money -= event.cash;
    this.player.debt += event.borrowed;
    this.game.economy += value;
    this.player.assets += value;
    this.game.state = new WaitingForEndTurn(this.game, this.player);
  }

  isMyTurn(): boolean {
    return this.player.id === this.game.myId;
  }
}

class WaitingForEndTurn extends NothingState {
  constructor(
    private game: Game,
    private player: Player
  ) {
    super();
  }

  applyTurnEnded(event: TurnEnded): void {
    this.game.state = new WaitingForTurn(this.game);
  }

  canEndTurn(): boolean {
    return this.isMyTurn();
  }

  isMyTurn(): boolean {
    return this.player.id === this.game.myId;
  }
}

export interface Space {
  id: string;
  text: string;
  color: string | null;

  setOwner(player: Player): void;
  getOwner(): Player | null | undefined;

  canBuy(): boolean;
  getInitialPrice(): number | undefined;
  getAssetValue(): number | null | undefined;
  setAssetValue(assetValue: number): void;
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
    return this.owner == null;
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

  setOwner(player: Player): void {}

  getOwner(): Player | null {
    return null;
  }

  canBuy(): boolean {
    return false;
  }

  getInitialPrice(): undefined {
    return undefined;
  }

  getAssetValue(): undefined {
    return undefined;
  }

  setAssetValue(assetValue: number): void {
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

  setOwner(player: Player): void {}

  getOwner(): Player | null {
    return null;
  }

  canBuy(): boolean {
    return false;
  }

  getInitialPrice(): undefined {
    return undefined;
  }

  getAssetValue(): undefined {
    return undefined;
  }

  setAssetValue(assetValue: number): void {
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

  setOwner(player: Player): void {}

  getOwner(): Player | null {
    return null;
  }

  canBuy(): boolean {
    return false;
  }

  getInitialPrice(): undefined {
    return undefined;
  }

  getAssetValue(): undefined {
    return undefined;
  }

  setAssetValue(assetValue: number): void {
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
