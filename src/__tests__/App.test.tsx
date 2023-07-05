import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

class XhrMockClass {
  open() {}
  send() {}
  setRequestHeader() {}
}

const IndexedDbFake = {
  open() {
    return {};
  },
};

class MockTesting {
  createGain() {
    return { connect: () => {} };
  }

  createBuffer() {
    return {};
  }
}

beforeAll(() => {
  global.AudioContext = MockTesting;
  global.XMLHttpRequest = XhrMockClass;
  global.indexedDB = IndexedDbFake;
});

test('renders learn react link', async () => {
  render(<App />);
  const linkElement = await screen.findByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
