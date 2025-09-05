// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

'use strict';

import Link from '../Link';
import {cleanup, render} from '@testing-library/react';
import {screen} from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

afterEach(() => cleanup());

it('renders correctly', () => {
  const {container} = render(
    <Link page="http://www.facebook.com">Facebook</Link>,
  );
  expect(container.firstChild).toMatchSnapshot();
});

it('renders as an anchor when no page is set', () => {
  const {container} = render(<Link>Facebook</Link>);
  expect(container.firstChild).toMatchSnapshot();
});

it('properly escapes quotes', () => {
  const {container} = render(<Link>{"\"Facebook\" \\'is \\ 'awesome'"}</Link>);
  expect(container.firstChild).toMatchSnapshot();
});

it('changes the class when hovered', async () => {
  const {container, rerender} = render(
    <Link page="http://www.facebook.com">Facebook</Link>,
  );
  expect(container.firstChild).toMatchSnapshot();

  // hover the link
  userEvent.hover(container.firstChild);
  expect(await screen.findByLabelText('hovered')).toMatchSnapshot();

  // unhover the link
  userEvent.unhover(container.firstChild);
  expect(await screen.findByLabelText('normal')).toMatchSnapshot();
});
