import {Injectable} from '@angular/core';

import {SubService} from './sub.service';

@Injectable()
export class DataService {
  constructor(private subService: SubService) {}

  getTitle():string {
    return this.subService.getTitle();
  }
}
