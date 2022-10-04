import {TestBed} from '@angular/core/testing';
import {beforeEach, describe, expect, it} from '@jest/globals';
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
