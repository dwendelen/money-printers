import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {v4 as uuid_v4} from 'uuid';
import {CreateGame, GameInfo, JoinGame} from './api/api';

@Injectable({providedIn: 'root'})
export class GameService {
  constructor(private http: HttpClient) {
  }

  newGame(gameMasterId: string, gameMasterName: string, token: string): Promise<GameInfo> {
    const gameId = uuid_v4();
    const createGame: CreateGame = {
      gameMaster: {
        id: gameMasterId,
        name: gameMasterName
      }
    };
    return this.createGame(gameId, createGame, token);
  }

  joinGame(gameId: string, token: string): Promise<GameInfo> {
    return this.getGame(gameId, token);
  }

  private getGame(gameId: string, token: string): Promise<GameInfo> {
    return this.http
      .get<GameInfo>(
        `/api/games/${encodeURI(gameId)}`,
        authorizationHeader(token)
      )
      .toPromise();
  }

  private createGame(gameId: string, createGame: CreateGame, token: string): Promise<GameInfo> {
    return this.http
      .put<GameInfo>(
        `/api/games/${encodeURI(gameId)}`,
        createGame,
        authorizationHeader(token)
      )
      .toPromise();
  }
}

type AuthorizationHeader = {
  headers: {
    [header: string]: string;
  }
};

function authorizationHeader(token: string): AuthorizationHeader {
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
}
