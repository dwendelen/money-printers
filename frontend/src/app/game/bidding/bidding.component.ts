import {Component, EventEmitter, Input, Output} from '@angular/core';
import {Bidding} from './bidding';

@Component({
  selector: 'app-bidding',
  templateUrl: './bidding.component.html',
  styleUrls: ['./bidding.component.scss']
})
export class BiddingComponent {

  constructor() { }

  @Input()
  bidding!: Bidding;
  @Input()
  disabled!: boolean;
  @Output()
  pass = new EventEmitter<void>();
  @Output()
  bid = new EventEmitter<number>();

  bidAmount: number = 0;

  canBid(): boolean {
    return !this.disabled &&
      this.bidAmount > this.bidding.bid;
  }

  canPass(): boolean {
    return !this.disabled &&
      !this.bidding.winning &&
      this.bidding.participating;
  }

  triggerBid(): void {
    this.bid.emit(this.bidAmount!!);
  }

  triggerPass(): void {
    this.pass.emit();
  }
}
