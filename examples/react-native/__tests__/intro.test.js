// Copyright (c) Meta Platforms, Inc. and affiliates.

/**
 * Sample React Native Snapshot Test
 */

import React from 'react';
import {ActivityIndicator, FlatList, Text, TextInput} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import Intro from '../Intro';

jest.setTimeout(15_000);

it('renders correctly', () => {
  let tree;
  act(() => {
    tree = renderer.create(<Intro />);
  });
  expect(tree.toJSON()).toMatchSnapshot();
});

// These serve as integration tests for the jest-react-native preset.
it('renders the ActivityIndicator component', () => {
  let tree;
  act(() => {
    tree = renderer.create(<ActivityIndicator animating={true} size="small" />);
  });
  expect(tree.toJSON()).toMatchSnapshot();
});

it('renders the TextInput component', () => {
  let tree;
  act(() => {
    tree = renderer.create(
      <TextInput autoCorrect={false} value="apple banana kiwi" />,
    );
  });
  expect(tree.toJSON()).toMatchSnapshot();
});

it('renders the FlatList component', () => {
  let tree;
  act(() => {
    tree = renderer.create(
      <FlatList
        data={['apple', 'banana', 'kiwi']}
        keyExtractor={item => item}
        renderItem={({item}) => <Text>{item}</Text>}
      />,
    );
  });
  expect(tree.toJSON()).toMatchSnapshot();
});
