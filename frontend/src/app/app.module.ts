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

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    GamesComponent,
    GameComponent,
    BuyThisSpaceComponent,
    ColorSelectorComponent
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
