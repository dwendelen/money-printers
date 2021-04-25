import {Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Space, Street} from '../game';

@Component({
  selector: 'app-buy-houses',
  templateUrl: './buy-houses.component.html',
  styleUrls: ['./buy-houses.component.scss']
})
export class BuyHousesComponent implements OnChanges {
  @Input()
  color!: string
  @Input()
  board!: Space[]
  streets!: Street[]

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.streets = this.board
      .filter(b => b.type == 'Street')
      .map(b => b as Street)
      .filter(s => s.color == this.color)
  }
}
