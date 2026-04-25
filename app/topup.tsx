import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
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
import { formatCurrency } from '@/src/utils/format';

const AMOUNTS = [10, 25, 50, 100, 250, 500];

const BRAND_PATTERNS: { pattern: RegExp; brand: string; icon: string }[] = [
  { pattern: /^4/, brand: 'Visa', icon: '💳' },
  { pattern: /^5[1-5]|^2[2-7]/, brand: 'Mastercard', icon: '💳' },
  { pattern: /^3[47]/, brand: 'Amex', icon: '💳' },
  { pattern: /^6/, brand: 'Mir', icon: '💳' },
];

function detectBrand(num: string): string {
  for (const { pattern, brand } of BRAND_PATTERNS) {
    if (pattern.test(num)) return brand;
  }
  return '';
}

function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return digits;
}

function validateCard(num: string, expiry: string, cvv: string, holder: string): string | null {
  const digits = num.replace(/\s/g, '');
  if (digits.length < 16) return 'Введите полный номер карты';
  const [mm, yy] = expiry.split('/');
  const month = parseInt(mm ?? '0', 10);
  const year = 2000 + parseInt(yy ?? '0', 10);
  if (!mm || !yy || month < 1 || month > 12) return 'Неверная дата';
  const now = new Date();
  if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
    return 'Карта просрочена';
  }
  if (cvv.replace(/\D/g, '').length < 3) return 'Неверный CVV';
  if (holder.trim().length < 2) return 'Введите имя держателя (минимум 2 символа)';
  if (holder.trim().length > 26) return 'Имя держателя — максимум 26 символов';
  return null;
}

export default function TopUpScreen() {
  const { profile, updateProfile, refreshProfile } = useAuth();
  const router = useRouter();

  const hasCard = !!profile?.card_last4;

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holder, setHolder] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showCardForm, setShowCardForm] = useState(!hasCard);

  const brand = detectBrand(cardNumber.replace(/\s/g, ''));

  const onSaveCard = async () => {
    const err = validateCard(cardNumber, expiry, cvv, holder);
    if (err) { Alert.alert('Ошибка', err); return; }
    setProcessing(true);
    try {
      const digits = cardNumber.replace(/\s/g, '');
      await updateProfile({
        card_last4: digits.slice(-4),
        card_brand: brand || 'Card',
        card_holder: holder.trim().toUpperCase(),
        card_expiry: expiry,
      });
      setShowCardForm(false);
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Не удалось сохранить карту');
    } finally {
      setProcessing(false);
    }
  };

  const onRemoveCard = () => {
    Alert.alert('Удалить карту?', `**** ${profile?.card_last4}`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive', onPress: async () => {
          await updateProfile({ card_last4: null, card_brand: null, card_holder: null, card_expiry: null });
          setShowCardForm(true);
        },
      },
    ]);
  };

  const onTopUp = async () => {
    if (!selectedAmount) { Alert.alert('Выберите сумму пополнения'); return; }
    if (!profile?.card_last4 && !cardNumber) { Alert.alert('Привяжите карту'); return; }

    if (!hasCard || showCardForm) {
      const err = validateCard(cardNumber, expiry, cvv, holder);
      if (err) { Alert.alert('Ошибка карты', err); return; }
    }

    setProcessing(true);
    try {
      // Save card if new one was entered
      if (showCardForm && cardNumber) {
        const digits = cardNumber.replace(/\s/g, '');
        await updateProfile({
          card_last4: digits.slice(-4),
          card_brand: brand || 'Card',
          card_holder: holder.trim().toUpperCase(),
          card_expiry: expiry,
        });
      }

      // Simulate payment processing delay
      await new Promise((r) => setTimeout(r, 1200));

      const newBalance = (profile?.balance ?? 0) + selectedAmount;
      await updateProfile({ balance: newBalance });
      await refreshProfile();

      Alert.alert(
        'Баланс пополнен!',
        `+${formatCurrency(selectedAmount)}\nНовый баланс: ${formatCurrency(newBalance)}`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e) {
      Alert.alert('Ошибка', e instanceof Error ? e.message : 'Платёж не прошёл');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Current balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Текущий баланс</Text>
            <Text style={styles.balanceValue}>{formatCurrency(profile?.balance ?? 0)}</Text>
          </View>

          {/* Saved card or form */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Способ оплаты</Text>

            {hasCard && !showCardForm ? (
              <View style={styles.savedCard}>
                <View style={styles.savedCardLeft}>
                  <View style={styles.chipIcon}>
                    <Ionicons name="card" size={18} color={colors.yellow} />
                  </View>
                  <View>
                    <Text style={styles.savedCardBrand}>{profile?.card_brand}</Text>
                    <Text style={styles.savedCardNum}>•••• •••• •••• {profile?.card_last4}</Text>
                    <Text style={styles.savedCardMeta}>
                      {profile?.card_holder}  ·  {profile?.card_expiry}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={onRemoveCard} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
                </Pressable>
              </View>
            ) : (
              <View style={styles.cardForm}>
                <Field
                  label="Номер карты"
                  value={cardNumber}
                  onChangeText={(v) => setCardNumber(formatCardNumber(v))}
                  placeholder="0000 0000 0000 0000"
                  keyboardType="numeric"
                  maxLength={19}
                  right={brand ? <Text style={styles.brandTag}>{brand}</Text> : undefined}
                />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Срок действия"
                      value={expiry}
                      onChangeText={(v) => setExpiry(formatExpiry(v))}
                      placeholder="MM/YY"
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="CVV"
                      value={cvv}
                      onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))}
                      placeholder="•••"
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={4}
                    />
                  </View>
                </View>
                <Field
                  label="Имя держателя"
                  value={holder}
                  onChangeText={(v) =>
                    setHolder(v.replace(/[^a-zA-Z\s\-]/g, '').toUpperCase().slice(0, 26))
                  }
                  placeholder="IVAN IVANOV"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={26}
                />
                {hasCard && (
                  <Button
                    title="Сохранить карту"
                    variant="secondary"
                    size="sm"
                    onPress={onSaveCard}
                    loading={processing}
                    style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
                  />
                )}
              </View>
            )}

            {hasCard && !showCardForm && (
              <Pressable onPress={() => setShowCardForm(true)} style={styles.addCardBtn}>
                <Ionicons name="add-circle-outline" size={16} color={colors.yellow} />
                <Text style={styles.addCardText}>Использовать другую карту</Text>
              </Pressable>
            )}
          </View>

          {/* Amount selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Сумма пополнения</Text>
            <View style={styles.amountsGrid}>
              {AMOUNTS.map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => setSelectedAmount(selectedAmount === amount ? null : amount)}
                  style={({ pressed }) => [
                    styles.amountChip,
                    selectedAmount === amount && styles.amountChipActive,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={[
                    styles.amountText,
                    selectedAmount === amount && styles.amountTextActive,
                  ]}>
                    {formatCurrency(amount)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

        </ScrollView>

        {/* Bottom action */}
        <View style={styles.bottomBar}>
          <Button
            title={
              processing
                ? 'Обработка...'
                : selectedAmount
                ? `Пополнить на ${formatCurrency(selectedAmount)}`
                : 'Выберите сумму'
            }
            size="lg"
            onPress={onTopUp}
            loading={processing}
            disabled={!selectedAmount}
          />
          <Text style={styles.disclaimer}>
            Это демо-приложение. Реальное списание средств не производится.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  right,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string; right?: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          {...props}
        />
        {right}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },

  balanceCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  balanceLabel: { color: colors.textMuted, fontSize: fontSizes.sm, textTransform: 'uppercase', letterSpacing: 1 },
  balanceValue: { color: colors.yellow, fontSize: fontSizes.title, fontWeight: fontWeights.bold },

  section: { gap: spacing.md },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  savedCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.yellow + '55',
    borderRadius: radii.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  savedCardLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  chipIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedCardBrand: { color: colors.white, fontSize: fontSizes.md, fontWeight: fontWeights.semibold },
  savedCardNum: { color: colors.textSecondary, fontSize: fontSizes.sm, letterSpacing: 2, marginTop: 2 },
  savedCardMeta: { color: colors.textMuted, fontSize: fontSizes.xs, marginTop: 2 },

  addCardBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs },
  addCardText: { color: colors.yellow, fontSize: fontSizes.sm, fontWeight: fontWeights.semibold },

  cardForm: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', gap: spacing.md },
  field: { gap: spacing.xs },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
  },
  input: {
    flex: 1,
    color: colors.white,
    fontSize: fontSizes.md,
    paddingVertical: spacing.md,
  },
  brandTag: {
    color: colors.yellow,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    letterSpacing: 0.5,
  },

  amountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  amountChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minWidth: '30%',
    alignItems: 'center',
  },
  amountChipActive: {
    borderColor: colors.red,
    backgroundColor: `${colors.red}22`,
  },
  amountText: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
  },
  amountTextActive: {
    color: colors.white,
  },

  bottomBar: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  disclaimer: {
    color: colors.textMuted,
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
});
