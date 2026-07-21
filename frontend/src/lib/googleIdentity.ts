type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleWindow = Window & {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: GoogleCredentialResponse) => void;
          auto_select?: boolean;
          cancel_on_tap_outside?: boolean;
          use_fedcm_for_prompt?: boolean;
        }) => void;
        prompt: (listener?: (notification: {
          isNotDisplayed: () => boolean;
          isSkippedMoment: () => boolean;
          getNotDisplayedReason: () => string;
          getSkippedReason: () => string;
        }) => void) => void;
      };
    };
  };
};

let loadPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-google-gsi="true"]');
    if (existing) {
      if ((window as GoogleWindow).google) resolve();
      else existing.addEventListener('load', () => resolve(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.dataset.googleGsi = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity script.'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function getGoogleCredential(clientId: string): Promise<string> {
  if (!clientId) {
    throw new Error('Google Client ID is missing in frontend environment variables.');
  }

  await loadGoogleScript();

  const g = (window as GoogleWindow).google;
  if (!g) {
    throw new Error('Google Identity is not available.');
  }

  return new Promise((resolve, reject) => {
    let settled = false;

    g.accounts.id.initialize({
      client_id: clientId,
      callback: (response: GoogleCredentialResponse) => {
        if (settled) return;
        settled = true;
        if (response.credential) {
          resolve(response.credential);
        } else {
          reject(new Error('No Google credential received.'));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
    });

    g.accounts.id.prompt((notification) => {
      if (settled) return;
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        settled = true;
        const reason = notification.isNotDisplayed()
          ? notification.getNotDisplayedReason()
          : notification.getSkippedReason();
        reject(new Error(`Google sign-in unavailable (${reason}).`));
      }
    });

    window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('Google sign-in timed out. Please try again.'));
      }
    }, 12000);
  });
}
