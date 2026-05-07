import { useEffect, useState, useCallback } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { clientApi } from '@knowlex/core/api/client-api';
import { mapBackendClient } from '@knowlex/core/mappers';
import type { Client } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterChipBar } from '@/components/ui/FilterChipBar';
import { FAB } from '@/components/ui/FAB';
import { AddClientSheet } from '@/components/clients/AddClientSheet';

const TYPE_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Individual', value: 'INDIVIDUAL' },
  { label: 'Company', value: 'COMPANY' },
] as const;

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

export default function ClientsScreen() {
  const { colors, typography, spacing, radius } = useTheme();
  const router = useRouter();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [showAdd, setShowAdd] = useState(false);

  const fetchClients = useCallback(async () => {
    try {
      const res = await clientApi.getAll({ page: 0, size: 50 });
      const content = res?.data?.content ?? [];
      setClients(content.map(mapBackendClient));
    } catch {
      // keep prior list
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { setLoading(true); fetchClients(); }, [fetchClients]);

  const filtered = clients.filter((c) => {
    const matchesSearch =
      !search.trim() ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search);
    const matchesType =
      !typeFilter ||
      (typeFilter === 'INDIVIDUAL' && c.clientType === 'individual') ||
      (typeFilter === 'COMPANY' && c.clientType === 'company');
    return matchesSearch && matchesType;
  });

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1, backgroundColor: colors.kxSurface }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.xs }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm }}>
          <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary }}>
            Clients
          </Text>
          {!loading && (
            <Text style={{ fontSize: typography.fontSize.sm, color: colors.kxTextSecondary }}>
              ({clients.length})
            </Text>
          )}
        </View>
        <TextInput
          placeholder="Search by name, email or phone..."
          placeholderTextColor={colors.ledgerGray[400]}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search clients"
          style={{
            backgroundColor: colors.kxCardBg,
            borderWidth: 1,
            borderColor: colors.kxCardBorder,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: 8,
            fontSize: typography.fontSize.sm,
            color: colors.kxTextPrimary,
            marginTop: spacing.sm,
          }}
        />
      </View>

      {/* Filters */}
      <View style={{ marginTop: spacing.sm, marginBottom: spacing.xs }}>
        <FilterChipBar filters={TYPE_FILTERS} activeValue={typeFilter} onChange={setTypeFilter} />
      </View>

      {/* List */}
      {loading ? (
        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          {[1, 2, 3, 4, 5].map((i) => <SkeletonLoader key={i} height={76} borderRadius={radius.lg} />)}
        </View>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No clients found"
          message={search ? 'Try a different search term' : 'Add your first client to get started'}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: 100, gap: spacing.sm }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchClients(); }}
              tintColor={colors.kxPrimary[600]}
            />
          }
        >
          {filtered.map((client) => (
            <Pressable
              key={client.id}
              onPress={() => router.push(`/clients/${client.id}` as any)}
              accessibilityRole="button"
              accessibilityLabel={client.name}
              style={({ pressed }) => ({
                backgroundColor: pressed ? colors.ledgerGray[50] : colors.kxCardBg,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.kxCardBorder,
                padding: spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
              })}
            >
              {/* Avatar */}
              <View style={{
                width: 44,
                height: 44,
                borderRadius: radius.full,
                backgroundColor: colors.kxPrimary[100],
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.bold, color: colors.kxPrimary[700] }}>
                  {initials(client.name)}
                </Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.kxTextPrimary, flex: 1 }} numberOfLines={1}>
                    {client.name}
                  </Text>
                  <View style={{
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: radius.sm,
                    backgroundColor: client.clientType === 'company' ? colors.kxAccent[400] + '20' : colors.kxPrimary[50],
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: typography.fontWeight.semibold, color: client.clientType === 'company' ? colors.kxAccent[600] : colors.kxPrimary[700], textTransform: 'uppercase', letterSpacing: 0.4 }}>
                      {client.clientType === 'company' ? 'Company' : 'Individual'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 3 }}>
                  <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }}>
                    {client.caseIds.length} {client.caseIds.length === 1 ? 'case' : 'cases'}
                  </Text>
                  {client.phone && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="call-outline" size={11} color={colors.kxTextSecondary} />
                      <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }} numberOfLines={1}>
                        {client.phone}
                      </Text>
                    </View>
                  )}
                  {!client.phone && client.email && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="mail-outline" size={11} color={colors.kxTextSecondary} />
                      <Text style={{ fontSize: typography.fontSize.xs, color: colors.kxTextSecondary }} numberOfLines={1}>
                        {client.email}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={16} color={colors.ledgerGray[400]} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      <FAB
        icon="+"
        onPress={() => setShowAdd(true)}
        accessibilityLabel="Add new client"
      />

      <AddClientSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={(newClient) => {
          setClients((prev) => [newClient, ...prev]);
        }}
      />
    </SafeAreaView>
  );
}
