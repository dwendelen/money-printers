import {DiceRolled, Event, GameCreated, GameStarted, NewTurnStarted, PlayerAdded, TurnEnded} from '../api/event';
import {Ground} from '../api/api';

export class Game {
  events: Event[] = [];
  players: Player[] = [];
  board: Ground[] = [];
  economy = 0;
  state: State = new WaitingForStart(this);
  gameMasterId: string | undefined;

  constructor(
    public myId: string
  ) {
  }

  apply(event: Event): void {
    console.log('Event', event);
    switch (event.type) {
      case 'GameCreated':
        this.board = event.board;
        this.gameMasterId = event.gameMaster;
        break;
      case 'PlayerAdded':
        this.state.applyPlayerAdded(event);
        break;
      case 'GameStarted':
        this.state.applyGameStarted(event);
        break;
      case 'NewTurnStarted':
        this.state.applyNewTurnStarted(event);
        break;
      case 'DiceRolled':
        this.state.applyDiceRolled(event);
        break;
      case 'TurnEnded':
        this.state.applyTurnEnded(event);
        break;
    }
    this.events.push(event);
  }

  canJoin(): boolean {
    return this.state.canJoin();
  }

  canStartGame(): boolean {
    return this.state.canStartGame();
  }

  canRollDice(): boolean {
    return this.state.canRollDice();
  }

  canEndTurn(): boolean {
    return this.state.canEndTurn();
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

interface State {
  applyPlayerAdded(event: PlayerAdded): void;
  applyGameStarted(event: GameStarted): void;
  applyNewTurnStarted(event: NewTurnStarted): void;
  applyDiceRolled(event: DiceRolled): void;
  applyTurnEnded(event: TurnEnded): void;
  canJoin(): boolean;
  canStartGame(): boolean;
  canRollDice(): boolean;
  canEndTurn(): boolean;
}

abstract class NothingState implements State{
  applyDiceRolled(event: DiceRolled): void {}
  applyGameStarted(event: GameStarted): void {}
  applyNewTurnStarted(event: NewTurnStarted): void {}
  applyPlayerAdded(event: PlayerAdded): void {}
  applyTurnEnded(event: TurnEnded): void {}

  canJoin(): boolean {
    return false;
  }

  canStartGame(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  canEndTurn(): boolean {
    return false;
  }
}

class WaitingForStart extends NothingState {
  constructor(private game: Game) {
    super();
  }

  applyPlayerAdded(event: PlayerAdded): void {
    this.game.players.push(new Player(
      event.id,
      event.name
    ));
  }

  applyGameStarted(event: GameStarted): void {
    this.game.state = new WaitingForTurn(this.game);
  }

  canJoin(): boolean {
    return !this.game.players
      .some(p => p.id === this.game.myId);
  }

  canStartGame(): boolean {
    return this.game.myId === this.game.gameMasterId &&
    this.game.players.length >= 2;
  }
}

class WaitingForTurn extends NothingState {
  constructor(private game: Game) {
    super();
  }

  applyNewTurnStarted(event: NewTurnStarted): void {
    const player = this.game.players
      .find(p => p.id === event.player);
    if (!player) {
      throw new Error('Player not found');
    }
    this.game.state = new WaitingForDiceRoll(this.game, player);
  }
}

class WaitingForDiceRoll extends NothingState {
  constructor(
    private game: Game,
    private player: Player
  ) {
    super();
  }

  applyDiceRolled(event: DiceRolled): void {
    this.player.position = (this.player.position + event.dice1 + event.dice2) % this.game.board.length;
    this.game.state = new WaitingForEndTurn(this.game, this.player);
  }

  canRollDice(): boolean {
    return this.player.id === this.game.myId;
  }
}

class WaitingForEndTurn extends NothingState {
  constructor(
    private game: Game,
    private player: Player
  ) {
    super();
  }

  applyTurnEnded(event: TurnEnded): void {
    this.game.state = new WaitingForTurn(this.game);
  }

  canEndTurn(): boolean {
    return this.player.id === this.game.myId;
  }
}
