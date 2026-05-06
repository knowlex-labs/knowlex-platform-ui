import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { clientApi } from '@knowlex/core/api/client-api';
import { mapBackendClient } from '@knowlex/core/mappers';
import type { Client } from '@knowlex/core/types';
import { useTheme } from '@/theme/useTheme';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

type ClientType = 'INDIVIDUAL' | 'COMPANY';

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (client: Client) => void;
}

export function AddClientSheet({ visible, onClose, onCreated }: Props) {
  const { colors, typography, spacing, radius } = useTheme();

  const [name, setName] = useState('');
  const [clientType, setClientType] = useState<ClientType>('INDIVIDUAL');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [nameError, setNameError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName('');
    setClientType('INDIVIDUAL');
    setPhone('');
    setEmail('');
    setAddress('');
    setNameError('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    setNameError('');
    setLoading(true);
    try {
      const res = await clientApi.create({
        name: name.trim(),
        clientType,
        phoneNumber: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
      } as any);
      const client = mapBackendClient(res.data);
      onCreated(client);
      reset();
      onClose();
    } catch {
      Alert.alert('Error', 'Could not create client. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' }}
        onPress={handleClose}
        accessibilityRole="button"
        accessibilityLabel="Close"
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: colors.kxCardBg,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              maxHeight: '90%',
            }}
          >
            {/* Handle bar */}
            <View style={{ alignItems: 'center', paddingTop: spacing.md }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.ledgerGray[300] }} />
            </View>

            <ScrollView
              contentContainerStyle={{ padding: spacing.xl }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Text style={{ fontSize: typography.fontSize.lg, fontWeight: typography.fontWeight.bold, color: colors.kxTextPrimary, marginBottom: spacing.xl }}>
                New Client
              </Text>

              <Input
                label="Name *"
                value={name}
                onChangeText={(v) => { setName(v); if (v.trim()) setNameError(''); }}
                placeholder="Full name or company name"
                error={nameError}
                autoCapitalize="words"
                returnKeyType="next"
              />

              {/* Client Type */}
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.medium, color: colors.kxTextPrimary, marginBottom: spacing.sm }}>
                  Client Type
                </Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  {(['INDIVIDUAL', 'COMPANY'] as ClientType[]).map((type) => {
                    const selected = clientType === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setClientType(type)}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        style={{
                          flex: 1,
                          paddingVertical: 10,
                          borderRadius: radius.md,
                          borderWidth: 1.5,
                          borderColor: selected ? colors.kxPrimary[600] : colors.kxCardBorder,
                          backgroundColor: selected ? colors.kxPrimary[50] : colors.kxCardBg,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: selected ? colors.kxPrimary[700] : colors.kxTextSecondary }}>
                          {type === 'INDIVIDUAL' ? 'Individual' : 'Company'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Input
                label="Phone"
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                keyboardType="phone-pad"
                returnKeyType="next"
              />

              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="client@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
              />

              <Input
                label="Address"
                value={address}
                onChangeText={setAddress}
                placeholder="Office or residential address"
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: 'top' }}
              />

              <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={handleClose}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Create Client"
                  variant="primary"
                  onPress={handleCreate}
                  loading={loading}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
