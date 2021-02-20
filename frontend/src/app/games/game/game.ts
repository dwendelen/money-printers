import {
  DiceRolled,
  Event,
  GameCreated,
  GameStarted,
  LandedOn,
  NewTurnStarted,
  PlayerAdded, SpaceBought,
  TurnEnded
} from '../api/event';

export class Game {
  events: Event[] = [];
  players: Player[] = [];
  board: Space[] = [];
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
        this.board = event.board
          .map(s => {
            switch (s.type) {
              case 'ActionSpace':
                return new ActionSpace(s.id, s.text);
              case 'Street':
                return new Street(s.id, s.text, s.color);
              case 'FreeParking':
                return new FreeParking(s.id, s.text);
              case 'Prison':
                return new Prison(s.id, s.text);
              case 'Station':
                return new Station(s.id, s.text);
              case 'Utility':
                return new Utility(s.id, s.text);
            }
          });
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
      case 'LandedOn':
        this.state.applyLandedOn(event);
        break;
      case 'SpaceBought':
        this.state.applySpaceBought(event);
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

  canBuyThis(): boolean {
    return this.state.canBuyGround();
  }

  playersOn(ground: Space): string {
    return this.players
      .filter(p => p.position === ground)
      .map(p => p.name)
      .join(', ');
  }

  getMyCash(): number {
    const thisPlayer = this.players
      .filter(p => p.id === this.myId)[0];
    return thisPlayer.money;
  }
}

class Player {
  money = 0;
  debt = 0;

  constructor(
    public id: string,
    public name: string,
    public position: Space
  ) {
  }
}

interface State {
  applyPlayerAdded(event: PlayerAdded): void;

  applyGameStarted(event: GameStarted): void;

  applyNewTurnStarted(event: NewTurnStarted): void;

  applyDiceRolled(event: DiceRolled): void;

  applyLandedOn(event: LandedOn): void;

  applySpaceBought(event: SpaceBought): void;

  applyTurnEnded(event: TurnEnded): void;

  canJoin(): boolean;

  canStartGame(): boolean;

  canRollDice(): boolean;

  canBuyGround(): boolean;

  canEndTurn(): boolean;
}

abstract class NothingState implements State {
  applyGameStarted(event: GameStarted): void {
  }

  applyPlayerAdded(event: PlayerAdded): void {
  }

  applyNewTurnStarted(event: NewTurnStarted): void {
  }

  applyDiceRolled(event: DiceRolled): void {
  }

  applyLandedOn(event: LandedOn): void {
  }

  applySpaceBought(event: SpaceBought): void {
  }

  applyTurnEnded(event: TurnEnded): void {
  }

  canJoin(): boolean {
    return false;
  }

  canStartGame(): boolean {
    return false;
  }

  canRollDice(): boolean {
    return false;
  }

  canBuyGround(): boolean {
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
      event.name,
      this.game.board[0]
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
    this.game.state = new WaitingForDiceOutcome(this.game, this.player);
  }

  canRollDice(): boolean {
    return this.player.id === this.game.myId;
  }
}

class WaitingForDiceOutcome extends NothingState {
  constructor(
    private game: Game,
    private player: Player
  ) {
    super();
  }

  applyLandedOn(event: LandedOn): void {
    this.player.position = this.game.board
      .filter(g => g.id === event.ground)[0];

    if (this.player.position.canBuy()) {
      this.game.state = new LandedOnNewGround(this.game, this.player);
    } else {
      this.game.state = new WaitingForEndTurn(this.game, this.player);
    }
  }
}

class LandedOnNewGround extends NothingState {
  constructor(
    private game: Game,
    private player: Player
  ) {
    super();
  }

  canBuyGround(): boolean {
    return this.player.id === this.game.myId;
  }

  applySpaceBought(event: SpaceBought): void {
    // TODO other players could also have bought
    this.player.position.setOwner(this.player);
    this.player.money -= event.cash;
    this.player.debt += event.borrowed;
    this.game.state = new WaitingForEndTurn(this.game, this.player);
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

interface Space {
  id: string;
  text: string;
  color: string | null;

  setOwner(player: Player): void;
  canBuy(): boolean;
}


class Street implements Space {
  constructor(
    public id: string,
    public text: string,
    public color: string
  ) {
  }

  owner: Player | null = null;

  setOwner(player: Player): void {
    this.owner = player;
  }

  canBuy(): boolean {
    return this.owner == null;
  }
}

class ActionSpace implements Space {
  constructor(
    public id: string,
    public text: string
  ) {
  }

  color = null;

  setOwner(player: Player): void {}

  canBuy(): boolean {
    return false;
  }
}

class Utility implements Space {
  constructor(
    public id: string,
    public text: string
  ) {
  }

  owner: Player | null = null;
  color = null;

  setOwner(player: Player): void {
    this.owner = player;
  }

  canBuy(): boolean {
    return this.owner == null;
  }
}

class Station implements Space {
  constructor(
    public id: string,
    public text: string
  ) {
  }

  owner: Player | null = null;
  color = 'lightgrey';

  setOwner(player: Player): void {
    this.owner = player;
  }

  canBuy(): boolean {
    return this.owner == null;
  }
}

class Prison implements Space {
  constructor(
    public id: string,
    public text: string
  ) {
  }

  color = null;

  setOwner(player: Player): void {}

  canBuy(): boolean {
    return false;
  }
}

class FreeParking implements Space {
  constructor(
    public id: string,
    public text: string
  ) {
  }

  color = null;

  setOwner(player: Player): void {}

  canBuy(): boolean {
    return false;
  }
}
