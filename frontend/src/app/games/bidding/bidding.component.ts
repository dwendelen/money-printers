import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
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

  bidField = '';
  bidAmount: number | null = null;

  bidChanged(): void {
    const num = parseInt(this.bidField, 10);
    if (isNaN(num)) {
      this.bidAmount = null;
      this.bidField = '';
    } else {
      this.bidAmount = num;
      this.bidField = num.toString();
    }
  }

  canBid(): boolean {
    return !this.disabled &&
      this.bidAmount != null &&
      this.bidAmount > this.bidding.bid;
  }

  canPass(): boolean {
    return !this.disabled &&
      !this.bidding.winning &&
      this.bidding.participating;
  }

  triggerBid(): void {
    this.bid.emit(this.bidAmount!!);
    this.bidField = '';
    this.bidChanged();
  }

  triggerPass(): void {
    this.pass.emit();
    this.bidField = '';
    this.bidChanged();
  }
}
