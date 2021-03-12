import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Ownable, Space} from '../game';

@Component({
  selector: 'app-buy-this-space',
  templateUrl: './buy-this-space.component.html',
  styleUrls: ['./buy-this-space.component.scss']
})
export class BuyThisSpaceComponent implements OnInit {
  constructor() { }

  cashField!: string;
  borrowedField!: string;
  cash!: number;
  borrowed!: number;
  @Input()
  space!: Ownable;
  @Input()
  maxCash!: number;
  @Input()
  disabled!: boolean;
  @Output()
  buy = new EventEmitter<BuyData>();
  @Output()
  dontBuy = new EventEmitter<void>();

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
    this.borrowed = this.space.getInitialPrice();
    this.borrowedField = this.borrowed.toString();
  }

  cashChanged(): void {
    this.cash = BuyThisSpaceComponent.correct(
      this.cashField,
      0,
      this.cash,
      Math.min(this.maxCash, this.space.getInitialPrice())
    );
    this.cashField = this.cash.toString();
    this.borrowed = this.space.getInitialPrice() - this.cash;
    this.borrowedField = this.borrowed.toString();
  }

  borrowedChanged(): void {
    this.borrowed = BuyThisSpaceComponent.correct(
      this.borrowedField,
      this.space.getInitialPrice() - Math.min(this.maxCash, this.space.getInitialPrice()),
      this.borrowed,
      this.space.getInitialPrice()
    );
    this.borrowedField = this.borrowed.toString();
    this.cash = this.space.getInitialPrice() - this.borrowed;
    this.cashField = this.cash.toString();
  }

  triggerBuy(): void {
    this.buy.emit(new BuyData(this.cash, this.borrowed));
  }

  triggerDontBuy(): void {
    this.dontBuy.emit();
  }
}

class BuyData{
  constructor(
    public cash: number,
    public borrowed: number
  ) {
  }
}
