import {Ownable} from '../game';

export class Bidding {
  constructor(
    public space: Ownable,
    public player: string,
    public bid: number,
    public numOtherPlayers: number,
    public winning: boolean,
    public participating: boolean
  ) {
  }
}
