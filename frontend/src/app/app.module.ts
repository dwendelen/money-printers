import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {AppComponent} from './app.component';
import {LoginComponent} from './login/login.component';
import {GamesComponent} from './games/games/games.component';
import {LoginService, GoogleLoginService} from './login/login.service';
import {GameComponent} from './games/game/game.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    GamesComponent,
    GameComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule
  ],
  providers: [
    {provide: LoginService, useClass: GoogleLoginService}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
