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
        const gameCreated = event as GameCreated;
        this.players.push(new Player(
          gameCreated.gameMaster.id,
          gameCreated.gameMaster.name
        ));
        this.board = gameCreated.board;
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
