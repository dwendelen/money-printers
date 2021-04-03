import {Component, OnDestroy, OnInit} from '@angular/core';
import {LoggedInUser, LoginService} from '../../login/login.service';
import {GameService} from '../game.service';
import {Event} from '../api/event';
import {ActivatedRoute, Router} from '@angular/router';
import {catchError, first, map, mergeMap, publishReplay, startWith, withLatestFrom} from 'rxjs/operators';
import {ConnectableObservable, Observable, of, Subscription, zip} from 'rxjs';

@Component({
  selector: 'app-game-wrapper',
  templateUrl: './game-wrapper.component.html',
  styleUrls: []
})
export class GameWrapperComponent implements OnInit, OnDestroy {
  constructor(
    private readonly loginService: LoginService,
    private readonly gameService: GameService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
  }

  gameInfo$!: ConnectableObservable<GameInfo | null>;
  gameInfoSub!: Subscription;

  ngOnInit(): void {
    this.gameInfo$ = this.route.params.pipe(
      map(p => p['id']),
      mergeMap(gId => this.openGameOrNull(gId)),
      mergeMap(gId => gId ? this.getEventsOrNull(gId) : of(null)),
      withLatestFrom(this.loginService.getLoggedInUser$(), (gi, usr) => {
        if (gi == null || usr == null) {
          return null;
        } else {
          return new GameInfo(
            gi.gameId,
            gi.initialEvents,
            usr
          );
        }
      }),
      startWith(null),
      publishReplay(1),
    ) as ConnectableObservable<GameInfo | null>;
    this.gameInfoSub = this.gameInfo$.connect();
  }

  private openGameOrNull(gId: string): Observable<string | null> {
    return this.gameService.openGame(gId).pipe(
      catchError(_ => of(null))
    );
  }

  private getEventsOrNull(gId: string): Observable<GameInfo1 | null> {
    return this.gameService.getEvents(gId, 0).pipe(
      map(e => new GameInfo1(gId, e)),
      catchError(_ => of(null))
    );
  }

  exitGame(): void {
    this.router.navigate(['games']);
  }

  logout(): void {
    this.loginService.logout();
    this.router.navigate(['login']);
  }

  ngOnDestroy(): void {
    this.gameInfoSub.unsubscribe();
  }
}

class GameInfo1 {
  constructor(
    public gameId: string,
    public initialEvents: Event[]
  ) {
  }
}

class GameInfo {
  constructor(
    public gameId: string,
    public initialEvents: Event[],
    public user: LoggedInUser
  ) {
  }
}
