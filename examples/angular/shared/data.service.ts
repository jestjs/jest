import {Injectable, inject} from '@angular/core';
import {SubService} from './sub.service';

@Injectable({providedIn: 'root'})
export class DataService {
  private subService = inject(SubService);

  getTitle() {
    return this.subService.getTitle();
  }
}
