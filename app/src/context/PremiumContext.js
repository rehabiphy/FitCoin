import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { premiumApi } from '../api/premiumApi';
import { useAuth } from './AuthContext';
import { useSteps } from './StepsContext';

const PremiumContext = createContext(null);

/**
 * The premium plan (price, multiplier, benefits — all set in the admin panel)
 * and the signed-in user's premium status.
 */
export function PremiumProvider({ children }) {
  const { isSignedIn, applyUser } = useAuth();
  const { reloadWallet } = useSteps();
  const [info, setInfo] = useState(null); // { plan, status, habits, canPurchase }
  // The upgrade pop-up shows at most once per app launch
  const [popupDismissed, setPopupDismissed] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await premiumApi.get();
      setInfo(data);
      return data;
    } catch {
      return null; // keep what we had
    }
  }, []);

  useEffect(() => {
    if (isSignedIn) {
      reload();
    } else {
      setInfo(null);
      setPopupDismissed(false);
    }
  }, [isSignedIn, reload]);

  /** Throws ApiError on failure so the screen can show the message. */
  const upgrade = useCallback(async () => {
    const { user, ...data } = await premiumApi.upgrade();
    setInfo(data);
    setPopupDismissed(true);
    await applyUser(user);
    reloadWallet();
    return data;
  }, [applyUser, reloadWallet]);

  const value = useMemo(() => {
    const plan = info?.plan || null;
    const isPremium = !!info?.status?.active;
    return {
      info,
      plan,
      status: info?.status || null,
      isPremium,
      // Show the premium offer only while premium is switched on in the admin panel
      available: !!plan?.enabled,
      shouldShowPopup: !!plan?.showPopup && !isPremium && !popupDismissed,
      dismissPopup: () => setPopupDismissed(true),
      reload,
      upgrade,
    };
  }, [info, popupDismissed, reload, upgrade]);

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const ctx = useContext(PremiumContext);
  if (!ctx) {
    throw new Error('usePremium must be used inside <PremiumProvider>');
  }
  return ctx;
}
