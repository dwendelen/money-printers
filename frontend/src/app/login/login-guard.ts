import {LoginService} from './login.service';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import { map} from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class LoginGuard implements CanActivate {
  constructor(
    private loginService: LoginService,
    private router: Router
  ) {
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree>  {
    return this.loginService.getLoggedInUser$().pipe(
      map(usr => {
        if(usr == null) {
          return this.router.createUrlTree(['login'], { queryParams: {goTo: LoginGuard.getUrl(route) } })
        } else {
          return true;
        }
      })
    );
  }

  private static getUrl(route: ActivatedRouteSnapshot) {
    return route.url.map(u => u.path).join('/');
  }
}
