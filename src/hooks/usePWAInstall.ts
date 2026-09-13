import { useEffect, useState, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

// Support Web Launch Handling API (Android / PWA default file opening)
declare global {
  interface Window {
    launchQueue?: {
      setConsumer: (callback: (launchParams: { files: FileSystemFileHandle[] }) => Promise<void> | void) => void;
    };
    LaunchParams?: unknown;
  }
}

export function usePWAInstall(onFileReceived?: (file: File) => void) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in standalone / installed mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    const isAndroidDevice = /android/.test(ua);
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsAndroid(isAndroidDevice);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Register File Handling Launch Queue (Enables opening files when set as default viewer on phone)
    if ('launchQueue' in window && onFileReceived) {
      try {
        window.launchQueue?.setConsumer(async (launchParams) => {
          if (!launchParams.files || launchParams.files.length === 0) return;
          for (const handle of launchParams.files) {
            try {
              const file = await handle.getFile();
              onFileReceived(file);
            } catch (err) {
              console.warn('Failed to obtain file from Android launchQueue handle:', err);
            }
          }
        });
      } catch (err) {
        console.warn('LaunchQueue registration error:', err);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onFileReceived]);

  const install = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  }, [deferredPrompt]);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isAndroid,
    isIOS,
    install,
  };
}
