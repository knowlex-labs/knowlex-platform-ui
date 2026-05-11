import { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { causeListApi } from '@knowlex/core/api/cause-list-api';
import type { CauseListItem } from '@knowlex/core/types';
import { formatJudgeName } from '@knowlex/core/utils';
import { useTheme } from '@/theme/useTheme';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';

type SyncState = 'idle' | 'triggering' | 'polling' | 'completed' | 'failed';

interface SubGroup {
  hearingType: string;
  hearingCategory: string;
  items: CauseListItem[];
}

interface JudgeGroup {
  judgeName: string;
  benchType: string | null;
  courtHallNo: string | null;
  date: string;
  subGroups: SubGroup[];
}

const toISODate = (d: Date) => d.toISOString().slice(0, 10);

function formatDatePill(dateStr: string): { top: string; bottom: string; isToday: boolean } {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    top: d.toLocaleDateString('en-IN', { day: 'numeric' }),
    bottom: d.toLocaleDateString('en-IN', { month: 'short' }),
    isToday: dateStr === toISODate(new Date()),
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

// Backend joins judge + bench-type with a tab in `judgeName`. Web parses them
// apart; mobile used to render the raw key (with the embedded \t) — strip it.
function parseJudgeName(raw: string): { judgeName: string; benchType: string | null } {
  const parts = raw.split('\t');
  return {
    judgeName: parts[0]?.trim() || raw,
    benchType: parts[1]?.trim() || null,
  };
}

// Mirror web `cause-list-table.tsx::groupByJudge`: group by judge, then
// sub-group by hearingType + hearingCategory so the user sees the same
// per-hearing-type dividers as on the web.
function groupItems(items: CauseListItem[]): JudgeGroup[] {
  const byJudge = new Map<string, CauseListItem[]>();
  for (const item of items) {
    const key = item.judgeName ?? 'Unknown Judge';
    if (!byJudge.has(key)) byJudge.set(key, []);
    byJudge.get(key)!.push(item);
  }

  const groups: JudgeGroup[] = [];
  for (const [rawJudge, groupItems] of byJudge) {
    const { judgeName, benchType } = parseJudgeName(rawJudge);

    const subMap = new Map<string, CauseListItem[]>();
    for (const item of groupItems) {
      const subKey = `${item.hearingType}|||${item.metadata?.hearing_category ?? ''}`;
      if (!subMap.has(subKey)) subMap.set(subKey, []);
      subMap.get(subKey)!.push(item);
    }

    const subGroups: SubGroup[] = [];
    for (const [subKey, subItems] of subMap) {
      const [hearingType, hearingCategory] = subKey.split('|||');
      subItems.sort((a, b) => a.serialNumber - b.serialNumber);
      subGroups.push({ hearingType, hearingCategory, items: subItems });
    }

    groups.push({
      judgeName,
      benchType,
      courtHallNo: groupItems[0]?.courtHallNo ?? groupItems[0]?.metadata?.court_hall_no ?? null,
      date: groupItems[0]?.causeListDate ?? '',
      subGroups,
    });
  }

  return groups.sort((a, b) => a.judgeName.localeCompare(b.judgeName));
}

function splitLines(value: string | null | undefined): string[] {
  return value ? value.split('\n').map((s) => s.trim()).filter(Boolean) : [];
}

export function ScheduleView() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();
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
  const grouped = groupItems(items);
  const isSyncing = syncState === 'triggering' || syncState === 'polling';
  const syncBannerColor =
    syncState === 'completed' ? colors.success
      : syncState === 'failed' ? colors.error
      : colors.kxPrimary[600];

  return (
    <View style={{ flex: 1 }}>
      {/* Sync action */}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.xs, paddingBottom: spacing.sm }}>
        <Pressable
          onPress={triggerSync}
          disabled={isSyncing}
          accessibilityRole="button"
          accessibilityLabel="Sync cause list from court"
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingVertical: 7, paddingHorizontal: spacing.md,
            borderRadius: radius.md,
            borderWidth: 1, borderColor: isSyncing ? colors.ledgerGray[300] : colors.kxPrimary[600],
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

      {/* Date strip */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingBottom: spacing.sm, alignItems: 'flex-start' }}
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
                width: 48, paddingVertical: spacing.sm, borderRadius: radius.md, alignItems: 'center',
                backgroundColor: isSelected ? colors.kxPrimary[600] : colors.kxCardBg,
                borderWidth: 1, borderColor: isSelected ? colors.kxPrimary[600] : colors.kxCardBorder,
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

      {/* Sync banner */}
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
        <EmptyState title="No entries found" message="No cause list entries for this date. Try syncing from court." />
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
          {grouped.map((group, gi) => (
            <View key={gi} style={{ marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.kxCardBorder, borderRadius: radius.lg, overflow: 'hidden' }}>
              {/* Judge header */}
              <View style={{ backgroundColor: colors.kxPrimary[50], paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder }}>
                <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.kxPrimary[800], fontFamily: typography.fontFamily.serif }}>
                  Before {formatJudgeName(group.judgeName)}
                </Text>
                {group.benchType && (
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxPrimary[600], fontWeight: typography.fontWeight.medium, marginTop: 1 }}>
                    {group.benchType}
                  </Text>
                )}
                {group.courtHallNo && (
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2 }}>
                    Court Hall {group.courtHallNo}
                  </Text>
                )}
              </View>

              {/* Sub-groups by hearing type + category */}
              {group.subGroups.map((sub, si) => (
                <View key={si}>
                  <View style={{ backgroundColor: colors.ledgerGray[50], paddingHorizontal: spacing.md, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder, alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, fontWeight: typography.fontWeight.bold, color: colors.kxTextSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>
                      — {sub.hearingType || 'General'} —
                    </Text>
                    {sub.hearingCategory && sub.hearingCategory !== 'undefined' && (
                      <Text style={{ fontSize: 10, color: colors.ledgerGray[400], marginTop: 1 }}>
                        {sub.hearingCategory}
                      </Text>
                    )}
                  </View>

                  {sub.items.map((item) => {
                    const expanded = expandedIds.has(item.id);
                    const petAdvocates = splitLines(item.metadata?.advocates_petitioner);
                    const resAdvocates = splitLines(item.metadata?.advocates_respondent);
                    return (
                      <Pressable
                        key={item.id}
                        onPress={() => toggleExpand(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={`Case ${item.caseNumber}`}
                        style={({ pressed }) => ({
                          backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
                          borderBottomWidth: 1, borderBottomColor: colors.kxCardBorder,
                          padding: spacing.md,
                        })}
                      >
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
                            {!expanded && petAdvocates.length > 0 && (
                              <Text style={{ fontSize: typography.fontSize.xs, color: colors.ledgerGray[500], marginTop: 2 }} numberOfLines={1}>
                                {petAdvocates[0]}{petAdvocates.length > 1 ? `  +${petAdvocates.length - 1} more` : ''}
                              </Text>
                            )}
                          </View>
                          <Ionicons
                            name={expanded ? 'chevron-up' : 'chevron-down'}
                            size={16} color={colors.ledgerGray[400]}
                            style={{ marginLeft: spacing.sm, marginTop: 2 }}
                          />
                        </View>

                        {expanded && (
                          <View style={{ marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.kxCardBorder, gap: spacing.sm }}>
                            <AdvocateList label="Advocates (Petitioner)" items={petAdvocates} colors={colors} typography={typography} />
                            <AdvocateList label="Advocates (Respondent)" items={resAdvocates} colors={colors} typography={typography} />
                            {item.metadata?.remarks && (
                              <DetailRow label="Remarks" value={item.metadata.remarks} colors={colors} typography={typography} />
                            )}
                            {item.lawyerName && (
                              <DetailRow label="Lawyer" value={item.lawyerName} colors={colors} typography={typography} />
                            )}
                            {item.bench && (
                              <DetailRow label="Bench" value={item.bench} colors={colors} typography={typography} />
                            )}
                            {item.caseId && (
                              <Pressable
                                onPress={() => router.push(`/cases/${item.caseId}` as any)}
                                accessibilityRole="button"
                                accessibilityLabel="View Case"
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.kxCardBorder }}
                              >
                                <Ionicons name="folder-open-outline" size={14} color={colors.kxPrimary[700]} />
                                <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxPrimary[700] }}>
                                  View Case Documents
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function DetailRow({ label, value, colors, typography }: {
  label: string; value: string; colors: any; typography: any;
}) {
  return (
    <View>
      <Text style={{ fontSize: 10, color: colors.kxTextSecondary, fontWeight: typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
        {label}
      </Text>
      <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary }}>
        {value}
      </Text>
    </View>
  );
}

function AdvocateList({ label, items, colors, typography }: {
  label: string; items: string[]; colors: any; typography: any;
}) {
  return (
    <View>
      <Text style={{ fontSize: 10, color: colors.kxTextSecondary, fontWeight: typography.fontWeight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>
        {label}
      </Text>
      {items.length === 0 ? (
        <Text style={{ fontSize: typography.fontSize.sm, color: colors.ledgerGray[400] }}>None listed</Text>
      ) : (
        items.map((adv, i) => (
          <Text key={i} style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary }}>
            {adv}
          </Text>
        ))
      )}
    </View>
  );
}
