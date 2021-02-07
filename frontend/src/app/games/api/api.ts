export interface CreateGame {
  gameMaster: {
    id: string;
    name: string;
  };
}

export interface GameInfo {
  id: string;
  players: [Player];
  board: [Ground];
}

interface Player {
  id: string;
  name: string;
  money: number;
  debt: number;
}

interface Ground {
  text: string;
  color: string | null;
}


export interface JoinGame {
  name: string;
}
