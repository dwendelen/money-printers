import {Event, GameCreated} from '../api/event';
import {Ground} from '../api/api';

export class Game {
  events: Event[] = [];
  players: Player[] = [];
  board: Ground[] = [];
  economy = 0;

  constructor(
    public myId: string
  ) {
  }

  apply(event: Event): void {
    switch (event.type) {
      case 'GameCreated':
        this.players.push(new Player(
          event.gameMaster.id,
          event.gameMaster.name
        ));
        this.board = event.board;
        break;
      case 'PlayerAdded':
        this.players.push(new Player(
          event.id,
          event.name
        ));
        break;
    }
    this.events.push(event);
  }

  canJoin(): boolean {
    return !this.players
      .some(p => p.id === this.myId);
  }
}

class Player {
  money = 0;
  debt = 0;

  constructor(
    public id: string,
    public name: string
  ) {
  }
}
