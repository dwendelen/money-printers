import {Component, Input, OnInit} from '@angular/core';
import {Space} from '../game';

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

}
