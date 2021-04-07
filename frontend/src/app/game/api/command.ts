export type Command =
  AddPlayer |
  StartGame |
  RollDice |
  BuyThisSpace |
  DeclineThisSpace |
  PlaceBid |
  PassBid |
  BuyWonBid |
  DemandRent |
  PayRent |
  EndTurn |
  AddOffer |
  UpdateOfferValue |
  RemoveOffer |
  AcceptTrade |
  RevokeTradeAcceptance;

export class AddPlayer {
  type: 'AddPlayer' = 'AddPlayer';

  constructor(
    public id: string,
    public name: string,
    public color: string
  ) {
  }
}

export class StartGame {
  type: 'StartGame' = 'StartGame';

  constructor(
    public initiator: string
  ) {
  }
}

export class RollDice {
  type: 'RollDice' = 'RollDice';

  constructor(
    public player: string
  ) {
  }
}

export class BuyThisSpace {
  type:'BuyThisSpace' = 'BuyThisSpace';

  constructor(
    public player: string,
    public cash: number,
    public borrowed: number
  ) {
  }
}

export class DeclineThisSpace {
  type: 'DeclineThisSpace' = 'DeclineThisSpace';

  constructor(
    public player: string
  ) {
  }
}

export class PlaceBid {
  type: 'PlaceBid' = 'PlaceBid';

  constructor(
    public player: string,
    public bid: number
  ) {
  }
}

export class PassBid {
  type: 'PassBid' = 'PassBid';

  constructor(
    public player: string
  ) {
  }
}

export class BuyWonBid {
  type: 'BuyWonBid' = 'BuyWonBid';

  constructor(
    public player: string,
    public cash: number,
    public borrowed: number
  ) {
  }
}


export class DemandRent {
  type: 'DemandRent' = 'DemandRent';

  constructor(
    public owner: string,
    public demandId: number
  ) {
  }
}

export class PayRent {
  type: 'PayRent' = 'PayRent';

  constructor(
    public player: string,
    public demandId: number
  ) {
  }
}

export class EndTurn {
  type: 'EndTurn' = 'EndTurn';

  constructor(
    public player: string
  ) {
  }
}

export class AddOffer {
  type: 'AddOffer' = 'AddOffer';

  constructor(
    public from: string,
    public to: string,
    public ownable: string,
    public value: number
  ) {
  }
}

export class UpdateOfferValue {
  type: 'UpdateOfferValue' = 'UpdateOfferValue';

  constructor(
    public from: string,
    public to: string,
    public ownable: string,
    public value: number
  ) {
  }
}

export class RemoveOffer {
  type: 'RemoveOffer' = 'RemoveOffer';

  constructor(
    public from: string,
    public to: string,
    public ownable: string
  ) {
  }
}

export class AcceptTrade {
  type: 'AcceptTrade' = 'AcceptTrade';

  constructor(
    public from: string,
    public to: string,
    public cashDelta: number,
    public debtDelta: number
  ) {
  }
}

export class RevokeTradeAcceptance {
  type: 'RevokeTradeAcceptance' = 'RevokeTradeAcceptance';

  constructor(
    public from: string,
    public to: string
  ) {
  }
}
