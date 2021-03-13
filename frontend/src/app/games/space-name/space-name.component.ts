import {Component, Input, OnInit} from '@angular/core';
import {Ownable, Space} from '../game';

@Component({
  selector: 'app-space-name',
  template: '<span [style.background-color]="space.color">{{space.text}}</span>',
})
export class SpaceNameComponent implements OnInit {

  constructor() { }

  @Input()
  space!: Space

  ngOnInit(): void {
  }
}
