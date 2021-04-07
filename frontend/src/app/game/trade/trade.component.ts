import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
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

  getCash = 0
  giveCash = 0
  borrow = 0
  payBack = 0

  ngOnInit(): void {
  }

  gettingPrice(): number {
    return this.otherPlayer.getting
      .map(o => o.value)
      .reduce((a, b) => a + b, 0);
  }

  giveCashChanged(cash: number) {
    this.giveCash = cash;
  }

  borrowChanged(debt: number) {
    this.borrow = debt;
  }

  unaccountedGetting(): number {
    return this.gettingPrice() - this.giveCash - this.borrow;
  }

  invalidUnaccountedGetting(): boolean {
    return this.unaccountedGetting() != 0;
  }

  givingProfit(): number {
    return this.otherPlayer.giving
      .map(o => o.value)
      .reduce((a, b) => a + b, 0);
  }

  getCashChanged(cash: number) {
    this.getCash = cash;
  }

  payBackChanged(debt: number) {
    this.payBack = debt;
  }

  unaccountedGiving(): number {
    return this.givingProfit() - this.getCash - this.payBack;
  }

  invalidUnaccountedGiving(): boolean {
    return this.unaccountedGiving() != 0;
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
    return this.givingProfit() - this.gettingPrice();
  }

  cashDelta() {
    return this.getCash - this.giveCash;
  }

  debtDelta() {
    return this.borrow - this.payBack;
  }

  projectedCash(): number {
    return this.me.money + this.cashDelta();
  }

  projectedAssets(): number {
    return this.me.assets + this.assetDelta();
  }

  projectedDebt(): number {
    return this.me.debt + this.debtDelta();
  }

  invalidDebt(): boolean {
    return this.projectedDebt() > this.projectedAssets();
  }

  invalidMoney(): boolean {
    return this.projectedCash() < 0;
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
