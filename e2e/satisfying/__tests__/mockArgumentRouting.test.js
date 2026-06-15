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
