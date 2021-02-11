import {Ground} from './api';

export type Event = GameCreated;

export interface GameCreated {
  type: 'GameCreated';
  gameMaster: {
    id: string;
    name: string;
  };
  board: Ground[];
}
