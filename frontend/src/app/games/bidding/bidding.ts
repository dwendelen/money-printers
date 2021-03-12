export class Bidding {
  constructor(
    public player: string,
    public bid: number,
    public numOtherPlayers: number,
    public winning: boolean,
    public participating: boolean
  ) {
  }
}
