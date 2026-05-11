import { useEffect, useState, useCallback } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { subscriptionApi } from '@knowlex/core/api/subscription-api';
import type { Subscription, SubscriptionUsage, PaymentRecord } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  unit?: string;
}

function UsageBar({ label, used, limit, unit }: UsageBarProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const safeUsed = used ?? 0;
  const safeLimit = limit ?? 0;
  const percent = safeLimit === -1 ? 0 : safeLimit === 0 ? 100 : Math.min((safeUsed / safeLimit) * 100, 100);
  const fmt = (n: number) => unit === 'MB' && n >= 1024 ? `${(n / 1024).toFixed(1)} GB` : `${n}${unit ? ` ${unit}` : ''}`;
  const limitText = safeLimit === -1 ? 'Unlimited' : fmt(safeLimit);
  const barColor = percent >= 95 ? colors.error : percent >= 80 ? colors.warning ?? colors.kxAccent[500] : colors.kxPrimary[600];
  return (
    <View style={{ marginBottom: spacing.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>{label}</Text>
        <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }}>
          {fmt(safeUsed)} / {limitText}
        </Text>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.ledgerGray[100], overflow: 'hidden' }}>
        <View style={{ height: '100%', width: `${safeLimit === -1 ? 0 : percent}%`, backgroundColor: barColor, borderRadius: 3 }} />
      </View>
    </View>
  );
}

export default function BillingScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const subRes = await subscriptionApi.getCurrentSubscription();
      const sub = subRes.data as Subscription & { usage?: SubscriptionUsage };
      setSubscription(sub);
      setUsage(sub?.usage ?? null);
    } catch (err) {
      if (err instanceof Error && !err.message.includes('404')) {
        setError(err.message);
      }
      setSubscription(null);
    }
    try {
      const payRes = await subscriptionApi.getPayments();
      setPayments(payRes.data ?? []);
    } catch {
      // payments endpoint may not exist yet
    }
    setLoading(false);
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
          Billing
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl }}>
        {loading ? (
          <View style={{ paddingVertical: spacing['2xl'], alignItems: 'center' }}>
            <ActivityIndicator color={colors.kxPrimary[600]} />
          </View>
        ) : error ? (
          <Card>
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.error }}>
              Couldn't load billing: {error}
            </Text>
          </Card>
        ) : !subscription ? (
          <Card style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
            <Ionicons name="card-outline" size={32} color={colors.ledgerGray[300]} />
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary, marginTop: spacing.sm, textAlign: 'center' }}>
              No active subscription. Visit the web app to choose a plan.
            </Text>
          </Card>
        ) : (
          <>
            {/* Plan card */}
            <Card style={{ marginBottom: spacing.lg }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
                    {subscription.planDisplayName ?? subscription.planName}
                  </Text>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2, textTransform: 'capitalize' }}>
                    {subscription.billingCycle?.toLowerCase()} billing
                  </Text>
                </View>
                <Badge
                  label={subscription.status?.toLowerCase() ?? 'unknown'}
                  status={(subscription.status === 'ACTIVE' || subscription.status === 'CREATED' ? 'active' : subscription.status === 'CANCELLED' ? 'blocked' : 'pending') as any}
                />
              </View>
              {subscription.currentPeriodStart && subscription.currentPeriodEnd && (
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: spacing.md }}>
                  Current period: {fmtDate(subscription.currentPeriodStart)} — {fmtDate(subscription.currentPeriodEnd)}
                </Text>
              )}
              {subscription.trialEndDate && (
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxAccent[600], marginTop: 4 }}>
                  Trial ends {fmtDate(subscription.trialEndDate)}
                </Text>
              )}
              {subscription.cancelledAt && (
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.error, marginTop: 4 }}>
                  Cancelled on {fmtDate(subscription.cancelledAt)}
                </Text>
              )}
            </Card>

            {/* Usage */}
            {usage && (
              <>
                <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
                  Usage
                </Text>
                <Card style={{ marginBottom: spacing.lg }}>
                  <UsageBar label="Drafts" used={usage.draftsUsed} limit={usage.draftsLimit} />
                  <UsageBar label="Chat Messages" used={usage.chatMessagesUsed ?? 0} limit={usage.chatMessagesLimit ?? -1} />
                  <UsageBar label="Clients" used={usage.clientsUsed} limit={usage.clientsLimit} />
                  <UsageBar label="Cases" used={usage.casesUsed} limit={usage.casesLimit} />
                  <UsageBar label="Storage" used={usage.storageMbUsed ?? 0} limit={usage.storageMbLimit ?? -1} unit="MB" />
                </Card>
              </>
            )}

            {/* Payments */}
            {payments.length > 0 && (
              <>
                <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: spacing.sm }}>
                  Payment History
                </Text>
                <Card style={{ marginBottom: spacing.lg }}>
                  {payments.map((p, i) => (
                    <View key={p.id} style={{
                      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                      paddingVertical: spacing.md,
                      borderBottomWidth: i === payments.length - 1 ? 0 : 1,
                      borderBottomColor: colors.kxCardBorder,
                    }}>
                      <View>
                        <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>
                          {p.currency} {(p.amount / 100).toLocaleString('en-IN')}
                        </Text>
                        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
                          {fmtDate(p.createdAt)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </Card>
              </>
            )}

            {/* Web hint */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.kxPrimary[50], borderWidth: 1, borderColor: colors.kxPrimary[100] }}>
              <Ionicons name="information-circle-outline" size={18} color={colors.kxPrimary[600]} />
              <Text style={{ flex: 1, fontSize: typography.fontSize.xs, color: colors.kxPrimary[700] }}>
                To upgrade, change plan, or cancel — please visit the Knowlex web app.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
