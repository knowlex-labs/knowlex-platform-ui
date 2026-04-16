import { View, Text } from 'react-native';
import type { Case } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Card } from '@/components/ui/Card';

interface CaseOverview {
  documentCount: number;
  judgmentCount: number;
  draftCount: number;
  summaryCount: number;
}

interface CaseInfoTabProps {
  caseData: Case;
  overview: CaseOverview | null;
}

export function CaseInfoTab({ caseData, overview }: CaseInfoTabProps) {
  const { colors, typography, spacing } = useTheme();

  return (
    <View style={{ gap: spacing.xl }}>
      {/* Overview Stats */}
      {overview && (
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <StatCard label="Docs" value={overview.documentCount} colors={colors} typography={typography} />
          <StatCard label="Drafts" value={overview.draftCount} colors={colors} typography={typography} />
          <StatCard label="Judgments" value={overview.judgmentCount} colors={colors} typography={typography} />
          <StatCard label="Summaries" value={overview.summaryCount} colors={colors} typography={typography} />
        </View>
      )}

      {/* Case Details */}
      <Card>
        <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginBottom: spacing.md }}>
          Case Details
        </Text>
        <DetailRow label="Type" value={caseData.caseType ?? '-'} colors={colors} typography={typography} />
        <DetailRow label="Court" value={caseData.courtName ?? '-'} colors={colors} typography={typography} />
        <DetailRow label="Location" value={caseData.courtLocation ?? '-'} colors={colors} typography={typography} />
        <DetailRow label="Judge" value={caseData.judgeName ?? '-'} colors={colors} typography={typography} />
        <DetailRow
          label="Next Hearing"
          value={caseData.nextHearingDate ? new Date(caseData.nextHearingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
          colors={colors}
          typography={typography}
          last
        />
      </Card>
    </View>
  );
}

function StatCard({ label, value, colors, typography }: { label: string; value: number; colors: typeof import('@/theme/tokens').lightColors; typography: typeof import('@/theme/tokens').typography }) {
  return (
    <Card style={{ flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 6 }}>
      <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxPrimary[600] }}>{value}</Text>
      <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 2, textAlign: 'center' }}>{label}</Text>
    </Card>
  );
}

function DetailRow({ label, value, colors, typography, last }: { label: string; value: string; colors: typeof import('@/theme/tokens').lightColors; typography: typeof import('@/theme/tokens').typography; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.kxCardBorder }}>
      <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary }}>{label}</Text>
      <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary, textTransform: 'capitalize', flex: 1, textAlign: 'right', marginLeft: 16 }} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
