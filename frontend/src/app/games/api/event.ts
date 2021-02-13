import {Ground} from './api';

export type Event =
  GameCreated |
  PlayerAdded |
  GameStarted |
  NewTurnStarted |
  DiceRolled |
  TurnEnded;

export interface GameCreated {
  type: 'GameCreated';
  gameMaster: string;
  board: Ground[];
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

export interface TurnEnded {
  type: 'TurnEnded';
  player: string;
}
