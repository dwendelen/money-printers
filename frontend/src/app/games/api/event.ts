export type Event =
  GameCreated |
  PlayerAdded |
  GameStarted |
  NewTurnStarted |
  DiceRolled |
  LandedOn |
  SpaceBought |
  TurnEnded;

export interface GameCreated {
  type: 'GameCreated';
  gameMaster: string;
  board: Space[];
}

export interface PlayerAdded {
  type: 'PlayerAdded';
  id: string;
  name: string;
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
}

interface Station {
  type: 'Station';
  id: string;
  text: string;
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
