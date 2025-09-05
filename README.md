# Aether AI Studio

Welcome to Aether AI Studio, a powerful web application for transforming your images using generative AI. This application provides an intuitive interface to upload an image, describe your desired transformation with a text prompt, select an artistic style, and generate a new, unique visual.

This project is built with Next.js, React, TypeScript, and Tailwind CSS.

## Features

-   **Image Upload**: Upload your own image (PNG or JPG) to serve as the base for the AI generation. The interface supports both file selection and drag-and-drop. Images are automatically resized for optimal performance, with a maximum size of 10MB.
-   **Descriptive Prompts**: Guide the AI by providing a detailed text prompt of the changes you want to see.
-   **Style Selection**: Choose from a curated list of artistic styles, including Editorial, Streetwear, Vintage, Cyberpunk, and Fantasy, to influence the final output.
-   **AI-Powered Generation**: With a single click, the AI model processes your image, prompt, and style selection to create a brand-new image.
-   **Live Summary**: See a real-time summary of your selected image, prompt, and style before you generate.
-   **Generation History**: The app automatically saves your last 5 generations to your browser's local storage.
-   **History Management**:
    -   **View**: See thumbnails and details of your recent creations in a collapsible side panel.
    -   **Restore**: Instantly load a previous generation's settings (image, prompt, and style) to tweak or regenerate.
    -   **Clear**: Easily clear your entire generation history.
-   **Responsive Design**: The user interface is fully responsive and works seamlessly on both desktop and mobile devices.

## Getting Started

To get started with development, you first need to install the dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result.

The main application code can be found in `src/app/page.tsx`. You can start by editing this file.