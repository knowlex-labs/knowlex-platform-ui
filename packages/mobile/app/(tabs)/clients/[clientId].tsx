import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { clientApi } from '@knowlex/core/api/client-api';
import { mapBackendClient } from '@knowlex/core/mappers';
import type { Client } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Badge } from '@/components/ui/Badge';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { ActionMenu } from '@/components/ui/ActionMenu';
import { EditClientSheet } from '@/components/clients/EditClientSheet';

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export default function ClientDetailScreen() {
  const { clientId } = useLocalSearchParams<{ clientId: string }>();
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const fetchClient = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await clientApi.getById(clientId);
      setClient(mapBackendClient(res.data));
    } catch {
      // keep prior state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => { fetchClient(); }, [fetchClient]);

  const handleDelete = () => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client?.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await clientApi.delete(clientId!);
              router.back();
            } catch {
              Alert.alert('Error', 'Could not delete client. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openPhone = () => {
    if (client?.phone) Linking.openURL(`tel:${client.phone}`);
  };

  const openEmail = () => {
    if (client?.email) Linking.openURL(`mailto:${client.email}`);
  };

  const openWhatsApp = () => {
    if (client?.phone) {
      const digits = client.phone.replace(/\D/g, '');
      Linking.openURL(`https://wa.me/${digits}`);
    }
  };

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Nav bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4, marginRight: spacing.sm })}
        >
          <Ionicons name="arrow-back" size={22} color={colors.kxTextPrimary} />
        </Pressable>
        <Text style={{ flex: 1, fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={1}>
          {loading ? 'Client' : (client?.name ?? 'Client')}
        </Text>
        <Pressable
          onPress={() => setShowMenu(true)}
          accessibilityRole="button"
          accessibilityLabel="More options"
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, padding: 4 })}
        >
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.kxTextPrimary} />
        </Pressable>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
          <SkeletonLoader height={120} borderRadius={radius.xl} />
          <SkeletonLoader height={56} borderRadius={radius.lg} />
          <SkeletonLoader height={200} borderRadius={radius.lg} />
        </View>
      ) : !client ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: colors.kxTextSecondary }}>Client not found.</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchClient(); }}
              tintColor={colors.kxPrimary[600]}
            />
          }
        >
          {/* Profile card */}
          <View style={{ alignItems: 'center', paddingVertical: spacing['2xl'] }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: radius.full,
              backgroundColor: colors.kxPrimary[100],
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: spacing.md,
            }}>
              <Text style={{ fontSize: typography.fontSize['2xl'], fontWeight: typography.fontWeight.bold, color: colors.kxPrimary[700] }}>
                {initials(client.name)}
              </Text>
            </View>
            <Text style={{ fontSize: typography.fontSize.xl, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, textAlign: 'center' }}>
              {client.name}
            </Text>
            <View style={{
              marginTop: spacing.sm,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: radius.full,
              backgroundColor: client.clientType === 'company' ? colors.kxAccent[400] + '20' : colors.kxPrimary[50],
            }}>
              <Text style={{ fontSize: typography.fontSize.xs, fontWeight: typography.fontWeight.semibold, color: client.clientType === 'company' ? colors.kxAccent[600] : colors.kxPrimary[700], textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {client.clientType === 'company' ? 'Company' : 'Individual'}
              </Text>
            </View>
          </View>

          {/* Contact buttons */}
          {(client.phone || client.email) && (
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xl }}>
              {client.phone && (
                <>
                  <ContactButton icon="call-outline" label="Call" onPress={openPhone} colors={colors} typography={typography} radius={radius} />
                  <ContactButton icon="logo-whatsapp" label="WhatsApp" onPress={openWhatsApp} colors={colors} typography={typography} radius={radius} />
                </>
              )}
              {client.email && (
                <ContactButton icon="mail-outline" label="Email" onPress={openEmail} colors={colors} typography={typography} radius={radius} />
              )}
            </View>
          )}

          {/* Contact details */}
          {(client.phone || client.email || client.address) && (
            <View style={{ backgroundColor: colors.kxCardBg, borderWidth: 1, borderColor: colors.kxCardBorder, borderRadius: radius.lg, marginBottom: spacing.xl, overflow: 'hidden' }}>
              {client.phone && (
                <DetailItem icon="call-outline" label="Phone" value={client.phone} colors={colors} typography={typography} spacing={spacing} />
              )}
              {client.email && (
                <DetailItem icon="mail-outline" label="Email" value={client.email} colors={colors} typography={typography} spacing={spacing} divider={!!client.phone} />
              )}
              {client.address && (
                <DetailItem icon="location-outline" label="Address" value={client.address} colors={colors} typography={typography} spacing={spacing} divider={!!(client.phone || client.email)} />
              )}
            </View>
          )}

          {/* Linked cases */}
          <Text style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, marginBottom: spacing.md }}>
            Linked Cases ({client.caseSummaries.length})
          </Text>

          {client.caseSummaries.length === 0 ? (
            <View style={{ backgroundColor: colors.kxCardBg, borderWidth: 1, borderColor: colors.kxCardBorder, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' }}>
              <Text style={{ color: colors.kxTextSecondary, fontSize: typography.fontSize.sm }}>No cases linked to this client</Text>
            </View>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {client.caseSummaries.map((cs) => (
                <Pressable
                  key={cs.caseId}
                  onPress={() => router.push(`/cases/${cs.caseId}` as any)}
                  accessibilityRole="button"
                  accessibilityLabel={cs.caseTitle ?? 'Case'}
                  style={({ pressed }) => ({
                    backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
                    borderWidth: 1,
                    borderColor: colors.kxCardBorder,
                    borderRadius: radius.lg,
                    padding: spacing.md,
                    flexDirection: 'row',
                    alignItems: 'center',
                  })}
                >
                  <View style={{ flex: 1, marginRight: spacing.sm }}>
                    <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary }} numberOfLines={1}>
                      {cs.caseTitle || 'Untitled Case'}
                    </Text>
                    {cs.caseNumber && (
                      <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }}>
                        {cs.caseNumber}
                      </Text>
                    )}
                    {cs.courtName && (
                      <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginTop: 1 }} numberOfLines={1}>
                        {cs.courtName}
                      </Text>
                    )}
                  </View>
                  <Badge label={cs.caseStatus ?? 'unknown'} status={cs.caseStatus as any} />
                  <Ionicons name="chevron-forward" size={16} color={colors.ledgerGray[400]} style={{ marginLeft: spacing.sm }} />
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <ActionMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        title={client?.name}
        items={[
          { label: 'Edit Client', icon: '✏️', onPress: () => setShowEdit(true) },
          { label: 'Delete Client', icon: '🗑️', destructive: true, onPress: handleDelete },
        ]}
      />

      <EditClientSheet
        visible={showEdit}
        client={client}
        onClose={() => setShowEdit(false)}
        onUpdated={(updated) => setClient(updated)}
      />
    </SafeAreaView>
  );
}

function ContactButton({ icon, label, onPress, colors, typography, radius }: {
  icon: any;
  label: string;
  onPress: () => void;
  colors: any;
  typography: any;
  radius: any;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.kxCardBorder,
        backgroundColor: pressed ? colors.kxPrimary[50] : colors.kxCardBg,
        gap: 4,
      })}
    >
      <Ionicons name={icon} size={20} color={colors.kxPrimary[600]} />
      <Text style={{ fontSize: 11, fontWeight: typography.fontWeight.medium, color: colors.kxPrimary[600] }}>
        {label}
      </Text>
    </Pressable>
  );
}

function DetailItem({ icon, label, value, colors, typography, spacing, divider }: {
  icon: any;
  label: string;
  value: string;
  colors: any;
  typography: any;
  spacing: any;
  divider?: boolean;
}) {
  return (
    <View>
      {divider && <View style={{ height: 1, backgroundColor: colors.kxCardBorder }} />}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md, gap: spacing.md }}>
        <Ionicons name={icon} size={18} color={colors.kxTextSecondary} style={{ marginTop: 1 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary, marginBottom: 2 }}>{label}</Text>
          <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextPrimary }}>{value}</Text>
        </View>
      </View>
    </View>
  );
}
