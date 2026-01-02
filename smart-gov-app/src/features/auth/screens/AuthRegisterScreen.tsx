import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../navigation/types';
import { Screen } from '../../../shared/ui/Screen';

type Props = NativeStackScreenProps<RootStackParamList, 'AuthRegister'>;

export function AuthRegisterScreen({ navigation }: Props) {
  useEffect(() => {
    // Registration is handled by the single smart auth screen now.
    navigation.replace('AuthStart', {} as any);
  }, [navigation]);

  return (
    <Screen>
      <View style={styles.container} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
