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

  cashDelta = 0
  debtDelta = 0

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
      .reduce((a, b) => a + b, 0)
    const plusValue = this.otherPlayer.getting
      .map(o => o.value)
      .reduce((a, b) => a + b, 0)
    return plusValue - minusAssets;
  }

  moneyDelta(): number {
    const moneyPlus = this.otherPlayer.giving
      .map(o => o.value)
      .reduce((a, b) => a + b, 0);
    const moneyMinus = this.otherPlayer.getting
      .map(o => o.value)
      .reduce((a, b) => a + b, 0);

    return moneyPlus - moneyMinus;
  }

  minDebtDelta(): number {
    const projectedAssets = this.me.assets + this.assetDelta();
    return projectedAssets - this.me.debt;
  }

  giveCash(): number {
    return Math.max(0, -this.cashDelta);
  }

  giveCashChanged(cash: number) {
    this.cashDelta = -cash;
  }

  giveCashMin(): number {
    return 0;
  }

  giveCashMax(): number {
    return Math.max(0, this.me.money + this.moneyDelta());
  }

  borrow(): number {
    return Math.max(0, this.debtDelta);
  }

  borrowChanged(debt: number) {
    this.debtDelta = debt;
  }

  borrowMin(): number {
    return Math.max(0, this.minDebtDelta());
  }

  borrowMax(): number {
    const projectedAssets = this.me.assets + this.assetDelta();
    return Math.max(0, projectedAssets - this.me.debt);
  }

  getCash(): number {
    return Math.max(0, this.cashDelta);
  }

  getCashChanged(cash: number) {
    this.cashDelta = cash;
  }

  getCashMin(): number {
    return 0;
  }

  getCashMax(): number {
    return Number.MAX_SAFE_INTEGER
  }

  payBack(): number {
    return Math.max(0, -this.debtDelta);
  }

  payBackChanged(debt: number) {
    this.debtDelta = -debt;
  }

  payBackMin(): number {
    return Math.max(0, -this.minDebtDelta())
  }

  payBackMax(): number {
    return Math.max(0, this.me.money + this.moneyDelta());
  }

  unaccounted(): number {
    return this.moneyDelta() - this.cashDelta + this.debtDelta;
  }

  projectedCash(): number {
    return this.me.money + this.cashDelta;
  }

  projectedAssets(): number {
    return this.me.assets + this.assetDelta();
  }

  projectedDebt(): number {
    return this.me.debt + this.debtDelta;
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
