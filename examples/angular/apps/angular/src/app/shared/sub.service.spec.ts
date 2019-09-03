/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SubService } from './sub.service';

describe('Service: SubService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SubService]
    });
  });

  it('should ...', inject([SubService], (service: SubService) => {
    expect(service).toBeTruthy();
  }));
});
