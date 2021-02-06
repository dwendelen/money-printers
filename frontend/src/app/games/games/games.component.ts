import {Component, Input, OnInit} from '@angular/core';
import {LoggedInUser, LoginService} from '../../login/login.service';

@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: []
})
export class GamesComponent implements OnInit {

  constructor(private readonly loginService: LoginService) {
  }

  @Input()
  user: LoggedInUser | undefined;
  name: string | undefined;
  gameId: string | undefined;

  ngOnInit(): void {
    this.name = this.user?.getName();
  }

  logout(): void {
    this.loginService.logout();
  }

  newGame(): void {
    console.log(`New game with name ${this.name}`);
  }

  joinGame(): void {
    console.log(`Join ${this.gameId} with name ${this.name}`);
  }
}
