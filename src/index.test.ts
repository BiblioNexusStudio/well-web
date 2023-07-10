import { render, screen } from '@testing-library/svelte';
import page from './routes/+page.svelte';

test('renders learn react link', async () => {
    render(page);
    const linkElement = await screen.findByText(/is offline ready/i);
    expect(linkElement).toBeInTheDocument();
});
