import {Event} from './event';

export interface Events {
  events: Event[];
}

export interface CreateGame {
  gameMaster: string;
}

export interface CommandResult {
  success: boolean;
  events: Event[];
}
