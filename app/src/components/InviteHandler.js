import { useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { navigationRef } from '../navigation/navigationRef';
import { getPendingInvite, onInvite, startInviteLinks } from '../services/invite';

/**
 * Opens the right screen when an invite link is tapped (renders nothing):
 *  - signed out: the sign-up form, with the code filled in
 *  - signed in:  Refer & Earn, where the code can be added (or it shows whose code is already on the account)
 * Codes from the Play install referrer are only filled in, never navigated to,
 * since they are read on every launch. Each tapped link is opened once. Mounted once in App.js.
 */
export default function InviteHandler() {
  const { status } = useAuth();
  const handled = useRef(null); // the last invite (object) that was opened

  const open = useCallback(
    code => {
      const names = navigationRef.isReady() ? navigationRef.getRootState()?.routeNames || [] : [];
      if (status === 'signedIn' && names.includes('Main')) {
        // A new Google account sees the referral prompt first, which already fills in the code
        if (!names.includes('ReferralPrompt')) {
          navigationRef.navigate('Referral', { code });
        }
        return true;
      }
      if (status === 'signedOut' && names.includes('Register')) {
        navigationRef.navigate('Register', { code });
        return true;
      }
      return false; // still on the splash: try again when the navigator changes
    },
    [status],
  );

  const openPending = useCallback(() => {
    const invite = getPendingInvite();
    if (invite?.source === 'link' && invite !== handled.current && open(invite.code)) {
      handled.current = invite;
    }
  }, [open]);

  useEffect(() => {
    startInviteLinks();
  }, []);

  useEffect(() => {
    openPending();
    const offInvite = onInvite(openPending);
    const offState = navigationRef.addListener('state', openPending);
    return () => {
      offInvite();
      offState();
    };
  }, [openPending]);

  return null;
}
