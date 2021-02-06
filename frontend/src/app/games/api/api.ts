export interface CreateGame {
  gameMaster: {
    id: string;
    name: string;
  };
}

export interface GameInfo {
  id: string;
  players: [Player];
}

interface Player {
  id: string;
  name: string;
}

export interface JoinGame {
  name: string;
}
