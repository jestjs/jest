/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
it('Satisfying Mock argument routing', () => {
  const charge = jest.fn();

  // Threshold split that objectContaining can't express:
  charge
    .whenCalledWith(expect.satisfying(req => req.amount > 1000))
    .mockReturnValue({status: 'needs-approval'});
  charge
    .whenCalledWith(expect.satisfying(req => req.amount <= 1000))
    .mockReturnValue({status: 'auto-approved'});

  // Cross-field invariant:
  charge
    .whenCalledWith(expect.satisfying(req => req.start < req.end))
    .mockReturnValue({status: 'ok'});
});
