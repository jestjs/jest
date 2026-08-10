import {Component, inject} from '@angular/core';
import {DataService} from './shared/data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  template: '<h1>Welcome to {{ title }}!</h1>',
})
export class AppComponent {
  private dataService = inject(DataService);
  public title = this.dataService.getTitle();
}
