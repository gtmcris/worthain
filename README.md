<div align="center">
  <img src="public/logo.png" alt="WortHain Logo" width="120" />
  <h1>WortHain</h1>
  <p>A modern vocabulary builder and language learning application.</p>
</div>

## 📖 Overview

**WortHain** (from German "Wort" meaning word) is a comprehensive language learning and vocabulary building application. Designed with a mobile-first approach, it allows users to discover new words, practice via flashcards, and track their learning progress seamlessly.

## ✨ Features

- **User Authentication:** Secure signup and login using Firebase Authentication.
- **Word Search & Details:** Find new vocabulary and explore detailed word definitions.
- **Flashcard Practice:** Interactive flashcards to reinforce learning and memory retention.
- **Progress Tracking:** Visualize your learning journey with detailed statistics.
- **Modern UI/UX:** A responsive, dark-mode compatible interface built with Tailwind CSS.

## 🚀 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, React Router
- **Backend & Auth:** Firebase (Authentication, Firestore)
- **Icons & Animations:** Lucide React, Framer Motion
- **Deployment:** Ready for Capacitor (Android/iOS) and web deployment.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- Firebase account for database and authentication

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/worthain.git
   cd worthain
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env` file in the root directory (you can use `.env.example` as a template) and add your Firebase and Gemini API keys:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

## 📱 Mobile Development

WortHain is configured for mobile deployment using Capacitor.

```bash
# Sync web assets to Android
npx cap sync android

# Open Android Studio
npx cap open android
```

## 📜 License

This project is licensed under the MIT License.
