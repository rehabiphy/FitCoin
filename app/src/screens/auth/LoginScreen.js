import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import TextField from '../../components/TextField';
import GradientButton from '../../components/GradientButton';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import { LogoMark } from '../../components/Logo';
import { useAuth } from '../../context/AuthContext';
import { colors, radius, type } from '../../theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen({ navigation }) {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const passwordRef = useRef(null);

  const busy = loading || googleLoading;

  const validate = () => {
    const next = {};
    if (!EMAIL_RE.test(email.trim())) {
      next.email = 'Enter a valid email address';
    }
    if (!password) {
      next.password = 'Enter your password';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // On success AuthContext flips to signed in and the navigator shows the app
  const submit = async () => {
    setFormError('');
    if (busy || !validate()) {
      return;
    }
    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setFormError(err.message);
      setLoading(false);
    }
  };

  const google = async () => {
    setFormError('');
    if (busy) {
      return;
    }
    setGoogleLoading(true);
    try {
      const signedIn = await signInWithGoogle();
      if (!signedIn) {
        setGoogleLoading(false);
      }
    } catch (err) {
      setFormError(err.message || 'Google sign-in failed');
      setGoogleLoading(false);
    }
  };

  const onChange = (setter, field) => value => {
    setter(value);
    if (errors[field]) {
      setErrors(e => ({ ...e, [field]: undefined }));
    }
    setFormError('');
  };

  return (
    <Screen scroll edges={['top', 'bottom']} contentContainerStyle={styles.content}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.hero}>
          <LogoMark size={64} />
          <Text style={[type.h1, styles.title]}>Welcome back</Text>
          <Text style={type.body}>Sign in to keep your streak alive and collect today’s rewards.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(600)}>
          <TextField
            label="Email"
            icon="Mail"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            value={email}
            onChangeText={onChange(setEmail, 'email')}
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={errors.email}
            editable={!busy}
          />
          <TextField
            ref={passwordRef}
            label="Password"
            icon="Lock"
            placeholder="Enter your password"
            secure
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            value={password}
            onChangeText={onChange(setPassword, 'password')}
            onSubmitEditing={submit}
            error={errors.password}
            editable={!busy}
          />
          <Text style={styles.forgot}>Forgot password?</Text>
        </Animated.View>

        {formError ? (
          <Animated.View entering={FadeIn} style={styles.formError}>
            <Icon name="AlertCircle" size={16} color={colors.danger} />
            <Text style={styles.formErrorText}>{formError}</Text>
          </Animated.View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(240).duration(600)} style={styles.actions}>
          <GradientButton title="Sign In" onPress={submit} loading={loading} disabled={googleLoading} />
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={type.caption}>or continue with</Text>
            <View style={styles.divider} />
          </View>
          <PressableScale style={styles.social} onPress={google} disabled={busy}>
            {googleLoading ? (
              <Text style={styles.socialText}>Connecting…</Text>
            ) : (
              <>
                <Icon name="Globe" size={20} color={colors.text} />
                <Text style={styles.socialText}>Continue with Google</Text>
              </>
            )}
          </PressableScale>
          <Text style={styles.footer}>
            New to Fitcoin?{' '}
            <Text style={styles.link} onPress={() => !busy && navigation.navigate('Register')}>
              Create account
            </Text>
          </Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 24 },
  hero: { marginBottom: 28, gap: 8 },
  title: { marginTop: 20 },
  forgot: { color: colors.cyan, fontWeight: '600', alignSelf: 'flex-end', marginTop: -4 },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 20,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,77,109,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,109,0.3)',
  },
  formErrorText: { flex: 1, color: colors.danger, fontSize: 13, fontWeight: '600' },
  actions: { marginTop: 28, gap: 20 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  social: {
    height: 52,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  socialText: { color: colors.text, fontWeight: '600' },
  footer: { textAlign: 'center', color: colors.textSecondary },
  link: { color: colors.cyan, fontWeight: '700' },
});
