import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Screen from '../../components/Screen';
import Header from '../../components/Header';
import Avatar, { initialsOf } from '../../components/Avatar';
import TextField from '../../components/TextField';
import GradientButton from '../../components/GradientButton';
import PressableScale from '../../components/PressableScale';
import Icon from '../../components/Icon';
import { useAuth } from '../../context/AuthContext';
import { colors, gradients } from '../../theme';

export default function EditProfileScreen({ navigation }) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const next = {};
    if (name.trim().length < 2) {
      next.name = 'Enter your full name';
    }
    if (phone.trim() && !/^\+?[0-9\s-]{7,20}$/.test(phone.trim())) {
      next.phone = 'Enter a valid phone number';
    }
    setErrors(next);
    setFormError('');
    if (Object.keys(next).length) {
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() });
      navigation.goBack();
    } catch (err) {
      setErrors(err.fieldErrors || {});
      setFormError(err.message);
      setSaving(false);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom']} header={<Header title="Edit profile" />} contentContainerStyle={styles.content}>
      <Animated.View entering={FadeInDown.duration(450)} style={styles.avatarWrap}>
        <Avatar initials={initialsOf(name)} size={100} />
        <PressableScale style={styles.camera}>
          <Icon name="Plus" size={16} color="#fff" strokeWidth={3} />
        </PressableScale>
        <Text style={styles.change}>Change photo</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(450)}>
        <TextField label="Full name" icon="User" value={name} onChangeText={setName} error={errors.name} />
        <TextField label="Email" icon="Mail" value={user?.email} editable={false} />
        <TextField
          label="Mobile number"
          icon="Phone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="+91 98765 43210"
          error={errors.phone}
        />
        {user?.authProviders?.includes('google') ? (
          <View style={styles.verified}>
            <Icon name="ShieldCheck" size={14} color={colors.mint} />
            <Text style={styles.verifiedText}>Linked with Google</Text>
          </View>
        ) : null}
        {formError ? <Text style={styles.error}>{formError}</Text> : null}
      </Animated.View>

      <GradientButton title="Save changes" colors={gradients.primary} loading={saving} onPress={save} style={styles.cta} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24 },
  avatarWrap: { alignItems: 'center', marginVertical: 20 },
  camera: {
    position: 'absolute',
    top: 70,
    right: '36%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  change: { color: colors.cyan, fontWeight: '700', marginTop: 12 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6, marginLeft: 4 },
  verifiedText: { color: colors.mint, fontSize: 12 },
  error: { color: colors.danger, fontSize: 13, marginTop: 12, textAlign: 'center' },
  cta: { marginTop: 28 },
});
