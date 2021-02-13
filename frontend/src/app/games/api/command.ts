export type Command =
  AddPlayer |
  StartGame |
  RollDice |
  EndTurn;

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

export class EndTurn {
  type = 'EndTurn';
}
