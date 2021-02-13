import {Event, GameCreated} from '../api/event';
import {Ground} from '../api/api';

export class Game {
  events: Event[] = [];
  players: Player[] = [];
  board: Ground[] = [];
  economy = 0;
  state = State.WAITING;
  gameMasterId: string | undefined;
  currentPlayer: string | undefined;

  constructor(
    public myId: string
  ) {
  }

  apply(event: Event): void {
    switch (event.type) {
      case 'GameCreated':
        this.board = event.board;
        this.gameMasterId = event.gameMaster;
        break;
      case 'PlayerAdded':
        this.players.push(new Player(
          event.id,
          event.name
        ));
        break;
      case 'GameStarted':
        this.state = State.PLAYING;
        break;
      case 'NewRoundStarted':
        this.currentPlayer = event.player;
        break;
      case 'DiceRolled':
        const player = this.players.filter(p => p.id === this.currentPlayer)[0];
        player.position = (player.position + event.dice1 + event.dice2) % this.board.length;
        break;
    }
    this.events.push(event);
  }

  canJoin(): boolean {
    return this.state === State.WAITING &&
      !this.players.some(p => p.id === this.myId);
  }

  canStartGame(): boolean {
    return this.state === State.WAITING &&
      this.myId === this.gameMasterId &&
      this.players.length >= 2;
  }

  canRollDice(): boolean {
    return this.state === State.PLAYING &&
      this.currentPlayer === this.myId;
  }

  playersOn(ground: Ground): string {
    const position = this.board.indexOf(ground);
    return this.players
      .filter(p => p.position === position)
      .map(p => p.name)
      .join(', ');
  }
}

class Player {
  money = 0;
  debt = 0;
  position = 0;

  constructor(
    public id: string,
    public name: string
  ) {
  }
}

enum State {
  WAITING,
  PLAYING
}
