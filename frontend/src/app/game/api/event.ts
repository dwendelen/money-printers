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
  BidStarted |
  BidPlaced |
  BidPassed |
  BidWon |
  LandedOnHostileSpace |
  RentDemanded |
  RentPaid |
  TurnEnded |
  OfferAdded |
  OfferValueUpdated |
  OfferRemoved |
  TradeAccepted |
  TradeAcceptanceRevoked |
  TradeCompleted;

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
  startDebt: number;
}

export interface PromotedToGameMaster {
  type: 'PromotedToGameMaster';
  player: string;
}

export interface GameStarted {
  type: 'GameStarted';
  initiator: string;
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

export interface BidStarted {
  type: 'BidStarted';
  ground: string;
  defaultWinner: string;
}

export interface BidPlaced {
  type: 'BidPlaced';
  player: string;
  bid: number;
}

export interface BidPassed {
  type: 'BidPassed';
  player: string;
}

export interface BidWon {
  type: 'BidWon';
  player: string;
  bid: number;
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
  player: string;
}

export interface OfferAdded {
  type: 'OfferAdded'
  from: string,
  to: string,
  ownable: string,
  value: number
}

export interface OfferValueUpdated {
  type: 'OfferValueUpdated'
  from: string,
  to: string,
  ownable: string,
  value: number
}

export interface OfferRemoved {
  type: 'OfferRemoved'
  from: string,
  to: string,
  ownable: string
}

export interface TradeAccepted {
    type: 'TradeAccepted';
    by: string
    other: string
}

export interface TradeAcceptanceRevoked {
  type: 'TradeAcceptanceRevoked' ;
  by: string
  other: string
}

export interface TradeCompleted {
  type: 'TradeCompleted'
  party1: string
  party2: string
  payments: Payment[]
  transfers: Transfer[]
}


export interface Payment {
  player: string,
  cashDelta: number,
  debtDelta: number
}

export interface Transfer {
  ownable: string
  from: string
  to: string
  value: number
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
