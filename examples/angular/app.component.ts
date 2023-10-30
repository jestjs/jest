import {Component} from '@angular/core';
import {DataService} from './shared/data.service';

@Component({
  selector: 'app-root',
  template: '<h1>Welcome to {{ title }}!</h1>',
})
export class AppComponent {
  public title: string;

  constructor(dataService: DataService) {
    this.title = dataService.getTitle();
  }
}
