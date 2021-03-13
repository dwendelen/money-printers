import {Component, Input} from '@angular/core';
import {Game, Player, Space} from '../game';

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent {
  @Input()
  game!: Game

  getPlayer(id: string): Player {
    return this.game.getPlayer(id)
  }

  getGround(id: string): Space {
    return this.game.getSpace(id)
  }
}
