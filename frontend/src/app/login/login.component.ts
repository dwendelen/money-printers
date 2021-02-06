import {AfterViewInit, Component, Output, EventEmitter} from '@angular/core';
import {LoginService} from './login.service';

@Component({
  selector: 'app-login',
  template: '<div id="googleSignIn"></div>',
  styleUrls: []
})
export class LoginComponent implements AfterViewInit {
  constructor(private readonly loginService: LoginService) {}

  ngAfterViewInit(): void {
    this.loginService.getGoogleAuth()
      .then(_ => {
        gapi.signin2.render('googleSignIn', {});
      });
  }
}
