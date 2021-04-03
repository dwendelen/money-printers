import {Component, Input, OnInit} from '@angular/core';
import {Player} from '../game';

@Component({
  selector: 'app-player-name',
  template: '<span [style.color]="player.color">{{player.name}}</span>',
})
export class PlayerNameComponent implements OnInit {

  constructor() { }

  @Input()
  player!:Player

  ngOnInit(): void {
  }
}
