import {Ground} from './api';

export type Event = GameCreated | PlayerAdded;

export interface GameCreated {
  type: 'GameCreated';
  gameMaster: {
    id: string;
    name: string;
  };
  board: Ground[];
}

export interface PlayerAdded {
  type: 'PlayerAdded';
  id: string;
  name: string;
}
