import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { dashboardApi } from '@knowlex/core/api/dashboard-api';
import type { RecentCase, UpcomingHearing } from '@knowlex/core/api/dashboard-api';
import { listAllDocuments } from '@knowlex/core/api/doc-processing-api';
import type { DocumentRecord } from '@knowlex/core/api/doc-processing-api';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { TRANSLATE_BG, TRANSLATE_BG_PRESSED, TRANSLATE_ICON_BG } from '@/lib/translate-colors';
import { getTypeColorKey, getTypeIcon, getTypeLabel } from '@/lib/document-types';
import { formatDistanceToNow } from 'date-fns';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

type DocStatus = 'active' | 'pending' | 'blocked';

function docStatus(jobStatus: string | null | undefined): DocStatus {
  const s = (jobStatus ?? '').toUpperCase();
  if (s === '' || s === 'COMPLETED') return 'active';
  if (s === 'FAILED' || s === 'CANCELLED') return 'blocked';
  return 'pending';
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [recentCases, setRecentCases] = useState<RecentCase[]>([]);
  const [hearings, setHearings] = useState<UpcomingHearing[]>([]);
  const [recentDocs, setRecentDocs] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [activityRes, hearingsRes, docsRes] = await Promise.all([
        dashboardApi.getRecentActivity(),
        dashboardApi.getUpcomingHearings(),
        listAllDocuments({ page: 0, size: 5, sort: 'createdAt,desc' }),
      ]);
      if (activityRes.data) setRecentCases(activityRes.data.recentCases ?? []);
      if (Array.isArray(hearingsRes.data)) setHearings(hearingsRes.data);
      setRecentDocs(docsRes.documents ?? []);
    } catch (err) {
      console.log('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const openDocument = (doc: DocumentRecord) => {
    const params: Record<string, string> = {
      docId: doc.id,
      name: doc.name ?? doc.originalFilename ?? 'Document',
    };
    if (doc.downloadUrl) params.downloadUrl = doc.downloadUrl;
    if (doc.signedUrl) params.signedUrl = doc.signedUrl;
    if (doc.fileType) params.fileType = doc.fileType;
    if (doc.type) params.type = doc.type;
    router.push({ pathname: '/viewer', params } as any);
  };

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

        {/* Primary actions — side-by-side tiles */}
        <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing['2xl'] }}>
          <Pressable
            onPress={() => router.push({ pathname: '/drafting', params: { new: '1' } } as any)}
            accessibilityRole="button"
            accessibilityLabel="Create a new draft"
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed ? colors.kxPrimary[700] : colors.kxPrimary[600],
              borderRadius: radius.lg,
              padding: spacing.lg,
              gap: spacing.sm,
            })}
          >
            <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.kxPrimary[500], alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="create-outline" size={20} color={colors.onPrimary} />
            </View>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.onPrimary }}>
              New Draft
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.onPrimary, opacity: 0.85 }} numberOfLines={2}>
              Pick a template and let AI draft it
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push({ pathname: '/translate', params: { new: '1' } } as any)}
            accessibilityRole="button"
            accessibilityLabel="Translate a document"
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed ? TRANSLATE_BG_PRESSED : TRANSLATE_BG,
              borderRadius: radius.lg,
              padding: spacing.lg,
              gap: spacing.sm,
            })}
          >
            <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: TRANSLATE_ICON_BG, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="globe-outline" size={20} color={colors.onPrimary} />
            </View>
            <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: colors.onPrimary }}>
              Translate
            </Text>
            <Text style={{ fontSize: typography.fontSize.xs, color: colors.onPrimary, opacity: 0.85 }} numberOfLines={2}>
              Translate documents into 12 Indian languages
            </Text>
          </Pressable>
        </View>

        {/* Today's Hearings */}
        <Text style={[styles.sectionTitle, { color: colors.kxTextPrimary, fontFamily: typography.fontFamily.sans, marginTop: spacing['3xl'] }]}>
          Today's Hearings
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
              <Pressable key={h.id} onPress={() => router.push('/cause-lists' as any)}>
                <Card style={{ width: 240, marginRight: spacing.md }}>
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
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Recent Workspaces */}
        <Text style={[styles.sectionTitle, { color: colors.kxTextPrimary, fontFamily: typography.fontFamily.sans, marginTop: spacing['3xl'] }]}>
          Recent Workspaces
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

        {/* Recent Documents */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing['3xl'] }}>
          <Text style={[styles.sectionTitle, { color: colors.kxTextPrimary, fontFamily: typography.fontFamily.sans }]}>
            Recent Documents
          </Text>
          <Pressable onPress={() => router.push('/documents' as any)} hitSlop={8} accessibilityRole="button" accessibilityLabel="View all documents">
            <Text style={{ color: colors.kxPrimary[600], fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold }}>
              View All
            </Text>
          </Pressable>
        </View>
        {loading ? (
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {[1, 2, 3].map((i) => <SkeletonLoader key={i} height={62} borderRadius={radius.lg} />)}
          </View>
        ) : recentDocs.length === 0 ? (
          <Card style={{ marginTop: spacing.md }}>
            <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.sm, textAlign: 'center' }}>No documents yet</Text>
          </Card>
        ) : (
          <View style={{ gap: spacing.sm, marginTop: spacing.md }}>
            {recentDocs.map((doc) => {
              const status = docStatus(doc.jobStatus);
              const colorKey = getTypeColorKey(doc.type ?? '');
              const tint = colors.docType[colorKey];
              return (
                <Pressable
                  key={doc.id}
                  onPress={() => status === 'active' && openDocument(doc)}
                  disabled={status !== 'active'}
                  accessibilityRole="button"
                  accessibilityLabel={doc.name ?? 'Document'}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
                    borderRadius: radius.lg, borderWidth: 1, borderColor: colors.kxCardBorder,
                    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
                    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
                    opacity: status === 'active' ? 1 : 0.7,
                  })}
                >
                  <View style={{
                    width: 36, height: 36, borderRadius: radius.md,
                    backgroundColor: tint + '20',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name={getTypeIcon(doc.type ?? '')} size={18} color={tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary }} numberOfLines={1}>
                      {doc.name ?? doc.originalFilename ?? 'Untitled Document'}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: spacing.sm }}>
                      <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>
                        {getTypeLabel(doc.type ?? '')}
                      </Text>
                      <Text style={{ fontSize: typography.fontSize.xs, color: colors.ledgerGray[400] }}>
                        {doc.createdAt ? formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true }) : ''}
                      </Text>
                    </View>
                  </View>
                  {status === 'active'
                    ? <Ionicons name="chevron-forward" size={16} color={colors.ledgerGray[400]} />
                    : <Badge
                        label={status === 'blocked' ? 'Failed' : 'Pending'}
                        status={status as any}
                      />
                  }
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});
