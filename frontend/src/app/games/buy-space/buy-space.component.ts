import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Ownable, Space} from '../game';
import {MoneyAllocation} from './buy-space';

@Component({
  selector: 'app-buy-space',
  templateUrl: './buy-space.component.html',
  styleUrls: ['./buy-space.component.scss']
})
export class BuySpaceComponent implements OnInit {
  constructor() {
  }

  cashField!: string;
  borrowedField!: string;
  private cash!: number;
  private borrowed!: number;
  @Input()
  price!: number;
  @Input()
  maxCash!: number;
  @Output()
  onChange = new EventEmitter<MoneyAllocation>()

  private static correct(val: string, minVal: number, original: number, maxVal: number): number {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      return original;
    }
    if (num < minVal) {
      return minVal;
    }
    if (num > maxVal) {
      return maxVal;
    }
    return num;
  }

  ngOnInit(): void {
    this.cash = 0;
    this.cashField = '0';
    this.borrowed = this.price;
    this.borrowedField = this.borrowed.toString();
    this.triggerChange();
  }

  cashChanged(): void {
    this.cash = BuySpaceComponent.correct(
      this.cashField,
      0,
      this.cash,
      Math.min(this.maxCash, this.price)
    );
    this.cashField = this.cash.toString();
    this.borrowed = this.price - this.cash;
    this.borrowedField = this.borrowed.toString();
    this.triggerChange();
  }

  borrowedChanged(): void {
    this.borrowed = BuySpaceComponent.correct(
      this.borrowedField,
      this.price - Math.min(this.maxCash, this.price),
      this.borrowed,
      this.price
    );
    this.borrowedField = this.borrowed.toString();
    this.cash = this.price - this.borrowed;
    this.cashField = this.cash.toString();
    this.triggerChange();
  }

  private triggerChange() {
    this.onChange.emit(new MoneyAllocation(this.cash, this.borrowed));
  }
}
