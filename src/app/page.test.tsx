import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AetherStudioPage from './page';
import { Toaster } from '@/components/ui/toaster';

// Mock the useToast hook
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

// Mock the mockApiCall since it's external and involves timers/randomness
// We will replace this with a module mock later if it moves to a separate file
let mockApiCall: jest.Mock;

describe('AetherStudioPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockToast.mockClear();
    localStorage.clear();
    // Mock the global fetch
    mockApiCall = jest.fn();
    (global as any).mockApiCall = mockApiCall;

    // Mock successful API response by default
    mockApiCall.mockResolvedValue({ imageUrl: 'https://picsum.photos/1024/1024' });

    // Mock FileReader
    Object.defineProperty(global, 'FileReader', {
      writable: true,
      value: jest.fn().mockImplementation(() => ({
        readAsDataURL: jest.fn(function(this: any) { this.onload({ target: { result: 'data:image/png;base64,test' } }); }),
        onload: jest.fn(),
      })),
    });
  });

  const renderComponent = () => {
      render(
      <>
        <Toaster />
        <AetherStudioPage />
      </>
    );
  }

  test('renders the main page with all key components', () => {
    renderComponent();
    expect(screen.getByText('Aether AI Studio')).toBeInTheDocument();
    expect(screen.getByText('Transform your images with generative AI')).toBeInTheDocument();
    expect(screen.getByText('Click or drag & drop to upload')).toBeInTheDocument();
    expect(screen.getByLabelText('Prompt')).toBeInTheDocument();
    expect(screen.getByLabelText('Style')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Image/i })).toBeInTheDocument();
    expect(screen.getByText('Live Summary')).toBeInTheDocument();
    expect(screen.getByText('Result')).toBeInTheDocument();
  });

  test('handles image upload via click', async () => {
    const user = userEvent.setup();
    renderComponent();
    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    
    const uploader = screen.getByText(/Click or drag & drop to upload/i).parentElement as HTMLElement;
    const input = uploader.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);
    
    await waitFor(() => {
        expect(screen.getByAltText('Uploaded preview')).toBeInTheDocument();
        expect(screen.queryByText('Click or drag & drop to upload')).not.toBeInTheDocument();
    });
  });

  test('shows toast for invalid file type', async () => {
    const user = userEvent.setup();
    renderComponent();
    const file = new File(['text'], 'document.txt', { type: 'text/plain' });
    
    const uploader = screen.getByText(/Click or drag & drop to upload/i).parentElement as HTMLElement;
    const input = uploader.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(input, file);
    
    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
            variant: 'destructive',
            title: 'Invalid File Type',
            description: 'Please upload a PNG or JPG image.',
        });
    });
  });
  
  test('allows user to input a prompt and select a style', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Test prompt input
    const promptTextarea = screen.getByLabelText('Prompt');
    await user.type(promptTextarea, 'A cat wearing a hat');
    expect(promptTextarea).toHaveValue('A cat wearing a hat');
    
    // Test style selection
    const styleSelect = screen.getByRole('combobox', { name: /Style/i });
    await user.click(styleSelect);
    const option = await screen.findByText('Cyberpunk');
    await user.click(option);
    expect(screen.getByText('Cyberpunk')).toBeInTheDocument();
  });

  test('shows error toast if generating without an image', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await user.click(screen.getByRole('button', { name: /Generate Image/i }));
    
    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
            variant: 'destructive',
            title: 'Please upload an image first.',
        });
    });
  });
  
  test('shows error toast if generating without a prompt', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Upload an image first
    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    const uploader = screen.getByText(/Click or drag & drop to upload/i).parentElement as HTMLElement;
    const input = uploader.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    
    await user.click(screen.getByRole('button', { name: /Generate Image/i }));
    
    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
            variant: 'destructive',
            title: 'Please enter a prompt.',
        });
    });
  });

  test('successfully generates an image and updates history', async () => {
    // This is a complex test that simulates the full user flow
    const user = userEvent.setup();
    renderComponent();

    // 1. Upload image
    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    const uploader = screen.getByText(/Click or drag & drop to upload/i).parentElement as HTMLElement;
    const input = uploader.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);

    // 2. Enter prompt
    const promptTextarea = screen.getByLabelText('Prompt');
    await user.type(promptTextarea, 'A test prompt');

    // 3. Click generate
    const generateButton = screen.getByRole('button', { name: /Generate Image/i });
    await user.click(generateButton);

    // 4. Check loading state
    expect(screen.getByRole('button', { name: /Generating.../i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();

    // The mockApiCall is defined in jest.setup.ts to be globally available in the test environment for this component
    // We need to advance timers if we were using jest.useFakeTimers()
    await act(async () => {
        // Since mockApiCall is async and resolves immediately in our mock, we just need to await the next tick
        await new Promise(resolve => setImmediate(resolve));
    });

    // 5. Check for success state
    await waitFor(() => {
      expect(screen.getByAltText('Generated result')).toBeInTheDocument();
      expect(screen.getByAltText('Generated result')).toHaveAttribute('src', expect.stringContaining('https://picsum.photos/1024/1024'));
    }, { timeout: 4000 });
    
    expect(mockToast).toHaveBeenCalledWith({ title: '✨ Generation successful!', description: 'Your new image is ready.' });
    expect(screen.queryByRole('button', { name: /Generating.../i })).not.toBeInTheDocument();

    // 6. Check history panel
    expect(screen.getByText('A test prompt')).toBeInTheDocument();
  });

   test('handles API failure and shows error toast', async () => {
    // Override default mock to simulate failure
    mockApiCall.mockRejectedValue(new Error('Model overloaded'));
    
    const user = userEvent.setup();
    renderComponent();

    // Setup for generation
    const file = new File(['(⌐□_□)'], 'chucknorris.png', { type: 'image/png' });
    const uploader = screen.getByText(/Click or drag & drop to upload/i).parentElement as HTMLElement;
    const input = uploader.parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(input, file);
    await user.type(screen.getByLabelText('Prompt'), 'A failing prompt');

    // Generate
    await user.click(screen.getByRole('button', { name: /Generate Image/i }));

    // Wait for the final error toast after retries
    await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
            variant: 'destructive',
            title: 'Generation Failed',
        }));
    }, { timeout: 10000 }); // Increase timeout to account for retries

    expect(screen.getByRole('button', { name: /Generate Image/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Generating.../i })).not.toBeInTheDocument();
  });

});
