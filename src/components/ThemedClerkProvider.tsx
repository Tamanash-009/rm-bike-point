import React from 'react';
import { ClerkProvider } from '@clerk/clerk-react';
import { dark } from '@clerk/themes';
import { useTheme } from '../contexts/ThemeContext';

interface ThemedClerkProviderProps {
  children: React.ReactNode;
  publishableKey: string;
}

export default function ThemedClerkProvider({ children, publishableKey }: ThemedClerkProviderProps) {
  const { theme } = useTheme();

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      afterSignOutUrl="/"
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: '#FF5C00', // Brand Orange
          colorTextOnPrimaryBackground: '#ffffff',
          colorBackground: theme === 'dark' ? '#1A1A1A' : '#ffffff',
          colorInputBackground: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          colorInputText: theme === 'dark' ? '#ffffff' : '#000000',
          borderRadius: '1rem', // Match our rounded-2xl
          fontFamily: '"Space Grotesk", "Inter", sans-serif',
        },
        elements: {
          cardBox: "shadow-2xl border border-text-primary/10",
          card: "bg-card-bg backdrop-blur-xl",
          headerTitle: "font-black uppercase tracking-tighter text-2xl text-text-primary",
          headerSubtitle: "text-[10px] font-black uppercase tracking-[0.2em] text-text-secondary italic mt-2",
          socialButtonsBlockButton: "border border-text-primary/10 hover:bg-brand-orange/10 hover:border-brand-orange/20 transition-all text-text-primary",
          socialButtonsBlockButtonText: "font-bold",
          formButtonPrimary: "bg-brand-orange hover:bg-[#E65300] text-white font-black uppercase tracking-widest transition-all",
          formFieldInput: "border border-text-primary/10 focus:border-brand-orange/50 transition-all text-text-primary bg-transparent",
          formFieldLabel: "text-text-primary font-bold text-sm",
          footerActionLink: "text-brand-orange hover:text-[#E65300] font-black",
          dividerLine: "bg-text-primary/10",
          dividerText: "text-text-secondary text-[10px] uppercase font-black tracking-widest",
          identityPreviewText: "text-text-primary",
          formFieldSuccessText: "text-green-500",
          formFieldErrorText: "text-red-500 font-bold",
          userButtonPopoverCard: "bg-card-bg border border-text-primary/10 shadow-2xl",
          userButtonPopoverActionButton: "hover:bg-white/5 text-text-primary",
          userButtonPopoverActionButtonText: "font-bold",
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
