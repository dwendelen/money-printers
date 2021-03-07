export type Event =
  GameCreated |
  PlayerAdded |
  PromotedToGameMaster |
  GameStarted |
  NewTurnStarted |
  DiceRolled |
  StartMoneyReceived |
  LandedOnSafeSpace |
  LandedOnBuyableSpace |
  SpaceBought |
  LandedOnHostileSpace |
  RentDemanded |
  RentPaid |
  TurnEnded;

export interface GameCreated {
  type: 'GameCreated';
  gameMaster: string;
  board: Space[];
  fixedStartMoney: number;
  interestRate: number;
  returnRate: number;
}

export interface PlayerAdded {
  type: 'PlayerAdded';
  id: string;
  name: string;
  color: string;
  startDebt: string;
}

export interface PromotedToGameMaster {
  type: 'PromotedToGameMaster';
  player: string;
}

export interface GameStarted {
  type: 'GameStarted';
}

export interface NewTurnStarted {
  type: 'NewTurnStarted';
  player: string;
}

export interface DiceRolled {
  type: 'DiceRolled';
  player: string;
  dice1: number;
  dice2: number;
}

export interface StartMoneyReceived {
  type: 'StartMoneyReceived';
  player: string;
  amount: number;
}

export interface LandedOnSafeSpace {
  type: 'LandedOnSafeSpace';
  player: string;
  ground: string;
}

export interface LandedOnBuyableSpace {
  type: 'LandedOnBuyableSpace';
  player: string;
  ground: string;
}

export interface SpaceBought {
  type: 'SpaceBought';
  ground: string;
  player: string;
  cash: number;
  borrowed: number;
}

export interface LandedOnHostileSpace {
  type: 'LandedOnHostileSpace';
  player: string;
  ground: string;
  owner: string;
  demandId: number;
}

export interface RentDemanded {
  type: 'RentDemanded';
  owner: string;
  player: string;
  rent: number;
  demandId: number;
}

export interface RentPaid {
  type: 'RentPaid';
  player: string;
  owner: string;
  rent: number;
  demandId: number;
}

export interface TurnEnded {
  type: 'TurnEnded';
}

type Space =
  Street |
  ActionSpace |
  Utility |
  Station |
  FreeParking |
  Prison;

interface Street {
  type: 'Street';
  id: string;
  text: string;
  color: string;
  initialPrice: number;
  rent: number;
  rentHouse: number[];
  rentHotel: number;
  priceHouse: number;
  priceHotel: number;
}

interface ActionSpace {
  type: 'ActionSpace';
  id: string;
  text: string;
}

interface Utility {
  type: 'Utility';
  id: string;
  text: string;
  initialPrice: number;
  rent: number;
  rentAll: number;
}

interface Station {
  type: 'Station';
  id: string;
  text: string;
  initialPrice: number;
  rent: number[];
}

interface Prison {
  type: 'Prison';
  id: string;
  text: string;
}

interface FreeParking {
  type: 'FreeParking';
  id: string;
  text: string;
}
