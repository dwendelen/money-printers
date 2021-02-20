import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

@Component({
  selector: 'app-buy-this-space',
  templateUrl: './buy-this-space.component.html',
  styleUrls: ['./buy-this-space.component.scss']
})
export class BuyThisSpaceComponent implements OnInit {
  constructor() { }

  private _cash!: number;
  private _borrowed!: number;
  @Input()
  price!: number;
  @Output()
  buy = new EventEmitter<BuyData>();

  ngOnInit(): void {
    this._cash = 0;
    this._borrowed = this.price;
  }

  get cash(): string {
    return this._cash.toString();
  }
  set cash(val: string) {
    this._cash = this.correct(val);
    this._borrowed = this.price - this._cash;
  }

  get borrowed(): string {
    return this._borrowed.toString();
  }
  set borrowed(val: string) {
    this._borrowed = this.correct(val);
    this._cash = this.price - this._borrowed;
  }

  private correct(val: string): number {
    const num = parseInt(val, 10);
    if (isNaN(num)) {
      return 0;
    }
    if (num < 0) {
     return 0;
    }
    if (num > this.price) {
      return this.price;
    }
    return num;
  }

  triggerBuy(): void {
    this.buy.emit(new BuyData(this._cash, this._borrowed));
  }
}

class BuyData{
  constructor(
    public cash: number,
    public borrowed: number
  ) {
  }
}
