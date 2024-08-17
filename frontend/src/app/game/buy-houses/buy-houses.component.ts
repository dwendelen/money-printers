import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
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
  amounts: {[key: string]: number} = {}

  constructor() { }

  ngOnChanges(changes: SimpleChanges): void {
    this.streets = this.board
      .filter(b => b.type == 'Street')
      .map(b => b as Street)
      .filter(s => s.color == this.color)

    this.amounts = {}
    this.streets.forEach(s => {
      switch (s.buildState.type) {
        case 'Unbuilt':
          this.amounts[s.id] = 0
          break
        case 'Houses':
          this.amounts[s.id] = s.buildState.nbOfHouses
          break;
        case 'Hotel':
          this.amounts[s.id] = -1 //TODO
          break;
      }
    })
  }

  updateAmount(street: Street, amount: number) {
    this.amounts[street.id] = amount;
  }


}
