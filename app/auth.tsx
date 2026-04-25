import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/src/components/Button';
import { colors, fontSizes, fontWeights, radii, spacing } from '@/src/constants/theme';
import { useAuth } from '@/src/contexts/AuthContext';

type Mode = 'signIn' | 'signUp';

const NICKNAME_RE = /^[a-zA-Z0-9_]*$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignIn(email: string, password: string): string | null {
  if (!EMAIL_RE.test(email)) return 'Введите корректный email';
  if (password.length < 8) return 'Пароль — минимум 8 символов';
  return null;
}

function validateSignUp(email: string, password: string, nickname: string): string | null {
  const nick = nickname.trim();
  if (nick.length < 3) return 'Никнейм — минимум 3 символа';
  if (!NICKNAME_RE.test(nick)) return 'Никнейм: только буквы, цифры и _';
  if (!EMAIL_RE.test(email)) return 'Введите корректный email';
  if (password.length < 8) return 'Пароль — минимум 8 символов';
  if (!/[a-zA-Z]/.test(password)) return 'Пароль должен содержать хотя бы одну букву';
  if (!/[0-9]/.test(password)) return 'Пароль должен содержать хотя бы одну цифру';
  return null;
}

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onNicknameChange = (v: string) => {
    setNickname(v.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20));
  };

  const onSubmit = async () => {
    const trimEmail = email.trim();
    const err =
      mode === 'signIn'
        ? validateSignIn(trimEmail, password)
        : validateSignUp(trimEmail, password, nickname);
    if (err) { Alert.alert('Ошибка', err); return; }

    setSubmitting(true);
    try {
      if (mode === 'signIn') {
        await signIn(trimEmail, password);
      } else {
        await signUp(trimEmail, password, nickname.trim());
        Alert.alert(
          'Проверьте email',
          'Если подтверждение адреса включено, перейдите по ссылке в письме перед входом.',
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const alreadyExists =
        message.toLowerCase().includes('already registered') ||
        message.toLowerCase().includes('already exists') ||
        message.toLowerCase().includes('user already');
      if (alreadyExists) {
        Alert.alert(
          'Аккаунт уже существует',
          'Этот email уже зарегистрирован. Войдите в аккаунт.',
          [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Войти', onPress: () => { setMode('signIn'); setNickname(''); } },
          ],
        );
      } else {
        Alert.alert('Ошибка авторизации', message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'signIn' ? 'signUp' : 'signIn');
    setEmail('');
    setPassword('');
    setNickname('');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroWrap}>
            <View style={styles.logoBadge}>
              <Ionicons name="game-controller" size={36} color={colors.red} />
            </View>
            <Text style={styles.title}>DOTA 2 ITEMS</Text>
            <Text style={styles.subtitle}>
              Войди чтобы покупать скины, собирать инвентарь и торговать легендами.
            </Text>
          </View>

          <View style={styles.form}>
            {mode === 'signUp' ? (
              <Field
                label="Никнейм"
                value={nickname}
                onChangeText={onNicknameChange}
                placeholder="ваш_ник"
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                hint={`${nickname.length}/20 · буквы, цифры, _ · минимум 3`}
              />
            ) : null}
            <Field
              label="Эл. почта"
              value={email}
              onChangeText={(v) => setEmail(v.slice(0, 254))}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              maxLength={254}
            />
            <Field
              label="Пароль"
              value={password}
              onChangeText={(v) => setPassword(v.slice(0, 72))}
              placeholder="••••••••"
              secureTextEntry
              maxLength={72}
              hint={
                mode === 'signUp'
                  ? `${password.length}/72 · минимум 8 · буквы и цифры обязательны`
                  : `${password.length}/72 · минимум 8`
              }
            />

            <Button
              title={mode === 'signIn' ? 'Войти' : 'Создать аккаунт'}
              onPress={onSubmit}
              loading={submitting}
              size="lg"
              style={{ marginTop: spacing.md }}
            />

            <Pressable
              onPress={switchMode}
              style={styles.switchButton}
              hitSlop={8}
            >
              <Text style={styles.switchText}>
                {mode === 'signIn' ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}
                <Text style={styles.switchHighlight}>
                  {mode === 'signIn' ? 'Зарегистрироваться' : 'Войти'}
                </Text>
              </Text>
            </Pressable>
          </View>

          {submitting ? (
            <ActivityIndicator color={colors.yellow} style={{ marginTop: spacing.lg }} />
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps extends React.ComponentProps<typeof TextInput> {
  label: string;
  hint?: string;
}

function Field({ label, hint, style, ...rest }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[styles.input, style]}
        {...rest}
      />
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  heroWrap: {
    alignItems: 'center',
    gap: spacing.md,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.white,
    fontSize: fontSizes.title,
    fontWeight: fontWeights.bold,
    letterSpacing: 2,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },
  form: {
    gap: spacing.md,
  },
  field: {
    gap: spacing.xs,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.white,
    fontSize: fontSizes.md,
  },
  fieldHint: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    lineHeight: 16,
  },
  switchButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  switchText: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
  },
  switchHighlight: {
    color: colors.yellow,
    fontWeight: fontWeights.semibold,
  },
});
