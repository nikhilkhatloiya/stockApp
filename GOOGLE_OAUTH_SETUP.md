# Google OAuth Setup Instructions

## 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Set application type to "Web application"
7. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)

## 2. Environment Variables

Create a `.env.local` file in the frontend directory with the following variables:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 3. Generate NextAuth Secret

You can generate a secure secret using:

```bash
openssl rand -base64 32
```

## 4. Features Added

### Google OAuth Authentication
- Integrated NextAuth.js with Google OAuth provider
- Updated AuthContext to work with NextAuth sessions
- Added Google sign-in button to login page

### Animated Sidebar
- Created a responsive sidebar with smooth animations
- Added toggle button with hover and tap animations
- Included dashboard functionality with navigation items:
  - Dashboard
  - Market Overview
  - Trending Stocks
  - My Portfolio
  - Watchlist
  - Transaction History
  - Analytics
  - Trading
  - Settings
  - Notifications

### Sidebar Features
- Smooth slide-in/out animations using Framer Motion
- User profile section with avatar
- Search functionality
- Responsive design (mobile overlay, desktop slide)
- Auto-hide header navigation when sidebar is open
- Animated content shifting when sidebar toggles

## 5. Usage

1. Set up your Google OAuth credentials
2. Add environment variables to `.env.local`
3. Run the development server: `npm run dev`
4. Navigate to `/login` to see the Google OAuth option
5. After login, use the toggle button (top-left) to open/close the sidebar

The sidebar will only appear for authenticated users and provides easy navigation to all dashboard features.

