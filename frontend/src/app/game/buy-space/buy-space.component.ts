import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {MoneyAllocation} from './buy-space';

@Component({
  selector: 'app-buy-space',
  templateUrl: './buy-space.component.html',
  styleUrls: ['./buy-space.component.scss']
})
export class BuySpaceComponent implements OnInit  {
  constructor() {
  }

  cash!: number;
  borrowed!: number;
  @Input()
  price!: number;
  @Input()
  maxCash!: number;
  @Output()
  onChange = new EventEmitter<MoneyAllocation>()

  ngOnInit(): void {
    this.cash = 0;
    this.borrowed = this.price;
    this.triggerChange();
  }

  updateCash(val: number) {
    this.cash = val;
    this.borrowed = this.price - this.cash;
    this.triggerChange();
  }

  cashMin(): number {
    return 0;
  }

  cashMax(): number {
    return Math.min(this.maxCash, this.price)
  }

  updateBorrowed(val: number) {
    this.borrowed = val;
    this.cash = this.price - this.borrowed;
    this.triggerChange();
  }

  borrowMin(): number {
    return this.price - this.cashMax();
  }

  borrowMax(): number {
    return this.price;
  }

  private triggerChange() {
    this.onChange.emit(new MoneyAllocation(this.cash, this.borrowed));
  }
}
