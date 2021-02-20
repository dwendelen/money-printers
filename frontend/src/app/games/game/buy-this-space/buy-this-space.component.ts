import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

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
  price!: number;
  @Input()
  maxCash!: number;
  @Output()
  buy = new EventEmitter<BuyData>();

  ngOnInit(): void {
    this.cash = 0;
    this.cashField = '0';
    this.borrowed = this.price;
    this.borrowedField = this.borrowed.toString();
  }

  cashChanged(): void {
    this.cash = this.correct(
      this.cashField,
      0,
      this.cash,
      Math.min(this.maxCash, this.price)
    );
    this.borrowed = this.price - this.cash;
  }

  borrowedChanged(): void {
    this.borrowed = this.correct(
      this.borrowedField,
      Math.max(this.price - this.maxCash, 0),
      this.borrowed,
      this.price
    );
    this.cash = this.price - this.borrowed;
  }

  private correct(val: string, minVal: number, original: number, maxVal: number): number {
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

  triggerBuy(): void {
    this.buy.emit(new BuyData(this.cash, this.borrowed));
  }
}

class BuyData{
  constructor(
    public cash: number,
    public borrowed: number
  ) {
  }
}
