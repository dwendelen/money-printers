export type Command = AddPlayer;

export class AddPlayer {
  type = 'AddPlayer';

  constructor(
    public id: string,
    public name: string
  ) {
  }
}
