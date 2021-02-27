export type Command =
  AddPlayer |
  StartGame |
  RollDice |
  BuyThisSpace |
  EndTurn;

export class AddPlayer {
  type = 'AddPlayer';

  constructor(
    public id: string,
    public name: string,
    public color: string
  ) {
  }
}

export class StartGame {
  type = 'StartGame';
}

export class RollDice {
  type = 'RollDice';
}

export class BuyThisSpace {
  type = 'BuyThisSpace';
  constructor(
    public cash: number,
    public borrowed: number
  ) {
  }
}

export class EndTurn {
  type = 'EndTurn';
}
