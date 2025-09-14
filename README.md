# Veo AI Platform

A beautiful, user-friendly text-to-video AI platform built with React, Vite, and Google's Veo API. Transform your text descriptions into stunning videos with the power of artificial intelligence.

## ✨ Features

- **🎬 Text-to-Video Generation**: Convert text descriptions into high-quality videos using Google's Veo AI
- **🔐 Google OAuth Authentication**: Secure sign-in with Google accounts
- **💳 Subscription Management**: Flexible SaaS pricing with Free, Pro, and Premium plans
- **🎨 Beautiful UI/UX**: Modern design with smooth animations and transitions
- **📱 Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **⚡ Fast Performance**: Built with Vite for lightning-fast development and production builds

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Google OAuth credentials
- Google Veo API access (when available)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd veo-ai-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your credentials:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   VITE_VEO_API_KEY=your_veo_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── GoogleSignInButton.jsx
│   ├── LoadingSpinner.jsx
│   └── ProtectedRoute.jsx
├── contexts/           # React contexts
│   └── AuthContext.jsx
├── pages/              # Main application pages
│   ├── LandingPage.jsx
│   ├── Dashboard.jsx
│   ├── VideoGenerator.jsx
│   └── Profile.jsx
├── App.jsx            # Main app component
├── main.jsx           # Application entry point
└── index.css          # Global styles
```

## 🎨 Design System

The application uses a warm, inviting color palette inspired by modern design trends:

- **Primary Colors**: Orange gradient (#f59532 to #e45c00)
- **Secondary Colors**: Pink gradient (#ec4899 to #db2777)
- **Accent Colors**: Green gradient (#22c55e to #16a34a)
- **Warm Colors**: Yellow gradient (#fbbf24 to #d97706)

## 🔧 Configuration

### Google OAuth Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add your domain to authorized origins
6. Copy the client ID to your `.env` file

### Google Veo API Setup

1. Request access to Google's Veo API (currently in limited preview)
2. Obtain your API key
3. Add the API key to your `.env` file

## 📱 Features Overview

### Landing Page
- Hero section with animated elements
- Feature showcase
- User testimonials
- Pricing information
- Google sign-in integration

### Dashboard
- User statistics and plan information
- Quick action buttons
- Recent video gallery
- Usage tracking

### Video Generator
- Text prompt input with suggestions
- Video customization options (duration, style, aspect ratio)
- Real-time generation progress
- Video preview and download

### Profile Management
- User information display
- Subscription plan management
- Billing history
- Account settings

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Netlify/Vercel

The application is ready for deployment to modern hosting platforms:

1. **Netlify**: Connect your repository and deploy automatically
2. **Vercel**: Import your project and deploy with zero configuration
3. **Traditional hosting**: Upload the `dist` folder contents

## 🔮 Future Enhancements

- **Video Templates**: Pre-designed video templates for common use cases
- **Advanced Editing**: Timeline-based video editing capabilities
- **Team Collaboration**: Multi-user workspaces and sharing
- **API Integration**: RESTful API for third-party integrations
- **Analytics Dashboard**: Detailed usage and performance metrics
- **Mobile App**: Native iOS and Android applications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google for the Veo AI technology
- React team for the amazing framework
- Tailwind CSS for the utility-first styling
- Framer Motion for smooth animations
- Lucide React for beautiful icons

---

**Built with ❤️ using React, Vite, and modern web technologies**
