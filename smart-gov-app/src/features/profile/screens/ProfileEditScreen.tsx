import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, Alert, Image, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';
import { TextField } from '../../../shared/ui/TextField';
import { Button } from '../../../shared/ui/Button';
import { useThemeColors } from '../../../shared/theme/useTheme';
import { borderRadius, iconSizes, spacing, typography } from '../../../shared/theme/tokens';
import { useProfileStore } from '../store/useProfileStore';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileEdit'>;

export function ProfileEditScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const user = useAuthStore((s) => s.user);

  const fullName = useProfileStore((s) => s.fullName);
  const setFullName = useProfileStore((s) => s.setFullName);
  const photoUri = useProfileStore((s) => s.photoUri);
  const setPhotoUri = useProfileStore((s) => s.setPhotoUri);

  const nationalId = user?.nationalId ?? '—';
  const phoneNumber = user?.phoneNumber ?? '—';

  const onPickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('profile.photoPermissionTitle'), t('profile.photoPermissionMessage'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled) return;
      const uri = result.assets?.[0]?.uri;
      if (!uri) return;
      await setPhotoUri(uri);
    } catch {
      Alert.alert(t('common.errorTitle'));
    }
  };

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        headerCard: {
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: spacing.lg,
          marginBottom: spacing.lg,
        },
        avatar: {
          width: 72,
          height: 72,
          borderRadius: borderRadius.full,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImage: {
          width: 72,
          height: 72,
        },
        headerMeta: {
          flex: 1,
          gap: spacing.xs,
        },
        headerTitle: {
          fontSize: typography.lg,
          fontWeight: typography.semibold,
          color: colors.text,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        headerSub: {
          fontSize: typography.sm,
          color: colors.textSecondary,
          textAlign: I18nManager.isRTL ? 'right' : 'left',
        },
        changePhoto: {
          marginTop: spacing.sm,
          alignSelf: I18nManager.isRTL ? 'flex-end' : 'flex-start',
        },
        sectionTitle: {
          fontSize: typography.base,
          fontWeight: typography.semibold,
          color: colors.text,
          marginBottom: spacing.sm,
        },
        card: {
          backgroundColor: colors.cardBackground,
          borderWidth: 1,
          borderColor: colors.cardBorder,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          gap: spacing.md,
          marginBottom: spacing.lg,
        },
        row: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: spacing.md,
          paddingVertical: spacing.sm,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderLight,
        },
        rowLast: {
          borderBottomWidth: 0,
          paddingBottom: 0,
        },
        label: {
          fontSize: typography.sm,
          color: colors.textSecondary,
        },
        value: {
          fontSize: typography.base,
          color: colors.text,
          fontWeight: typography.medium,
        },
        actionsRow: {
          flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
          gap: spacing.sm,
          marginTop: spacing.md,
        },
        flex1: {
          flex: 1,
        },
      }),
    [colors]
  );

  return (
    <Screen scroll>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person-outline" size={iconSizes.xl} color={colors.textTertiary} />
          )}
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {fullName || t('profile.nameFallback')}
          </Text>
          <Text style={styles.headerSub} numberOfLines={1}>
            {phoneNumber !== '—' ? phoneNumber : nationalId}
          </Text>

          <View style={styles.changePhoto}>
            <Button title={t('profile.changePhoto')} variant="secondary" onPress={onPickPhoto} />
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>

        <TextField
          label={t('profile.fullName')}
          value={fullName}
          onChangeText={(v) => void setFullName(v)}
          placeholder={t('profile.fullNamePlaceholder')}
        />

        <View style={styles.row}>
          <Text style={styles.label}>{t('profile.phoneNumber')}</Text>
          <Text style={styles.value}>{phoneNumber}</Text>
        </View>
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>{t('profile.nationalId')}</Text>
          <Text style={styles.value}>{nationalId}</Text>
        </View>

        <View style={styles.actionsRow}>
          <View style={styles.flex1}>
            <Button
              title={t('common.cancel')}
              variant="secondary"
              onPress={() => navigation.goBack()}
            />
          </View>
          <View style={styles.flex1}>
            <Button
              title={t('common.save')}
              variant="primary"
              onPress={() => navigation.goBack()}
            />
          </View>
        </View>
      </View>
    </Screen>
  );
}


