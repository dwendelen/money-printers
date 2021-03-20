import {Component, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {Offer, Ownable, Player} from '../game';

@Component({
  selector: 'app-trade',
  templateUrl: './trade.component.html',
  styleUrls: ['./trade.component.scss']
})
export class TradeComponent implements OnInit {
  @Input()
  otherPlayer!: Player
  @Input()
  myOwnables!: Ownable[]
  @Input()
  disabled!: boolean

  @Output()
  add = new EventEmitter<OfferInfo>();
  @Output()
  remove = new EventEmitter<OfferInfo>();
  @Output()
  close = new EventEmitter<void>();

  ngOnInit(): void {
  }

  get offerable(): Ownable[] {
    return this.myOwnables
      .filter(o => !this.otherPlayer.giving
        .map(o => o.ownable)
        .includes(o)
      );
  }

  addOwnable(ownable: Ownable): void {
    this.add.emit(new OfferInfo(
      this.otherPlayer.id,
      ownable.id,
      ownable.assetValue!
    ))
  }

  removeOffer(offer: Offer): void {
    this.remove.emit(new OfferInfo(
      this.otherPlayer.id,
      offer.ownable.id,
      offer.value
    ))
  }
}

export class OfferInfo {
  constructor(
    public otherPlayer: string,
    public ownable: string,
    public value: number
  ) {
  }
}
