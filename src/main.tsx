import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import ThemedClerkProvider from './components/ThemedClerkProvider.tsx';
import App from './App.tsx';
import './index.css';

// Import your Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.error("Missing Publishable Key. Please add VITE_CLERK_PUBLISHABLE_KEY to your .env file.");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ThemedClerkProvider publishableKey={PUBLISHABLE_KEY || 'pk_test_placeholder'}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemedClerkProvider>
    </ThemeProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}
