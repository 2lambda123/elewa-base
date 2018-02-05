import { Component, OnInit, Inject, Input } from '@angular/core';

import { Logger } from "../../../../providers/logger/logger.service";
import { TransclusionHelper } from '../../../../providers/transclusion-helper/transclusion-helper.service';

@Component({
  selector:    'brick-navbar',
  templateUrl: './navbar.component.html',
  styleUrls:  ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  
  @Input() navbarTitle : string;

  constructor(private _logger: Logger, private _transclusionHelper: TransclusionHelper) {} 
 
  ngOnInit() {
    this._logger.debug(() => "Navbar initialized.");  
  }

  titleIsEmpty(el: HTMLElement){
    return this._transclusionHelper.trcElIsEmpty(el);
  }
}
