// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * Sample React Native Snapshot Test
 */

import {render, screen} from '@testing-library/react-native';
import React from 'react';
import {ActivityIndicator, FlatList, Text, TextInput} from 'react-native';
import Intro from '../Intro';

jest.setTimeout(15_000);

it('renders correctly', async () => {
  await render(<Intro />);
  expect(screen.toJSON()).toMatchSnapshot();
});

// These serve as integration tests for the jest-react-native preset.
it('renders the ActivityIndicator component', async () => {
  await render(<ActivityIndicator animating={true} size="small" />);
  expect(screen.toJSON()).toMatchSnapshot();
});

it('renders the TextInput component', async () => {
  await render(<TextInput autoCorrect={false} value="apple banana kiwi" />);
  expect(screen.toJSON()).toMatchSnapshot();
});

it('renders the FlatList component', async () => {
  await render(
    <FlatList
      data={['apple', 'banana', 'kiwi']}
      keyExtractor={item => item}
      renderItem={({item}) => <Text>{item}</Text>}
    />,
  );
  expect(screen.toJSON()).toMatchSnapshot();
});
