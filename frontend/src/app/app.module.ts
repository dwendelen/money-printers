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
import { BuyThisSpaceComponent } from './games/game/buy-this-space/buy-this-space.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    GamesComponent,
    GameComponent,
    BuyThisSpaceComponent
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
