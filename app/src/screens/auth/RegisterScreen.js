import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import TextField from '../../components/TextField';
import GradientButton from '../../components/GradientButton';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import { GradientFill } from '../../components/GradientFill';
import { useAuth } from '../../context/AuthContext';
import { colors, gradients, radius, type } from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirrors the backend rules so most mistakes are caught before a request
function validate(form) {
  const e = {};
  if (form.name.trim().length < 2) {
    e.name = 'Enter your full name';
  }
  if (!EMAIL_RE.test(form.email.trim())) {
    e.email = 'Enter a valid email address';
  }
  if (form.phone.trim() && !/^\+?[0-9\s-]{7,20}$/.test(form.phone.trim())) {
    e.phone = 'Enter a valid phone number';
  }
  if (form.password.length < 8) {
    e.password = 'Password must be at least 8 characters';
  } else if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
    e.password = 'Use at least one letter and one number';
  }
  return e;
}

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const [agreed, setAgreed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', referralCode: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const set = key => value => {
    setForm(f => ({ ...f, [key]: value }));
    if (errors[key]) {
      setErrors(e => ({ ...e, [key]: undefined }));
    }
    setFormError('');
  };

  // On success AuthContext flips to signed in and the navigator shows the app
  const submit = async () => {
    setFormError('');
    const found = validate(form);
    setErrors(found);
    if (loading || Object.keys(found).length) {
      return;
    }
    setLoading(true);
    try {
      await signUp({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim() || undefined,
        referralCode: form.referralCode.trim() || undefined,
      });
    } catch (err) {
      const fieldErrors = err.fieldErrors || {};
      if (err.code === 'EMAIL_TAKEN') {
        fieldErrors.email = err.message;
      } else if (err.code === 'INVALID_REFERRAL') {
        fieldErrors.referralCode = err.message;
      }
      setErrors(fieldErrors);
      if (!Object.keys(fieldErrors).length) {
        setFormError(err.message);
      }
      setLoading(false);
    }
  };

  const fields = [
    { key: 'name', label: 'Full name', icon: 'User', placeholder: 'Your name', autoComplete: 'name' },
    {
      key: 'email',
      label: 'Email',
      icon: 'Mail',
      placeholder: 'you@example.com',
      keyboardType: 'email-address',
      autoCapitalize: 'none',
      autoComplete: 'email',
    },
    {
      key: 'phone',
      label: 'Mobile number (optional)',
      icon: 'Phone',
      placeholder: '+91 98765 43210',
      keyboardType: 'phone-pad',
      autoComplete: 'tel',
    },
    {
      key: 'password',
      label: 'Password',
      icon: 'Lock',
      placeholder: 'Min. 8 characters, letters & numbers',
      secure: true,
      autoComplete: 'new-password',
    },
    {
      key: 'referralCode',
      label: 'Referral code (optional)',
      icon: 'Gift',
      placeholder: 'e.g. FIT-AISHA21',
      autoCapitalize: 'characters',
    },
  ];

  return (
    <Screen
      scroll
      edges={['top', 'bottom']}
      header={<Header title="Create account" />}
      contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.intro}>
        <Text style={type.h1}>Start earning today</Text>
        <Text style={type.body}>Join and get a 50 FIT welcome bonus after your first activity.</Text>
      </Animated.View>

      {fields.map(({ key, ...f }, i) => (
        <Animated.View key={key} entering={FadeInDown.delay(80 + i * 60).duration(500)}>
          <TextField {...f} value={form[key]} onChangeText={set(key)} error={errors[key]} editable={!loading} />
        </Animated.View>
      ))}

      {formError ? (
        <View style={styles.formError}>
          <Icon name="AlertCircle" size={16} color={colors.danger} />
          <Text style={styles.formErrorText}>{formError}</Text>
        </View>
      ) : null}

      <PressableScale onPress={() => setAgreed(a => !a)} style={styles.terms} scaleTo={0.98}>
        <View style={[styles.check, agreed && styles.checkOn]}>
          {agreed ? (
            <Animated.View entering={ZoomIn.springify()} style={styles.checkFill}>
              <GradientFill colors={gradients.primary} />
              <Icon name="Check" size={14} color="#fff" strokeWidth={3} />
            </Animated.View>
          ) : null}
        </View>
        <Text style={styles.termsText}>
          I agree to the <Text style={styles.link}>Terms</Text>, <Text style={styles.link}>Reward Rules</Text> and{' '}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </PressableScale>

      <GradientButton title="Create Account" onPress={submit} loading={loading} disabled={!agreed} style={styles.cta} />
      <Text style={styles.footer}>
        Already a member?{' '}
        <Text style={styles.link} onPress={() => !loading && navigation.goBack()}>
          Sign in
        </Text>
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 8 },
  intro: { gap: 6, marginBottom: 24 },
  terms: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 4 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    overflow: 'hidden',
    marginTop: 1,
  },
  checkOn: { borderColor: 'transparent' },
  checkFill: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,77,109,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.3)',
  },
  formErrorText: { flex: 1, color: colors.danger, fontSize: 13, fontWeight: '600' },
  termsText: { flex: 1, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  link: { color: colors.cyan, fontWeight: '700' },
  cta: { marginTop: 28 },
  footer: { textAlign: 'center', color: colors.textSecondary, marginTop: 20 },
});
