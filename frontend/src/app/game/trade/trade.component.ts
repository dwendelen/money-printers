import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Offer, Ownable, Player, TradeParty} from '../game';

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
  update = new EventEmitter<OfferInfo>();
  @Output()
  remove = new EventEmitter<string>();
  @Output()
  onAccept = new EventEmitter<Acceptance>();
  @Output()
  onRevokeAcceptance = new EventEmitter<void>();
  @Output()
  close = new EventEmitter<void>();

  getCash = 0
  giveCash = 0
  borrow = 0
  payBack = 0

  ngOnInit(): void {
  }

  get myParty(): TradeParty {
    return this.otherPlayer.trade.me;
  }

  get otherParty(): TradeParty {
    return this.otherPlayer.trade.other;
  }

  gettingPrice(): number {
    return TradeComponent.totalPrice(this.otherParty);
  }

  giveCashChanged(cash: number) {
    this.giveCash = cash;
    this.revokeAcceptance()
  }

  spillToGiveCash(): void {
    this.giveCashChanged(this.giveCash + this.unaccountedGetting());
  }

  borrowChanged(debt: number) {
    this.borrow = debt;
    this.revokeAcceptance()
  }

  spillToBorrow(): void {
    this.borrowChanged(this.borrow + this.unaccountedGetting());
  }

  unaccountedGetting(): number {
    return this.gettingPrice() - this.giveCash - this.borrow;
  }

  invalidUnaccountedGetting(): boolean {
    return this.unaccountedGetting() != 0;
  }

  givingProfit(): number {
    return TradeComponent.totalPrice(this.myParty);
  }

  getCashChanged(cash: number) {
    this.getCash = cash;
    this.revokeAcceptance()
  }

  spillToGetCash(): void {
    this.getCashChanged(this.getCash + this.unaccountedGiving());
  }

  payBackChanged(debt: number) {
    this.payBack = debt;
    this.revokeAcceptance()
  }

  spillToPayBack(): void {
    this.payBackChanged(this.payBack + this.unaccountedGiving());
  }

  unaccountedGiving(): number {
    return this.givingProfit() - this.getCash - this.payBack;
  }

  invalidUnaccountedGiving(): boolean {
    return this.unaccountedGiving() != 0;
  }

  get offerable(): Ownable[] {
    return this.myOwnables
      .filter(o => !this.myParty.offers
        .map(o => o.ownable)
        .includes(o)
      );
  }

  assetDelta(): number {
    const minusAssets = this.myParty.offers
      .map(o => o.ownable.assetValue!)
      .reduce((a, b) => a + b, 0)
    const plusValue = TradeComponent.totalPrice(this.otherParty);
    return plusValue - minusAssets;
  }

  private static totalPrice(party: TradeParty): number {
    return party.offers
      .map(o => o.value)
      .reduce((a, b) => a + b, 0)
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

  invalidMoney(): boolean {
    return this.projectedCash() < 0;
  }

  invalidAssets(): boolean {
    return this.projectedDebt() > this.projectedAssets();
  }

  invalidDebt(): boolean {
    return this.projectedDebt() > this.projectedAssets() || this.projectedDebt() < 0;
  }

  accept() {
    if(!this.myParty.accepted) {
      this.onAccept.emit(new Acceptance(
        this.giveCash,
        this.borrow,
        this.getCash,
        this.payBack
      ))
    }
  }

  revokeAcceptance() {
    if(this.myParty.accepted) {
      this.onRevokeAcceptance.emit()
    }
  }

  acceptDisabled(): boolean {
    return this.disabled ||
      this.invalidDebt() ||
      this.invalidMoney() ||
      this.invalidUnaccountedGetting() ||
      this.invalidUnaccountedGiving();
  }

  addOwnable(ownable: Ownable): void {
    this.add.emit(new OfferInfo(
      ownable.id,
      ownable.assetValue!
    ))
  }

  removeOffer(offer: Offer): void {
    this.remove.emit(offer.ownable.id)
  }

  changeValue(offer: Offer, newValue: number) {
    this.update.emit(new OfferInfo(
      offer.ownable.id,
      newValue
    ))
  }
}

export class OfferInfo {
  constructor(
    public ownable: string,
    public value: number
  ) {
  }
}

export class Acceptance {
  constructor(
    public giveCash: number,
    public borrow: number,
    public getCash: number,
    public payBack: number
  ) {
  }
}
