import {Component, Input, OnInit} from '@angular/core';
import {Space, Station, Street, Utility} from '../game';

@Component({
  selector: 'app-space-info',
  templateUrl: './space-info.component.html',
  styleUrls: ['./space-info.component.scss']
})
export class SpaceInfoComponent implements OnInit {

  @Input()
  space!: Space;

  constructor() { }


  ngOnInit(): void {
  }

  isOwnable(): boolean {
    return this.space instanceof Street ||
      this.space instanceof Station ||
      this.space instanceof Utility;
  }

  isStreet(): boolean {
    return this.space instanceof Street;
  }
}
