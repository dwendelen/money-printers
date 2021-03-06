export type Command =
  AddPlayer |
  StartGame |
  RollDice |
  BuyThisSpace |
  DemandRent |
  PayRent |
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

export class DemandRent {
  type = 'DemandRent';

  constructor(
    public owner: string,
    public demandId: number
  ) {
  }
}

export class PayRent {
  type = 'PayRent';

  constructor(
    public player: string,
    public demandId: number
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
