import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { walletApi } from '@knowlex/core/api/subscription-api';
import type { WalletBalance, WalletTransaction, PaginatedData } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2,
}).format(amount);

const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', {
  year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

export default function WalletScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bRes, tRes] = await Promise.all([
        walletApi.getBalance(),
        walletApi.getTransactions({ page: 0, size: 20 }),
      ]);
      setBalance(bRes.data ?? null);
      const paginated = tRes.data as PaginatedData<WalletTransaction>;
      setTransactions(paginated?.content ?? []);
    } catch (err) {
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: 2, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
        <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: spacing.xs }}>
          <Ionicons name="chevron-back" size={20} color={colors.kxPrimary[600]} />
          <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm }}>Profile</Text>
        </Pressable>
        <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, marginTop: 2 }}>
          Wallet
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        {loading ? (
          <View style={{ paddingVertical: spacing['2xl'], alignItems: 'center' }}>
            <ActivityIndicator color={colors.kxPrimary[600]} />
          </View>
        ) : (
          <>
            {/* Balance */}
            <Card style={{ marginBottom: spacing.lg, alignItems: 'center', paddingVertical: spacing.xl }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                <Ionicons name="wallet-outline" size={18} color={colors.kxPrimary[600]} />
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Wallet Balance
                </Text>
              </View>
              <Text style={{ fontSize: typography.fontSize['3xl'], fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
                {formatCurrency(balance?.balance ?? 0)}
              </Text>
            </Card>

            {error && (
              <Card style={{ marginBottom: spacing.lg }}>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.error }}>{error}</Text>
              </Card>
            )}

            {/* Transactions */}
            <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
              Transactions
            </Text>
            {transactions.length === 0 ? (
              <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
                <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary }}>
                  No transactions yet
                </Text>
              </Card>
            ) : (
              <Card style={{ marginBottom: spacing.lg }}>
                {transactions.map((tx, i) => {
                  const isCredit = tx.type === 'CREDIT';
                  return (
                    <View key={tx.id} style={{
                      paddingVertical: spacing.md,
                      borderBottomWidth: i === transactions.length - 1 ? 0 : 1,
                      borderBottomColor: colors.kxCardBorder,
                    }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
                            {tx.description || tx.type}
                          </Text>
                          <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
                            {formatDate(tx.createdAt)}
                          </Text>
                        </View>
                        <Text style={{
                          fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold,
                          color: isCredit ? colors.success : colors.error,
                        }}>
                          {isCredit ? '+' : '−'}{formatCurrency(tx.amount)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </Card>
            )}

            {/* Web hint */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.kxPrimary[50], borderWidth: 1, borderColor: colors.kxPrimary[100] }}>
              <Ionicons name="information-circle-outline" size={18} color={colors.kxPrimary[600]} />
              <Text style={{ flex: 1, fontSize: typography.fontSize.xs, color: colors.kxPrimary[700] }}>
                To add funds, please use the Knowlex web app.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
