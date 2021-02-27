import {Component, DoCheck, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';

@Component({
  selector: 'app-color-selector',
  templateUrl: './color-selector.component.html',
  styleUrls: ['./color-selector.component.scss']
})
export class ColorSelectorComponent implements DoCheck {

  constructor() { }

  @Input()
  disabled!: boolean;
  @Input()
  exclude!: string[];
  colors = [
    '#0000FF',
    '#00FF00',
    '#00FFFF',
    '#FF0000',
    '#FF00FF',
    '#FFFF00'
  ];
  availableColors!: string[];
  selectedColor!: string;
  @Output()
  selectedColorChange = new EventEmitter<string>();

  ngDoCheck(): void {
    this.availableColors = this.colors
      .filter(c => !this.exclude.includes(c));
    if (!this.availableColors.includes(this.selectedColor)) {
      this.selectedColor = this.availableColors[0];
    }
    this.selectedColorChange.emit(this.selectedColor);
  }
}
