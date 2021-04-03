import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {LoginComponent} from './login/login.component';
import {GamesComponent} from './games/games.component';
import {LoginService} from './login/login.service';
import {GameComponent} from './game/game/game.component';
import {environment} from '../environments/environment';
import { BuyThisSpaceComponent } from './game/buy-this-space/buy-this-space.component';
import { ColorSelectorComponent } from './game/color-selector/color-selector.component';
import { SpaceInfoComponent } from './game/space-info/space-info.component';
import { BiddingComponent } from './game/bidding/bidding.component';
import {BuySpaceComponent} from './game/buy-space/buy-space.component';
import { LogComponent } from './game/log/log.component';
import { PlayerNameComponent } from './game/player-name/player-name.component';
import { SpaceNameComponent } from './game/space-name/space-name.component';
import { TradeComponent } from './game/trade/trade.component';
import {RouterModule} from '@angular/router';
import {AppComponent} from './app.component';
import {LoginGuard} from './login/login-guard';
import {GameWrapperComponent} from './game/game-wrapper/game-wrapper.component';
import {AmountComponent} from './game/amount/amount.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    GamesComponent,
    GameWrapperComponent,
    GameComponent,
    BuyThisSpaceComponent,
    BuySpaceComponent,
    ColorSelectorComponent,
    SpaceInfoComponent,
    BiddingComponent,
    LogComponent,
    PlayerNameComponent,
    SpaceNameComponent,
    TradeComponent,
    AmountComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      {
        path: "login",
        component: LoginComponent
      },
      {
        path: "games",
        component: GamesComponent,
        canActivate: [LoginGuard]
      },
      {
        path: "games/:id",
        component: GameWrapperComponent,
        canActivate: [LoginGuard]
      },
      {
        path: "",
        pathMatch: "full",
        redirectTo: "games"
      }
    ], { useHash: true })
  ],
  providers: [
    {provide: LoginService, useClass: environment.loginServiceType}
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
}
