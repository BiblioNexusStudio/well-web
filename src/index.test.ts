import { render, screen } from '@testing-library/svelte';
import page from './routes/+page.svelte';

class XhrMockClass {
    open() {}
    send() {}
    setRequestHeader() {}
}

const IndexedDbFake = {
    open() {
        return {};
    }
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
    (global as object).AudioContext = MockTesting;
    (global as object).XMLHttpRequest = XhrMockClass;
    (global as object).indexedDB = IndexedDbFake;
});

test('renders learn react link', async () => {
    render(page);
    const linkElement = await screen.findByText(/is offline ready/i);
    expect(linkElement).toBeInTheDocument();
});
