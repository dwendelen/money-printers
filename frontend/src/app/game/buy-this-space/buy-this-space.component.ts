import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Ownable} from '../game';
import {MoneyAllocation} from '../buy-space/buy-space';

@Component({
  selector: 'app-buy-this-space',
  templateUrl: './buy-this-space.component.html',
  styleUrls: ['./buy-this-space.component.scss']
})
export class BuyThisSpaceComponent implements OnInit {
  @Input()
  space!: Ownable;
  @Input()
  price!: number;
  @Input()
  maxCash!: number;
  @Input()
  disabled!: boolean;
  @Input()
  canDecline!: boolean;
  @Output()
  buy = new EventEmitter<MoneyAllocation>();
  @Output()
  dontBuy = new EventEmitter<void>();
  allocation= new MoneyAllocation(0,0);

  ngOnInit(): void {
  }

  triggerBuy(): void {
    this.buy.emit(this.allocation);
  }

  triggerDontBuy(): void {
    this.dontBuy.emit();
  }
}
