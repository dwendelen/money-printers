import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {GoogleLoginService, LoginService} from './login.service';
import {ActivatedRoute, Router} from '@angular/router';
import {map, withLatestFrom} from 'rxjs/operators';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: []
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private readonly loginService: LoginService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  errors: string[] = [];
  sub!: Subscription;

  ngOnInit(): void {
    const goTo$ = this.route.queryParams.pipe(
      map(p => p['goTo'] || '/games')
    );

    this.sub = this.loginService.getLoggedInUser$().pipe(
      withLatestFrom(goTo$, (usr, goto) => goto)
    ).subscribe(goTo =>
      this.router.navigateByUrl(goTo)
    );
  }

  ngAfterViewInit(): void {
    this.loginService.renderButton('googleSignIn');
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe()
  }
}
