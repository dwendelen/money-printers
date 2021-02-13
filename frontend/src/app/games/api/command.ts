export type Command = AddPlayer | StartGame;

export class AddPlayer {
  type = 'AddPlayer';

  constructor(
    public id: string,
    public name: string
  ) {
  }
}

export class StartGame {
  type = 'StartGame';
}

export class RollDice {
  type = 'RollDice';
}
