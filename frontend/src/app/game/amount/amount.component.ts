import {Component, Input, Output, EventEmitter, OnChanges, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-amount',
  templateUrl: './amount.component.html',
  styleUrls: ['amount.scss']
})
export class AmountComponent implements OnChanges {

  @Input()
  id!: string
  @Input()
  value!: number
  @Input()
  min!: number
  @Input()
  max!: number
  @Output()
  changed = new EventEmitter<number>()

  field!: string

  ngOnChanges(changes: SimpleChanges): void {
    if(this.min > this.max) {
      throw new Error(`${this.min} is greater than ${this.max}`)
    }
    if(this.value < this.min) {
      this.set(this.min)
    } else if(this.value > this.max) {
      this.set(this.max)
    }
    this.syncField()
  }

  fieldChanged(): void {
    const num = parseInt(this.field, 10);
    if(isNaN(num)) {
      this.syncField()
      return
    }
    if(num < this.min) {
      this.set(this.min)
      this.syncField()
    } else if(num > this.max) {
      this.set(this.max)
      this.syncField()
    } else {
      this.set(num)
    }
  }

  private set(val: number) {
    if(val != this.value) {
      this.value = val;
      this.changed.emit(val);
    }
  }

  private syncField() {
    this.field = this.value.toString(10);
  }
}
