import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';
import { ScheduleView } from '@/components/cases/ScheduleView';

export default function CauseListsScreen() {
  const { colors, typography, spacing } = useTheme();
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs }}>
        <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, fontFamily: typography.fontFamily.serif }}>
          Cause Lists
        </Text>
      </View>
      <ScheduleView />
    </SafeAreaView>
  );
}
