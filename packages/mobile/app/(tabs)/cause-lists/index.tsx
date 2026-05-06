import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { causeListApi } from '@knowlex/core/api/cause-list-api';
import type { CauseListItem } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

type SyncState = 'idle' | 'triggering' | 'polling' | 'completed' | 'failed';

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDatePill(dateStr: string): { top: string; bottom: string; isToday: boolean } {
  const d = new Date(dateStr + 'T00:00:00');
  const today = toISODate(new Date());
  return {
    top: d.toLocaleDateString('en-IN', { day: 'numeric' }),
    bottom: d.toLocaleDateString('en-IN', { month: 'short' }),
    isToday: dateStr === today,
  };
}

function getDateStrip(center: string): string[] {
  const base = new Date(center + 'T00:00:00');
  return [-3, -2, -1, 0, 1, 2, 3].map((offset) => {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    return toISODate(d);
  });
}

function groupByJudge(items: CauseListItem[]): [string, CauseListItem[]][] {
  const map: Record<string, CauseListItem[]> = {};
  for (const item of items) {
    const key = item.judgeName?.trim() || 'Unknown Judge';
    (map[key] = map[key] ?? []).push(item);
  }
  return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
}

export default function CauseListsScreen() {
  const { colors, typography, spacing, radius } = useTheme();

  const today = toISODate(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [items, setItems] = useState<CauseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollCountRef = useRef(0);

  const fetchItems = useCallback(async (date: string) => {
    try {
      const res = await causeListApi.list({ date, page: 0, size: 100 });
      setItems(res?.data?.content ?? []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setItems([]);
    fetchItems(selectedDate);
  }, [selectedDate, fetchItems]);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    pollCountRef.current = 0;
  };

  useEffect(() => () => stopPolling(), []);

  const triggerSync = async () => {
    if (syncState === 'triggering' || syncState === 'polling') return;
    setSyncState('triggering');
    setSyncMessage('Requesting cause list from court...');
    try {
      const { jobId } = await causeListApi.trigger(selectedDate);
      setSyncState('polling');
      setSyncMessage('Fetching from court server...');
      pollCountRef.current = 0;
      pollRef.current = setInterval(async () => {
        pollCountRef.current += 1;
        if (pollCountRef.current > 40) {
          stopPolling();
          setSyncState('failed');
          setSyncMessage('Sync timed out. Try again later.');
          return;
        }
        try {
          const result = await causeListApi.pollTrigger(jobId);
          if (result.status === 'COMPLETED') {
            stopPolling();
            setSyncState('completed');
            const count = result.entriesSaved ?? 0;
            setSyncMessage(`Synced ${count} ${count === 1 ? 'entry' : 'entries'} successfully.`);
            fetchItems(selectedDate);
          } else if (result.status === 'FAILED') {
            stopPolling();
            setSyncState('failed');
            setSyncMessage(result.error ?? 'Sync failed. Please try again.');
          }
        } catch {
          // keep polling
        }
      }, 3000);
    } catch {
      setSyncState('failed');
      setSyncMessage('Could not start sync. Check your connection.');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const dateStrip = getDateStrip(selectedDate);
  const grouped = groupByJudge(items);
  const isSyncing = syncState === 'triggering' || syncState === 'polling';

  const syncBannerColor =
    syncState === 'completed'
      ? colors.success
      : syncState === 'failed'
        ? colors.error
        : colors.kxPrimary[600];

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm }}>
        <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
          Cause Lists
        </Text>
        <Pressable
          onPress={triggerSync}
          disabled={isSyncing}
          accessibilityRole="button"
          accessibilityLabel="Sync cause list from court"
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingVertical: 7,
            paddingHorizontal: spacing.md,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: isSyncing ? colors.ledgerGray[300] : colors.kxPrimary[600],
            backgroundColor: pressed ? colors.kxPrimary[50] : 'transparent',
            opacity: isSyncing ? 0.6 : 1,
          })}
        >
          {isSyncing
            ? <ActivityIndicator size="small" color={colors.kxPrimary[600]} />
            : <Ionicons name="sync-outline" size={15} color={colors.kxPrimary[600]} />
          }
          <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxPrimary[600] }}>
            Sync from Court
          </Text>
        </Pressable>
      </View>

      {/* Date Strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm }}
      >
        {dateStrip.map((dateStr) => {
          const { top, bottom, isToday } = formatDatePill(dateStr);
          const isSelected = dateStr === selectedDate;
          return (
            <Pressable
              key={dateStr}
              onPress={() => setSelectedDate(dateStr)}
              accessibilityRole="button"
              accessibilityLabel={`Select ${dateStr}`}
              style={{
                width: 48,
                paddingVertical: spacing.sm,
                borderRadius: radius.md,
                alignItems: 'center',
                backgroundColor: isSelected ? colors.kxPrimary[600] : colors.kxCardBg,
                borderWidth: 1,
                borderColor: isSelected ? colors.kxPrimary[600] : colors.kxCardBorder,
              }}
            >
              <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, color: isSelected ? colors.onPrimary : colors.kxTextPrimary }}>
                {top}
              </Text>
              <Text style={{ fontSize: typography.fontSize.xs, color: isSelected ? colors.onPrimary : colors.kxTextSecondary, marginTop: 1 }}>
                {bottom}
              </Text>
              {isToday && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: isSelected ? colors.onPrimary : colors.kxPrimary[500], marginTop: 3 }} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Sync Banner */}
      {syncState !== 'idle' && (
        <View style={{ marginHorizontal: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: syncBannerColor + '18', borderWidth: 1, borderColor: syncBannerColor + '40', flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          {isSyncing
            ? <ActivityIndicator size="small" color={syncBannerColor} />
            : <Ionicons name={syncState === 'completed' ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={16} color={syncBannerColor} />
          }
          <Text style={{ flex: 1, fontSize: typography.fontSize.xs, color: syncBannerColor, fontWeight: typography.fontWeight.medium }}>
            {syncMessage}
          </Text>
          {!isSyncing && (
            <Pressable onPress={() => setSyncState('idle')} accessibilityLabel="Dismiss">
              <Ionicons name="close" size={16} color={syncBannerColor} />
            </Pressable>
          )}
        </View>
      )}

      {/* List */}
      {loading ? (
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          {[1, 2, 3, 4].map((i) => <SkeletonLoader key={i} height={72} borderRadius={radius.lg} />)}
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          title="No entries found"
          message="No cause list entries for this date. Try syncing from court."
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchItems(selectedDate); }}
              tintColor={colors.kxPrimary[600]}
            />
          }
        >
          {grouped.map(([judge, judgeItems]) => (
            <View key={judge} style={{ marginBottom: spacing.lg }}>
              {/* Judge section header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.kxCardBorder }} />
                <Text style={{ marginHorizontal: spacing.sm, fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {judge}
                </Text>
                <View style={{ flex: 1, height: 1, backgroundColor: colors.kxCardBorder }} />
              </View>

              {/* Entries */}
              {judgeItems.map((item) => {
                const expanded = expandedIds.has(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => toggleExpand(item.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Case ${item.caseNumber}`}
                    style={({ pressed }) => ({
                      backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
                      borderWidth: 1,
                      borderColor: colors.kxCardBorder,
                      borderRadius: radius.lg,
                      padding: spacing.md,
                      marginBottom: spacing.sm,
                    })}
                  >
                    {/* Row: serial, case info, chevron */}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <Text style={{ width: 28, fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, fontWeight: typography.fontWeight.semibold, marginTop: 2 }}>
                        {item.serialNumber}.
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={expanded ? undefined : 1}>
                          {item.metadata?.petitioner || '—'} vs {item.metadata?.respondent || '—'}
                        </Text>
                        <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
                          {item.caseNumber}
                          {item.metadata?.cl_number ? `  •  CL ${item.metadata.cl_number}` : ''}
                        </Text>
                        {item.hearingType && (
                          <View style={{ marginTop: 4, alignSelf: 'flex-start', backgroundColor: colors.kxPrimary[50], borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxPrimary[700], fontWeight: typography.fontWeight.medium }}>
                              {item.hearingType}
                            </Text>
                          </View>
                        )}
                      </View>
                      <Ionicons
                        name={expanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.ledgerGray[400]}
                        style={{ marginLeft: spacing.sm, marginTop: 2 }}
                      />
                    </View>

                    {/* Expanded detail */}
                    {expanded && (
                      <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.kxCardBorder, gap: spacing.sm }}>
                        {item.metadata?.advocates_petitioner && (
                          <DetailRow label="Petitioner Advocates" value={item.metadata.advocates_petitioner} colors={colors} typography={typography} />
                        )}
                        {item.metadata?.advocates_respondent && (
                          <DetailRow label="Respondent Advocates" value={item.metadata.advocates_respondent} colors={colors} typography={typography} />
                        )}
                        {item.courtHallNo && (
                          <DetailRow label="Court Hall" value={item.courtHallNo} colors={colors} typography={typography} />
                        )}
                        {item.lawyerName && (
                          <DetailRow label="Lawyer" value={item.lawyerName} colors={colors} typography={typography} />
                        )}
                        {item.metadata?.remarks && (
                          <DetailRow label="Remarks" value={item.metadata.remarks} colors={colors} typography={typography} />
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function DetailRow({ label, value, colors, typography }: {
  label: string;
  value: string;
  colors: any;
  typography: any;
}) {
  return (
    <View>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, fontWeight: typography.fontWeight.medium, marginBottom: 1 }}>
        {label}
      </Text>
      <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary }}>
        {value}
      </Text>
    </View>
  );
}
