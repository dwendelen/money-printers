import {Event} from './event';

export interface Events {
  events: Event[];
}

export interface GameInfo {
  id: string;
  events: Event[];
}

export interface CreateGame {
  gameMaster: {
    id: string;
    name: string;
  };
}

export interface Ground {
  text: string;
  color: string | null;
}
