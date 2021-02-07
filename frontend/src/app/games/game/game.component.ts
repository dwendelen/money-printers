import {Component,  Input, OnInit} from '@angular/core';
import {LoggedInUser, LoginService} from '../../login/login.service';
import {GameService} from '../game.service';
import {GameInfo} from '../api/api';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss']
})
export class GameComponent implements OnInit {

  constructor(
    private readonly loginService: LoginService,
    private readonly gameService: GameService
  ) {
  }

  @Input()
  user!: LoggedInUser;
  @Input()
  gameInfo!: GameInfo;

  ngOnInit(): void {
  }

  logout(): void {
    this.loginService.logout();
  }
}
