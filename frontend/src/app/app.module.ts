import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {GamesComponent} from './games/games/games.component';
import {LoginService} from './login/login.service';
import {GameComponent} from './games/game/game.component';
import {environment} from '../environments/environment';
import { BuyThisSpaceComponent } from './games/buy-this-space/buy-this-space.component';
import { ColorSelectorComponent } from './games/color-selector/color-selector.component';
import { SpaceInfoComponent } from './games/space-info/space-info.component';
import { BiddingComponent } from './games/bidding/bidding.component';
import {BuySpaceComponent} from './games/buy-space/buy-space.component';
import { LogComponent } from './games/log/log.component';
import { PlayerNameComponent } from './games/player-name/player-name.component';
import { SpaceNameComponent } from './games/space-name/space-name.component';
import { TradeComponent } from './games/trade/trade.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    GamesComponent,
    GameComponent,
    BuyThisSpaceComponent,
    BuySpaceComponent,
    ColorSelectorComponent,
    SpaceInfoComponent,
    BiddingComponent,
    LogComponent,
    PlayerNameComponent,
    SpaceNameComponent,
    TradeComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    {provide: LoginService, useClass: environment.loginServiceType}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
