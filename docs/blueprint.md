# **App Name**: Aether AI Studio

## Core Features:

- Image Upload and Preview: Allows users to upload a PNG or JPG image (≤10MB) and displays a preview of the uploaded image. Client-side downscaling ensures the image is ≤1920px.
- Prompt and Style Input: Provides an input field for users to enter a text prompt and a dropdown menu with style options (e.g., Editorial, Streetwear, Vintage).
- Live Summary: Displays a live summary of the current image, prompt, and style selections to allow the user to view all aspects before generating a new image.
- Mocked API Generation: Simulates an image generation process via a mocked API endpoint. Accepts the image data URL, prompt, and style as a POST request. Returns a response after a simulated delay.
- Error Handling with Retry: Implements error handling for the mocked API, including automatic retries with exponential backoff (max 3 attempts) upon encountering simulated errors (e.g., 'Model overloaded').
- Request Abort: Allows users to abort an in-flight generation request, cancelling it immediately.  Display loading spinner while requests are in progress.
- History Management: Saves the last 5 generations in localStorage, including image URL, prompt, style, and timestamp. Allows users to restore a previous generation by clicking on a history item.

## Style Guidelines:

- Primary color: Soft lavender (#E6E6FA) to evoke a sense of calmness and creativity.
- Background color: Light gray (#F5F5F5), offering a neutral backdrop to make elements stand out.
- Accent color: Muted rose (#D3A6B4) for interactive elements, providing a gentle contrast.
- Body and headline font: 'Inter', a sans-serif font, for a modern and neutral feel. It can be used for both headlines and body text, lending a cohesive look to the app's UI.
- Simple, outlined icons for a clean and modern look.
- Clean and modern layout with clear sections for image input, prompt, style selection, and results.
- Subtle, smooth transitions and animations to provide feedback and enhance user experience.