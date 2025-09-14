# Eikona

A modern, powerful, and user-friendly AI image generation and editing platform. Built with React, Vite, and Google's Gemini API, Eikona transforms your text descriptions into stunning, high-quality images and provides advanced tools to edit them with precision.

## ◆ Core Features

- **Text-to-Image Generation**: Convert text descriptions into high-resolution images using Google's Gemini AI.
- **Advanced Image Editor**: A full-featured, layer-based editor to manually or automatically edit images. Add text, remove objects with a clone stamp, or use AI to edit specific regions.
- **Secure Authentication**: Simple and secure sign-in with Google OAuth.
- **Sleek UI/UX**: A beautiful, retro-inspired design with smooth animations and an intuitive user experience.
- **Fully Responsive**: Works seamlessly on desktop, tablet, and mobile devices.
- **Blazing Fast**: Built with Vite for a lightning-fast development workflow and optimized production builds.

## → Getting Started

### Prerequisites

- Node.js v18+
- `npm` or `yarn`
- A Google Cloud project with OAuth credentials enabled.
- A Google Gemini API key.

### Installation & Setup

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/AashishThakuri/Image-Editor.git
    cd Image-Editor
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Set Up Environment Variables**
    Create a `.env` file by copying the example:
    ```bash
    cp .env.example .env
    ```
    
    Open the `.env` file and add your credentials. You can get these from the Google Cloud Console and Google AI Studio.
    ```env
    VITE_GOOGLE_CLIENT_ID=your-google-client-id-here
    VITE_GEMINI_API_KEY=your-gemini-api-key-here
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```

5.  **Open in Browser**
    Navigate to `http://localhost:3000` to see the app in action.

## → Project Structure

```
src/
├── components/       # Reusable UI components (Buttons, Modals, Layouts)
├── contexts/         # React Context for global state (e.g., AuthContext)
├── lib/              # API clients and helper functions (Firebase, Gemini)
├── pages/            # Top-level page components (Landing, ImageGenerator)
├── App.jsx           # Main app component with routing
├── main.jsx          # Application entry point
└── index.css         # Global styles & TailwindCSS imports
```

## → Configuration

### Google Gemini API

1.  Visit [Google AI Studio](https://aistudio.google.com/) to get your API key.
2.  Ensure the Generative Language API is enabled in your Google Cloud project.
3.  Add the API key to your `.env` file as `VITE_GEMINI_API_KEY`.

## → Features Overview

### Landing Page
- A beautifully animated hero section.
- Detailed feature showcase and user testimonials.
- Seamless Google sign-in integration.

### Dashboard & Image Generator
- A central hub for creating and managing your images.
- An intuitive prompt bar with suggestions and reference image uploads.
- A gallery to view, download, or edit your generated images.

### Image Editor
- A powerful, layer-based editor for non-destructive changes.
- **Manual Tools**: Brush, Eraser, Text, Eyedropper, and a Clone Stamp for seamless object removal.
- **AI-Powered Editing**: Select regions of an image and use a text prompt to add, remove, or modify objects within that area.

## → Deployment

This project is optimized for deployment on platforms like Vercel or Netlify.

### Build for Production

```bash
npm run build
```
This command creates a `dist/` folder with your optimized production assets.

### Deploying with Vercel

1.  Install the Vercel CLI: `npm i -g vercel`
2.  Run `vercel` in the project root and follow the prompts to link and deploy the project.
3.  Add your environment variables from `.env` to the Vercel project settings.

## → Future Roadmap

- **Advanced Brush Tools**: More sophisticated brushes for detailed artistic work.
- **Font & Text Styling**: Add options for fonts, outlines, and shadows in the text tool.
- **Image Upscaling**: Integrate an AI model to increase the resolution of generated images.
- **Community Gallery**: A space for users to share their creations.

## → Acknowledgments

- **Google** for the powerful Gemini AI technology.
- The **React** and **Vite** teams for their incredible open-source tools.
- **Tailwind CSS**, **Framer Motion**, and **Lucide React** for making the UI beautiful and functional.
