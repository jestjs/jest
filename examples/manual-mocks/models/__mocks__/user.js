// Copyright 2004-present Facebook. All Rights Reserved.

const user = jest.createMockFromModule('../user');

user.getAuthenticated = () => ({
  age: 622,
  name: 'Mock name',
});

export default user;
