import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {v4 as uuid_v4} from 'uuid';
import {CommandResult, CreateGame, Events, GameInfo} from './api/api';
import {Event} from './api/event';
import {Command} from './api/command';

@Injectable({providedIn: 'root'})
export class GameService {
  constructor(private http: HttpClient) {
  }

  newGame(gameMasterId: string, token: string): Promise<GameInfo> {
    const gameId = uuid_v4();
    const createGame: CreateGame = {
      gameMaster: gameMasterId
    };
    return this.http
      .put<GameInfo>(
        `api/games/${encodeURI(gameId)}`,
        createGame,
        authorizationHeader(token)
      )
      .toPromise();
  }

  openGame(gameId: string): Promise<GameInfo> {
    return this.http
      .get<GameInfo>(`api/games/${encodeURI(gameId)}`)
      .toPromise();
  }

  getEvents(gameId: string, skip: number): Promise<Event[]> {
    return this.http
      .get<Events>(`api/games/${encodeURI(gameId)}/events?skip=${skip.toString()}&limit=50&timeout=5000`)
      .toPromise()
      .then(e => e.events);
  }

  sendCommand(gameId: string, command: Command, version: number): Promise<Event[] | null> {
    return this.http
      .put<CommandResult>(`api/games/${encodeURI(gameId)}/commands?version=${version.toString()}&limit=50`, command)
      .toPromise()
      .then(e => {
        if (e.success) {
          return e.events;
        } else {
          return null;
        }
      });
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
