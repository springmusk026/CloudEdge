import { useEffect, useRef, useState } from 'react';

// Cloudflare Turnstile invisible/managed widget
// Ref: https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/

const SITE_KEY = '0x4AAAAAAAA'; // Replace with your actual Turnstile site key

interface Props {
  onToken: (token: string) => void;
}

export function Turnstile({ onToken }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Load Turnstile script if not already loaded
    if (!document.getElementById('cf-turnstile-script')) {
      const script = document.createElement('script');
      script.id = 'cf-turnstile-script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback';
      script.async = true;
      document.head.appendChild(script);
    }

    // Render widget once script is loaded
    const interval = setInterval(() => {
      if ((window as any).turnstile && ref.current && !loaded) {
        (window as any).turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          callback: (token: string) => onToken(token),
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
        });
        setLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [onToken, loaded]);

  return <div ref={ref} className="mt-2" />;
}
