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
    this.otherPlayer.trade.giveCash = cash;
    this.revokeAcceptance()
  }

  spillToGiveCash(): void {
    this.giveCashChanged(this.otherPlayer.trade.giveCash + this.unaccountedGetting());
  }

  borrowChanged(debt: number) {
    this.otherPlayer.trade.borrow = debt;
    this.revokeAcceptance()
  }

  spillToBorrow(): void {
    this.borrowChanged(this.otherPlayer.trade.borrow + this.unaccountedGetting());
  }

  unaccountedGetting(): number {
    return this.gettingPrice() - this.otherPlayer.trade.giveCash - this.otherPlayer.trade.borrow;
  }

  invalidUnaccountedGetting(): boolean {
    return this.unaccountedGetting() != 0;
  }

  givingProfit(): number {
    return TradeComponent.totalPrice(this.myParty);
  }

  getCashChanged(cash: number) {
    this.otherPlayer.trade.getCash = cash;
    this.revokeAcceptance()
  }

  spillToGetCash(): void {
    this.getCashChanged(this.otherPlayer.trade.getCash + this.unaccountedGiving());
  }

  payBackChanged(debt: number) {
    this.otherPlayer.trade.payBack = debt;
    this.revokeAcceptance()
  }

  spillToPayBack(): void {
    this.payBackChanged(this.otherPlayer.trade.payBack + this.unaccountedGiving());
  }

  unaccountedGiving(): number {
    return this.givingProfit() - this.otherPlayer.trade.getCash - this.otherPlayer.trade.payBack;
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
    return this.otherPlayer.trade.getCash - this.otherPlayer.trade.giveCash;
  }

  debtDelta() {
    return this.otherPlayer.trade.borrow - this.otherPlayer.trade.payBack;
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
        this.otherPlayer.trade.giveCash,
        this.otherPlayer.trade.borrow,
        this.otherPlayer.trade.getCash,
        this.otherPlayer.trade.payBack
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
