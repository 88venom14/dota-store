import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/Button';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { colors, fontSizes, fontWeights, radii, spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';
import { useCart } from '@/src/contexts/CartContext';
import { AVATAR_BUCKET, supabase } from '@/src/services/supabase';
import { formatCurrency } from '@/src/utils/format';

export default function ProfileScreen() {
  const { profile, session, signOut, updateProfile, refreshProfile } = useAuth();
  const { totalItems, totalPrice } = useCart();
  const router = useRouter();
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [saving, setSaving] = useState(false);

  const onNicknameChange = (v: string) => {
    setNickname(v.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20));
  };
  const [uploading, setUploading] = useState(false);

  if (!profile || !session) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.loader}>
          <ActivityIndicator color={colors.red} />
        </View>
      </SafeAreaView>
    );
  }

  const onSaveNickname = async () => {
    const next = nickname.trim();
    if (next.length < 3) {
      Alert.alert('Никнейм', 'Минимум 3 символа');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ nickname: next });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save';
      Alert.alert('Profile', message);
    } finally {
      setSaving(false);
    }
  };

  const onPickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission required', 'Grant photo library access to change your avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    if (!asset.base64) {
      Alert.alert('Upload failed', 'Could not read selected image');
      return;
    }

    setUploading(true);
    try {
      const ext = (asset.uri.split('.').pop() ?? 'jpg').toLowerCase();
      const path = `${session.user.id}/${Date.now()}.${ext}`;
      const bytes = decodeBase64(asset.base64);
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, bytes, {
          contentType: asset.mimeType ?? `image/${ext === 'jpg' ? 'jpeg' : ext}`,
          upsert: true,
        });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);
      await updateProfile({ avatar_url: data.publicUrl });
      await refreshProfile();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      Alert.alert('Avatar', message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Профиль" subtitle={session.user.email ?? undefined} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarSection}>
          <Pressable onPress={onPickAvatar} style={styles.avatarWrap} accessibilityRole="button">
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
            ) : (
              <Ionicons name="person" size={48} color={colors.textMuted} />
            )}
            <View style={styles.avatarEdit}>
              {uploading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Ionicons name="camera" size={14} color={colors.white} />
              )}
            </View>
          </Pressable>
          <Text style={styles.avatarHint}>Нажмите для смены аватара</Text>
        </View>

        <Pressable style={styles.card} onPress={() => router.push('/topup')}>
          <View style={styles.balanceRow}>
            <View>
              <Text style={styles.cardLabel}>Баланс</Text>
              <Text style={styles.balance}>{formatCurrency(profile.balance)}</Text>
            </View>
            <View style={styles.topUpBtn}>
              <Ionicons name="add" size={16} color={colors.black} />
              <Text style={styles.topUpText}>Пополнить</Text>
            </View>
          </View>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Никнейм</Text>
          <TextInput
            value={nickname}
            onChangeText={onNicknameChange}
            style={styles.input}
            placeholder="Никнейм"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
          <Text style={styles.inputHint}>{nickname.length}/20 · буквы, цифры, _</Text>
          <Button
            title="Сохранить"
            variant="secondary"
            size="sm"
            onPress={onSaveNickname}
            loading={saving}
            style={{ alignSelf: 'flex-start', marginTop: spacing.sm }}
          />
        </View>

        <Pressable style={styles.card} onPress={() => router.push('/cart')}>
          <View style={styles.cartRow}>
            <View>
              <Text style={styles.cardLabel}>Корзина</Text>
              <Text style={styles.cartSummary}>
                {totalItems === 1 ? '1 предмет' : `${totalItems} предметов`} · {formatCurrency(totalPrice)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </View>
        </Pressable>

        <Button
          title="Sign out"
          variant="danger"
          onPress={() => signOut()}
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function decodeBase64(b64: string): Uint8Array {
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) lookup[chars.charCodeAt(i)] = i;
  const cleaned = b64.replace(/=+$/, '');
  const out = new Uint8Array((cleaned.length * 3) >> 2);
  let p = 0;
  for (let i = 0; i < cleaned.length; i += 4) {
    const a = lookup[cleaned.charCodeAt(i)];
    const b = lookup[cleaned.charCodeAt(i + 1)];
    const c = lookup[cleaned.charCodeAt(i + 2)];
    const d = lookup[cleaned.charCodeAt(i + 3)];
    out[p++] = (a << 2) | (b >> 4);
    if (i + 2 < cleaned.length) out[p++] = ((b & 15) << 4) | (c >> 2);
    if (i + 3 < cleaned.length) out[p++] = ((c & 3) << 6) | d;
  }
  return out;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.yellow,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: { width: '100%', height: '100%' },
  avatarEdit: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  avatarHint: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  cardLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  balance: {
    color: colors.yellow,
    fontSize: fontSizes.xxl,
    fontWeight: fontWeights.bold,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topUpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.yellow,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
  },
  topUpText: {
    color: colors.black,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.bold,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: fontSizes.md,
  },
  inputHint: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartSummary: {
    color: colors.white,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
  },
});
