import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { dashboardApi } from '@knowlex/core/api/dashboard-api';
import type { DashboardSummary, RecentCase, RecentDocument, UpcomingHearing } from '@knowlex/core/api/dashboard-api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { formatDistanceToNow } from 'date-fns';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [hearings, setHearings] = useState<UpcomingHearing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [summaryRes, activityRes, hearingsRes] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getRecentActivity(),
        dashboardApi.getUpcomingHearings(),
      ]);
      if (summaryRes.data) setSummary(summaryRes.data);
      if (activityRes.data) {
        setRecentCases(activityRes.data.recentCases ?? []);
        setRecentDocuments(activityRes.data.recentDocuments ?? []);
      }
      if (Array.isArray(hearingsRes.data)) setHearings(hearingsRes.data);
    } catch (err) {
      console.log('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.kxPrimary[600]} />}
      >
        {/* Greeting */}
        <Text style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, fontFamily: typography.fontFamily.serif }}>
          {getGreeting()},{'\n'}
          <Text style={{ color: colors.kxPrimary[600] }}>{user?.firstName || 'Counsellor'}</Text>
        </Text>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing['2xl'] }}>
          {loading ? (
            <>
              <SkeletonLoader height={80} borderRadius={radius.lg} style={{ flex: 1 }} />
              <SkeletonLoader height={80} borderRadius={radius.lg} style={{ flex: 1 }} />
              <SkeletonLoader height={80} borderRadius={radius.lg} style={{ flex: 1 }} />
            </>
          ) : (
            <>
              <StatCard label="Total Cases" value={summary?.totalCases ?? 0} colors={colors} typography={typography} />
              <StatCard label="Active" value={summary?.activeCases ?? 0} colors={colors} typography={typography} accent />
              <StatCard label="Clients" value={summary?.totalClients ?? 0} colors={colors} typography={typography} />
            </>
          )}
        </View>

        {/* Quick Access */}
        <Text style={[styles.sectionTitle, { color: colors.kxTextPrimary, fontFamily: typography.fontFamily.sans, marginTop: spacing['3xl'] }]}>
          Quick Access
        </Text>
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.md }}>
          <Pressable
            onPress={() => router.push('/drafts' as any)}
            accessibilityRole="button"
            accessibilityLabel="Go to Drafts"
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed ? colors.kxPrimary[50] : colors.kxCardBg,
              borderWidth: 1,
              borderColor: colors.kxCardBorder,
              borderRadius: radius.lg,
              padding: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            })}
          >
            <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.kxPrimary[50], alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>✏️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>Drafts</Text>
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>Legal documents</Text>
            </View>
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.lg }}>›</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/documents' as any)}
            accessibilityRole="button"
            accessibilityLabel="Go to Documents"
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed ? colors.kxPrimary[50] : colors.kxCardBg,
              borderWidth: 1,
              borderColor: colors.kxCardBorder,
              borderRadius: radius.lg,
              padding: spacing.md,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
            })}
          >
            <View style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.kxAccent[400] + '20', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 18 }}>🗂️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }}>Documents</Text>
              <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>Files & uploads</Text>
            </View>
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.lg }}>›</Text>
          </Pressable>
        </View>

        {/* Upcoming Hearings */}
        <Text style={[styles.sectionTitle, { color: colors.kxTextPrimary, fontFamily: typography.fontFamily.sans, marginTop: spacing['3xl'] }]}>
          Upcoming Hearings
        </Text>
        {loading ? (
          <SkeletonLoader height={100} borderRadius={radius.lg} style={{ marginTop: spacing.md }} />
        ) : hearings.length === 0 ? (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.sm, textAlign: 'center' }}>No upcoming hearings</Text>
          </Card>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: spacing.md }}>
            {hearings.slice(0, 5).map((h) => (
              <Card key={h.id} style={{ width: 240, marginRight: spacing.md }}>
                <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={2}>
                  {h.caseTitle}
                </Text>
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxPrimary[600], marginTop: spacing.xs }}>
                  {h.nextHearingDate ? new Date(h.nextHearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '-'}
                </Text>
                <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: spacing.xs }} numberOfLines={1}>
                  {h.courtName}{h.judgeName ? ` • ${h.judgeName}` : ''}
                </Text>
              </Card>
            ))}
          </ScrollView>
        )}

        {/* Recent Cases */}
        <Text style={[styles.sectionTitle, { color: colors.kxTextPrimary, fontFamily: typography.fontFamily.sans, marginTop: spacing['3xl'] }]}>
          Recent Cases
        </Text>
        {loading ? (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <SkeletonLoader height={72} borderRadius={radius.lg} />
            <SkeletonLoader height={72} borderRadius={radius.lg} />
            <SkeletonLoader height={72} borderRadius={radius.lg} />
          </View>
        ) : recentCases.length === 0 ? (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.sm, textAlign: 'center' }}>No recent cases</Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            {recentCases.slice(0, 5).map((c) => (
              <Pressable key={c.id} onPress={() => router.push(`/cases/${c.id}` as any)}>
                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: spacing.md }}>
                      <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={1}>
                        {c.caseTitle}
                      </Text>
                      <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
                        {c.caseNumber}
                      </Text>
                    </View>
                    <Badge label={c.caseStatus?.toLowerCase() ?? 'unknown'} status={c.caseStatus?.toLowerCase() as any} />
                  </View>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.ledgerGray[400], marginTop: spacing.sm }}>
                    {c.updatedAt ? formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true }) : ''}
                  </Text>
                </Card>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, colors, typography, accent }: { label: string; value: number; colors: typeof import('@/theme/tokens').lightColors; typography: typeof import('@/theme/tokens').typography; accent?: boolean }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: 14 }}>
      <Text style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: accent ? colors.kxPrimary[600] : colors.kxTextPrimary }}>
        {value}
      </Text>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2, fontFamily: typography.fontFamily.sans }}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
