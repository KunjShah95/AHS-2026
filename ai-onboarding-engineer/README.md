# 🚀 AI Onboarding Engineer

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.5-purple.svg)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12.7.0-orange.svg)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.18-38B2AC.svg)](https://tailwindcss.com/)

> **Transform any GitHub repository into an interactive learning experience powered by AI.**

AI Onboarding Engineer is an autonomous AI system that reads GitHub repositories, understands their architecture, generates personalized learning roadmaps, creates visual diagrams, and acts as your personal tutor for any codebase.

---

## 📋 Table of Contents

- [Features](#-features)
- [Demo](#-demo)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [Features Breakdown](#-features-breakdown)
- [Firebase Setup](#-firebase-setup)
- [Authentication](#-authentication)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

---

## ✨ Features

### 🎯 Core Features

- **🔍 Repository Analysis** - Automatically analyze any GitHub repository
- **🗺️ Learning Roadmap** - Generate personalized learning paths based on your skill level
- **🏗️ Architecture Explorer** - Interactive visualization of codebase architecture
- **📚 Task-Based Learning** - Hands-on tasks to master the codebase
- **🤖 AI Tutor Widget** - Get instant answers about the codebase
- **📊 Progress Dashboard** - Track your learning progress

### 🔐 Authentication

- **Email/Password Authentication** - Traditional sign-up and login
- **Google OAuth** - Sign in with Google
- **GitHub OAuth** - Sign in with GitHub
- **Protected Routes** - Secure access to dashboard and learning features

### 🎨 UI/UX

- **Modern Design** - Beautiful, responsive interface built with Tailwind CSS
- **Dark Mode** - Easy on the eyes for long coding sessions
- **Smooth Animations** - Framer Motion powered interactions
- **Mobile Responsive** - Works seamlessly across all devices

---

## 🎬 Demo

### Landing Page

The landing page features a clean, modern design with:

- Hero section with animated background
- Feature highlights
- Call-to-action buttons
- Responsive navigation

### Dashboard

Once logged in, users can:

- View learning statistics
- Access recent repositories
- Track progress
- Quick access to learning modules

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.0 | UI Framework |
| **TypeScript** | 5.9.3 | Type Safety |
| **Vite** | 7.2.5 | Build Tool |
| **React Router** | 7.12.0 | Routing |
| **Tailwind CSS** | 4.1.18 | Styling |
| **Framer Motion** | 11.0.0 | Animations |
| **Lucide React** | 0.562.0 | Icons |

### Backend & Services

| Technology | Purpose |
|------------|---------|
| **Firebase Auth** | Authentication |
| **Firebase Firestore** | Database |
| **Firebase Storage** | File Storage |

### Development Tools

| Tool | Purpose |
|------|---------|
| **ESLint** | Code Linting |
| **TypeScript ESLint** | TypeScript Linting |
| **PostCSS** | CSS Processing |
| **Autoprefixer** | CSS Vendor Prefixing |

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **yarn** (v1.22.0 or higher)
- **Git**
- A **Firebase** account (for authentication and database)
- A **Google Cloud** account (for OAuth)
- A **GitHub** account (for OAuth)

---

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/KunjShah95/AHS-2026.git
cd AHS-2026/ai-onboarding-engineer
```

### 2. Install Dependencies

```bash
npm install
```

Or using yarn:

```bash
yarn install
```

---

## 🔧 Environment Setup

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.example .env
```

### 2. Configure Firebase

You'll need to set up a Firebase project and add the configuration to your `.env` file:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

> **⚠️ Important:** Never commit your `.env` file to version control. It's already included in `.gitignore`.

---

## 🚀 Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will open at `http://localhost:5173`

### Build for Production

Create a production build:

```bash
npm run build
```

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

### Linting

Run ESLint to check for code quality issues:

```bash
npm run lint
```

---

## 📁 Project Structure

```
ai-onboarding-engineer/
├── public/                    # Static assets
├── src/
│   ├── assets/               # Images, fonts, etc.
│   ├── components/           # React components
│   │   ├── layout/          # Layout components
│   │   │   ├── Layout.tsx   # Main layout wrapper
│   │   │   ├── Navbar.tsx   # Navigation bar
│   │   │   └── Footer.tsx   # Footer
│   │   ├── ui/              # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Badge.tsx
│   │   └── TutorWidget.tsx  # AI Tutor widget
│   ├── context/             # React Context
│   │   └── AuthContext.tsx  # Authentication context
│   ├── hooks/               # Custom React hooks
│   │   └── useAuth.ts       # Authentication hook
│   ├── lib/                 # Utilities and configurations
│   │   ├── firebase.ts      # Firebase configuration
│   │   ├── firebaseAuth.ts  # Firebase auth helpers
│   │   └── utils.ts         # Utility functions
│   ├── pages/               # Page components
│   │   ├── Landing.tsx      # Landing page
│   │   ├── Login.tsx        # Login page
│   │   ├── Register.tsx     # Registration page
│   │   ├── Dashboard.tsx    # User dashboard
│   │   ├── RepoAnalysis.tsx # Repository analysis
│   │   ├── Roadmap.tsx      # Learning roadmap
│   │   ├── Architecture.tsx # Architecture explorer
│   │   └── Tasks.tsx        # Task-based learning
│   ├── App.tsx              # Main App component
│   ├── main.tsx             # Application entry point
│   ├── index.css            # Global styles
│   └── App.css              # App-specific styles
├── .env.example             # Environment variables template
├── .gitignore               # Git ignore rules
├── eslint.config.js         # ESLint configuration
├── index.html               # HTML template
├── package.json             # Dependencies and scripts
├── postcss.config.js        # PostCSS configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── tsconfig.app.json        # App TypeScript configuration
├── tsconfig.node.json       # Node TypeScript configuration
└── vite.config.ts           # Vite configuration
```

---

## 🎯 Features Breakdown

### 1. **Landing Page** (`/`)

- Hero section with animated background
- Feature showcase
- Call-to-action buttons
- Footer with links

### 2. **Authentication** (`/login`, `/register`)

- Email/Password authentication
- Google OAuth integration
- GitHub OAuth integration
- Form validation
- Error handling
- Redirect to dashboard after login

### 3. **Dashboard** (`/dashboard`)

- Protected route (requires authentication)
- User statistics
- Recent repositories
- Quick access to features
- Progress tracking

### 4. **Repository Analysis** (`/analysis`)

- GitHub repository URL input
- Automatic code analysis
- Repository statistics
- Technology detection

### 5. **Learning Roadmap** (`/roadmap`)

- Personalized learning path
- Skill-based modules
- Progress tracking
- Estimated time to complete

### 6. **Architecture Explorer** (`/architecture`)

- Interactive architecture diagrams
- Module relationships
- Code flow visualization
- Dependency graphs

### 7. **Task-Based Learning** (`/tasks`)

- Hands-on coding tasks
- Difficulty levels (Beginner, Intermediate, Advanced)
- Code challenges
- Progress tracking

### 8. **AI Tutor Widget**

- Always accessible
- Context-aware responses
- Code explanations
- Best practices suggestions

---

## 🔥 Firebase Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "ai-onboarding-engineer")
4. Enable Google Analytics (optional)
5. Create project

### Step 2: Register Your Web App

1. In Firebase Console, click the web icon (`</>`)
2. Register app with a nickname
3. Copy the Firebase configuration
4. Add configuration to `.env` file

### Step 3: Enable Authentication

1. Go to **Authentication** → **Sign-in method**
2. Enable the following providers:
   - **Email/Password**
   - **Google**
   - **GitHub**

### Step 4: Configure OAuth Providers

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized domains:
   - `localhost` (for development)
   - Your production domain
4. Copy Client ID and secret to Firebase

#### GitHub OAuth

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL:
   - `https://<your-project-id>.firebaseapp.com/__/auth/handler`
4. Copy Client ID and secret to Firebase

> 📚 **Detailed Setup Guide:** For comprehensive step-by-step instructions, troubleshooting, and best practices, see [GITHUB_OAUTH_SETUP.md](./GITHUB_OAUTH_SETUP.md)

### Step 5: Set Up Firestore Database

1. Go to **Firestore Database**
2. Create database
3. Start in **test mode** (for development)
4. Choose a location

### Step 6: Configure Authorized Domains

1. Go to **Authentication** → **Settings** → **Authorized domains**
2. Add your domains:
   - `localhost` (for development)
   - Your production domain (e.g., `your-app.web.app`)

---

## 🔐 Authentication

The application uses Firebase Authentication with multiple sign-in methods:

### Email/Password

```typescript
// Register
const { user } = await createUserWithEmailAndPassword(auth, email, password);

// Login
const { user } = await signInWithEmailAndPassword(auth, email, password);
```

### Google OAuth

```typescript
const provider = new GoogleAuthProvider();
const { user } = await signInWithPopup(auth, provider);
```

### GitHub OAuth

```typescript
const provider = new GithubAuthProvider();
const { user } = await signInWithPopup(auth, provider);
```

### Sign Out

```typescript
await signOut(auth);
```

### Auth Context

The app uses React Context to manage authentication state:

```typescript
import { useAuth } from './hooks/useAuth';

function MyComponent() {
  const { user, loading, error } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Login />;
  
  return <Dashboard user={user} />;
}
```

---

## 🌐 Deployment

### Deploy to Firebase Hosting

1. **Install Firebase CLI:**

   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**

   ```bash
   firebase login
   ```

3. **Initialize Firebase:**

   ```bash
   firebase init
   ```

   - Select **Hosting**
   - Choose your Firebase project
   - Set public directory to `dist`
   - Configure as single-page app: **Yes**
   - Don't overwrite `index.html`

4. **Build the project:**

   ```bash
   npm run build
   ```

5. **Deploy:**

   ```bash
   firebase deploy
   ```

### Deploy to Vercel

1. **Install Vercel CLI:**

   ```bash
   npm install -g vercel
   ```

2. **Deploy:**

   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Link to existing project or create new
   - Set environment variables in Vercel dashboard

### Deploy to Netlify

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Deploy using Netlify CLI:**

   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=dist
   ```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### 1. Fork the Repository

### 2. Create a Feature Branch

```bash
git checkout -b feature/amazing-feature
```

### 3. Commit Your Changes

```bash
git commit -m 'Add some amazing feature'
```

### 4. Push to the Branch

```bash
git push origin feature/amazing-feature
```

### 5. Open a Pull Request

### Code Style Guidelines

- Use TypeScript for type safety
- Follow ESLint rules
- Write meaningful commit messages
- Add comments for complex logic
- Keep components small and focused

---

## 🐛 Troubleshooting

### Common Issues

#### 1. **Firebase Auth Domain Error**

```bash
Error: auth/unauthorized-domain
```

**Solution:** Add your domain to Firebase Console → Authentication → Settings → Authorized domains

#### 2. **Environment Variables Not Loading**

**Solution:** Ensure `.env` file exists and all variables start with `VITE_`

#### 3. **Build Errors**

```bash
TS6133: 'React' is declared but its value is never read
```

**Solution:** Remove unused imports

#### 4. **OAuth Redirect Issues**

**Solution:** Check that callback URLs match in both Firebase and OAuth provider settings

#### 5. **Port Already in Use**

```BASH
Error: Port 5173 is already in use
```

**Solution:**

```bash
# Kill the process using the port
npx kill-port 5173

# Or use a different port
npm run dev -- --port 3000
```

### Getting Help

- 📧 Email: <support@ai-onboarding.com>
- 💬 Discord: [Join our community](https://discord.gg/your-invite)
- 🐛 Issues: [GitHub Issues](https://github.com/KunjShah95/AHS-2026/issues)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [React](https://reactjs.org/) - UI Framework
- [Firebase](https://firebase.google.com/) - Backend Services
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- [Lucide](https://lucide.dev/) - Icons
- [Vite](https://vitejs.dev/) - Build Tool

---

## 📊 Project Status

- ✅ Landing Page
- ✅ Authentication (Email, Google, GitHub)
- ✅ Dashboard
- ✅ Repository Analysis
- ✅ Learning Roadmap
- ✅ Architecture Explorer
- ✅ Task-Based Learning
- ✅ AI Tutor Widget
- 🚧 Backend API Integration (In Progress)
- 🚧 AI Model Integration (Planned)
- 🚧 Real-time Code Analysis (Planned)

---

## 🗺️ Roadmap

### Phase 1: MVP (Completed ✅)

- [x] Frontend UI/UX
- [x] Firebase Authentication
- [x] Basic routing
- [x] Component architecture

### Phase 2: Core Features (In Progress 🚧)

- [ ] GitHub API integration
- [ ] Repository analysis engine
- [ ] AI-powered roadmap generation
- [ ] Interactive architecture diagrams

### Phase 3: Advanced Features (Planned 📋)

- [ ] Real-time collaboration
- [ ] Code playground
- [ ] Video tutorials integration
- [ ] Community features
- [ ] Progress persistence
- [ ] Gamification

### Phase 4: Enterprise (Future 🔮)

- [ ] Team accounts
- [ ] Custom learning paths
- [ ] Analytics dashboard
- [ ] API access

---

## 💡 Tips for Development

### Hot Module Replacement (HMR)

Vite provides instant HMR for a smooth development experience. Changes are reflected immediately without losing state.

### TypeScript Tips

- Use strict mode for better type safety
- Define interfaces for all component props
- Use enums for constants

### Performance Optimization

- Lazy load routes with `React.lazy()`
- Use `useMemo` and `useCallback` for expensive computations
- Optimize images with proper formats and sizes
- Code splitting for faster initial load

### Debugging

- Use React DevTools for component inspection
- Use Redux DevTools if you add state management
- Check Firebase Console for authentication issues
- Use browser Network tab for API debugging

---

## 📞 Contact

**Kunj Shah** - [@KunjShah95](https://github.com/KunjShah95)

**Project Link:** [https://github.com/KunjShah95/AHS-2026](https://github.com/KunjShah95/AHS-2026)

---

<div align="center">

**Made with ❤️ by the AI Onboarding Engineer Team**

⭐ Star us on GitHub — it helps!

[Website](https://ai-onboarding.web.app) • [Documentation](https://docs.ai-onboarding.web.app) • [Twitter](https://twitter.com/ai_onboarding)

</div>
