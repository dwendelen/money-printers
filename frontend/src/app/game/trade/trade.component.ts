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
  me!: Player
  @Input()
  myOwnables!: Ownable[]
  @Input()
  disabled!: boolean

  @Output()
  add = new EventEmitter<OfferInfo>();
  @Output()
  remove = new EventEmitter<OfferInfo>();
  @Output()
  update = new EventEmitter<OfferInfo>();
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

  assetDelta(): number {
    const minusAssets = this.otherPlayer.giving
      .map(o => o.ownable.assetValue!)
      .reduce((a, b) => a + b)
    const plusValue = this.otherPlayer.getting
      .map(o => o.value)
      .reduce((a, b) => a + b)
    return plusValue - minusAssets;
  }

  moneyDelta(): number {
    const plusMoney = this.otherPlayer.giving
      .map(o => o.value)
      .reduce((a, b) => a + b);
    const minusMoney = this.otherPlayer.getting
      .map(o => o.value)
      .reduce((a, b) => a + b);
    return plusMoney - minusMoney;
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

  changeValue(offer: Offer, newValue: number) {
    this.update.emit(new OfferInfo(
      this.otherPlayer.id,
      offer.ownable.id,
      newValue
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
