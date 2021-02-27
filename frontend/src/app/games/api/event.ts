export type Event =
  GameCreated |
  PlayerAdded |
  GameStarted |
  NewTurnStarted |
  DiceRolled |
  StartMoneyReceived |
  LandedOn |
  SpaceBought |
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
  dice1: number;
  dice2: number;
}

export interface StartMoneyReceived {
  type: 'StartMoneyReceived';
  player: string;
  amount: number;
}

export interface LandedOn {
  type: 'LandedOn';
  ground: string;
}

export interface SpaceBought {
  type: 'SpaceBought';
  ground: string;
  player: string;
  cash: number;
  borrowed: number;
}

export interface TurnEnded {
  type: 'TurnEnded';
  player: string;
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
}

interface Station {
  type: 'Station';
  id: string;
  text: string;
  initialPrice: number;
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
