import {TestBed} from '@angular/core/testing';

import {SubService} from './sub.service';

describe('Service: SubService', () => {
  let service: SubService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SubService],
    });
    service = TestBed.get(SubService);
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });
});
