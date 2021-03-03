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

  constructor(
    public initiator: string
  ) {
  }
}

export class RollDice {
  type = 'RollDice';

  constructor(
    public player: string
  ) {
  }
}

export class BuyThisSpace {
  type = 'BuyThisSpace';

  constructor(
    public player: string,
    public cash: number,
    public borrowed: number
  ) {
  }
}

export class DemandPayment {
  type = 'DemandPayment';

  constructor(
    public initiator: string,
    public player: string,
    public space: string
  ) {
  }
}

export class EndTurn {
  type = 'EndTurn';

  constructor(
    public player: string
  ) {
  }
}
