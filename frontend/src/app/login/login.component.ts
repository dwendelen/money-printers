import {AfterViewInit, Component, Output, EventEmitter} from '@angular/core';
import {GoogleLoginService, LoginService} from './login.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: []
})
export class LoginComponent implements AfterViewInit {
  constructor(private readonly loginService: GoogleLoginService) {}

  errors: string[] = [];

  ngAfterViewInit(): void {
    this.loginService.getGoogleAuth()
      .then(_ => {
        gapi.signin2.render('googleSignIn', {});
      })
      .catch(err => {
        this.errors.push(err.toString());
      });
  }
}
