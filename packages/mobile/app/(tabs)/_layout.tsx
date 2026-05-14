import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.kxCardBg,
          borderTopWidth: 1,
          borderTopColor: colors.kxCardBorder,
          paddingTop: 4,
          paddingBottom: insets.bottom || 4,
          height: 42 + (insets.bottom || 4),
        },
        tabBarActiveTintColor: colors.kxPrimary[600],
        tabBarInactiveTintColor: colors.ledgerGray[400],
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: -2 },
      }}
      screenListeners={{
        tabPress: () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="cases"
        options={{ title: 'Cases', tabBarIcon: ({ color }) => <Ionicons name="briefcase-outline" size={20} color={color} />, popToTopOnBlur: true }}
      />
      <Tabs.Screen
        name="drafting"
        options={{ title: 'Drafting', tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="translate"
        options={{ title: 'Translate', tabBarIcon: ({ color }) => <Ionicons name="globe-outline" size={20} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={20} color={color} /> }}
      />
      <Tabs.Screen name="cause-lists" options={{ href: null, title: 'Cause Lists', tabBarIcon: ({ color }) => <Ionicons name="calendar-outline" size={20} color={color} /> }} />
      <Tabs.Screen name="clients" options={{ href: null, title: 'Clients', tabBarIcon: ({ color }) => <Ionicons name="people-outline" size={20} color={color} /> }} />
      <Tabs.Screen name="documents" options={{ href: null, title: 'Documents', tabBarIcon: ({ color }) => <Ionicons name="folder-outline" size={20} color={color} /> }} />
      <Tabs.Screen name="viewer" options={{ href: null, title: 'Viewer', tabBarIcon: ({ color }) => <Ionicons name="eye-outline" size={20} color={color} /> }} />
    </Tabs>
  );
}
