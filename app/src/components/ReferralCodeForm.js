import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import TextField from './TextField';
import GradientButton from './GradientButton';
import Icon from './Icon';
import { referralsApi } from '../api/engagementApi';
import { useAuth } from '../context/AuthContext';
import { clearPendingInvite } from '../services/invite';
import { colors, gradients, TOKEN } from '../theme';

const CODE_RE = /^[A-Za-z0-9-]{3,32}$/;

/**
 * Whose code this is, looked up as the person types: { state: 'idle' | 'checking' | 'found' | 'missing', name, reward }.
 * Network errors count as idle, so the server still has the final word on submit.
 */
export function useCodeOwner(code) {
  const [owner, setOwner] = useState({ state: 'idle' });
  useEffect(() => {
    const trimmed = (code || '').trim();
    if (!CODE_RE.test(trimmed)) {
      setOwner({ state: 'idle' });
      return undefined;
    }
    let live = true;
    setOwner({ state: 'checking' });
    const timer = setTimeout(() => {
      referralsApi
        .lookup(trimmed)
        .then(d => live && setOwner({ state: 'found', name: d.name, reward: d.reward }))
        .catch(err => live && setOwner({ state: err.status === 404 ? 'missing' : 'idle' }));
    }, 400);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [code]);
  return owner;
}

/** One line under a code field: "Aisha's code · you get 100 FIT" or "Code not found". */
export function CodeOwnerHint({ owner }) {
  if (owner.state === 'found') {
    return (
      <Animated.View entering={FadeIn} style={styles.hint}>
        <Icon name="BadgeCheck" size={15} color={colors.mint} />
        <Text style={[styles.hintText, { color: colors.mint }]}>
          {owner.name}’s code · you get {owner.reward} {TOKEN}
        </Text>
      </Animated.View>
    );
  }
  if (owner.state === 'missing') {
    return (
      <Animated.View entering={FadeIn} style={styles.hint}>
        <Icon name="AlertCircle" size={15} color={colors.danger} />
        <Text style={[styles.hintText, { color: colors.danger }]}>No account uses this code</Text>
      </Animated.View>
    );
  }
  return null;
}

/**
 * Field + button that adds a friend's code to the signed-in account (once, for good).
 * `onApplied({ referredBy, welcomeBonus })` runs after the server accepted it.
 */
export default function ReferralCodeForm({ initialCode = '', onApplied, buttonTitle = 'Apply code', style }) {
  const { applyUser } = useAuth();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const owner = useCodeOwner(code);

  const typed = useRef(false);

  // A new invite link while the screen is open replaces the code, unless the person typed their own
  useEffect(() => {
    if (initialCode && !typed.current) {
      setCode(initialCode);
    }
  }, [initialCode]);

  const submit = async () => {
    const trimmed = code.trim();
    if (!CODE_RE.test(trimmed)) {
      setError('Enter your friend’s code, e.g. FIT-AISHA21');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await referralsApi.apply(trimmed);
      await applyUser(result.user);
      clearPendingInvite();
      onApplied?.(result);
    } catch (err) {
      setError(err.fieldErrors?.code || err.message);
      if (err.code === 'ALREADY_REFERRED') {
        // The account already has a code (added on another phone): refresh what the app shows
        onApplied?.(null, err);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={style}>
      <TextField
        label="Friend’s referral code"
        icon="Gift"
        placeholder="e.g. FIT-AISHA21"
        autoCapitalize="characters"
        autoCorrect={false}
        value={code}
        onChangeText={v => {
          typed.current = true;
          setCode(v);
          setError('');
        }}
        error={error}
        editable={!saving}
        returnKeyType="done"
        onSubmitEditing={submit}
      />
      {error ? null : <CodeOwnerHint owner={owner} />}
      <Text style={styles.note}>A code can be added once and can’t be changed later.</Text>
      <GradientButton
        title={buttonTitle}
        icon="Check"
        colors={gradients.mint}
        size="md"
        loading={saving}
        disabled={!code.trim() || owner.state === 'missing'}
        onPress={submit}
        style={styles.button}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginBottom: 8, marginLeft: 4 },
  hintText: { fontSize: 13, fontWeight: '700' },
  note: { color: colors.textMuted, fontSize: 12, marginLeft: 4 },
  button: { marginTop: 14 },
});
