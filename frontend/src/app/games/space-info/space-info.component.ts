import {Component, Input, OnInit} from '@angular/core';
import {Ownable, Space, Station, Street, Utility} from '../game';

@Component({
  selector: 'app-space-info',
  templateUrl: './space-info.component.html',
  styleUrls: ['./space-info.component.scss']
})
export class SpaceInfoComponent implements OnInit {

  @Input()
  space!: Space;

  constructor() { }


  ngOnInit(): void {
  }

  isOwnable(): boolean {
    return this.space instanceof Street ||
      this.space instanceof Station ||
      this.space instanceof Utility;
  }

  isStreet(): boolean {
    return this.space instanceof Street;
  }

  isUtility(): boolean {
    return this.space instanceof Utility;
  }

  isStation(): boolean {
    return this.space instanceof Station;
  }

  getOwnerName(space: Space): string{
    const ownable = space as Ownable;
    return ownable.getOwner()?.name || '';
  }

  getAssetValue(space: Space): number {
    const ownable = space as Ownable;
    return ownable.getAssetValue()!;
  }

  getInitialPrice(space: Space): number {
    const ownable = space as Ownable;
    return ownable.getInitialPrice()!;
  }
}
