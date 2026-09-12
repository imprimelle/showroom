import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ConsentLevel = 'essential' | 'analytics' | 'marketing';

interface ConsentStore {
  hasInteracted: boolean;
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  setConsent: (levels: Record<ConsentLevel, boolean>) => void;
  acceptAll: () => void;
  rejectAll: () => void;
  hasLevel: (level: ConsentLevel) => boolean;
}

export const useConsentStore = create<ConsentStore>()(
  persist(
    (set, get) => ({
      hasInteracted: false,
      essential: true,
      analytics: false,
      marketing: false,

      setConsent: (levels) =>
        set({ ...levels, hasInteracted: true }),

      acceptAll: () =>
        set({ essential: true, analytics: true, marketing: true, hasInteracted: true }),

      rejectAll: () =>
        set({ essential: true, analytics: false, marketing: false, hasInteracted: true }),

      hasLevel: (level) => get()[level],
    }),
    {
      name: 'showroom-consent',
    }
  )
);
