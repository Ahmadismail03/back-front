import React from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { I18nManager, StyleSheet, View } from 'react-native';
import type { RootStackParamList } from './types';
import { MainTabs } from './TabsNavigator';
import { ServiceDetailsScreen } from '../features/services/screens/ServiceDetailsScreen';
import { AuthStartScreen } from '../features/auth/screens/AuthStartScreen';
import { AuthOtpScreen } from '../features/auth/screens/AuthOtpScreen';
import { AuthRegisterScreen } from '../features/auth/screens/AuthRegisterScreen';
import { BookingSelectDateScreen } from '../features/booking/screens/BookingSelectDateScreen';
import { BookingSelectSlotScreen } from '../features/booking/screens/BookingSelectSlotScreen';
import { BookingConfirmScreen } from '../features/booking/screens/BookingConfirmScreen';
import { BookingSuccessScreen } from '../features/booking/screens/BookingSuccessScreen';
import { AppointmentDetailsScreen } from '../features/appointments/screens/AppointmentDetailsScreen';
import { AppointmentCancelConfirmScreen } from '../features/appointments/screens/AppointmentCancelConfirmScreen';
import { AppointmentRescheduleSelectDateScreen } from '../features/appointments/screens/AppointmentRescheduleSelectDateScreen';
import { AppointmentRescheduleSelectSlotScreen } from '../features/appointments/screens/AppointmentRescheduleSelectSlotScreen';
import { AppointmentRescheduleConfirmScreen } from '../features/appointments/screens/AppointmentRescheduleConfirmScreen';
import { HelpCenterScreen } from '../features/help/screens/HelpCenterScreen';
import { HelpTopicDetailsScreen } from '../features/help/screens/HelpTopicDetailsScreen';
import { RequireAuth } from './RequireAuth';
import { useThemeColors } from '../shared/theme/useTheme';
import { HeaderMenuButton } from '../shared/ui/HeaderMenu';
import { HeaderLogo } from '../shared/ui/HeaderLogo';
import { HeaderTitle } from '../shared/ui/HeaderTitle';
import { ContactUsScreen } from '../features/support/screens/ContactUsScreen';
import { TechnicalSupportScreen } from '../features/support/screens/TechnicalSupportScreen';
import { ReportProblemScreen } from '../features/support/screens/ReportProblemScreen';
import { SettingsScreen } from '../features/settings/screens/SettingsScreen';
import { ProfileEditScreen } from '../features/profile/screens/ProfileEditScreen';
import { VoiceAssistantSheet } from '../features/voice/components/VoiceAssistantSheet';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const colors = useThemeColors();

  return (
    <NavigationContainer ref={navigationRef}>
      <View style={styles.root}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: colors.primary,
              height: 112,
            } as any,
            headerTintColor: colors.headerText,
            headerTitleStyle: {
              fontWeight: '700',
              marginTop: 0,
            } as any,
            headerTitle: ({ children }) => (
              <HeaderTitle title={typeof children === 'string' ? children : undefined} />
            ),
            headerLeft: () =>
              I18nManager.isRTL ? (
                <View style={styles.headerRight}>
                  <HeaderMenuButton />
                  <HeaderLogo />
                </View>
              ) : null,
            headerRight: () =>
              I18nManager.isRTL ? null : (
                <View style={styles.headerRight}>
                  <HeaderLogo />
                  <HeaderMenuButton />
                </View>
              ),
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
          <Stack.Screen
            name="ProfileEdit"
            component={ProfileEditScreen}
            options={{
              presentation: 'modal',
              headerTitleStyle: { fontWeight: '700', marginTop: 0 } as any,
            }}
          />
          <Stack.Screen
            name="ContactUs"
            component={ContactUsScreen}
            options={{ headerTitleStyle: { fontWeight: '700', marginTop: 0 } as any }}
          />
          <Stack.Screen
            name="TechnicalSupport"
            component={TechnicalSupportScreen}
            options={{ headerTitleStyle: { fontWeight: '700', marginTop: 0 } as any }}
          />
          <Stack.Screen
            name="ReportProblem"
            component={ReportProblemScreen}
            options={{ headerTitleStyle: { fontWeight: '700', marginTop: 0 } as any }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerTitleStyle: { fontWeight: '700', marginTop: 0 } as any }}
          />

          <Stack.Screen
            name="AuthStart"
            component={AuthStartScreen}
            options={{
              presentation: 'modal',
              headerTitle: () => null,
              headerLeft: () =>
                I18nManager.isRTL ? (
                  <View style={styles.headerRight}>
                    <HeaderMenuButton />
                  </View>
                ) : null,
              headerRight: () =>
                I18nManager.isRTL ? null : (
                  <View style={styles.headerRight}>
                    <HeaderMenuButton />
                  </View>
                ),
            }}
          />
          <Stack.Screen
            name="AuthRegister"
            component={AuthRegisterScreen}
            options={{
              presentation: 'modal',
              headerTitle: () => null,
              headerLeft: () =>
                I18nManager.isRTL ? (
                  <View style={styles.headerRight}>
                    <HeaderMenuButton />
                  </View>
                ) : null,
              headerRight: () =>
                I18nManager.isRTL ? null : (
                  <View style={styles.headerRight}>
                    <HeaderMenuButton />
                  </View>
                ),
            }}
          />
          <Stack.Screen name="AuthOtp" component={AuthOtpScreen} options={{ presentation: 'modal' }} />

          <Stack.Screen name="BookingSelectDate">
            {(props) => (
              <RequireAuth
                navigation={props.navigation}
                redirect={{ screen: 'BookingSelectDate', params: props.route.params }}
              >
                <BookingSelectDateScreen {...props} />
              </RequireAuth>
            )}
          </Stack.Screen>
          <Stack.Screen name="BookingSelectSlot">
            {(props) => (
              <RequireAuth
                navigation={props.navigation}
                redirect={{ screen: 'BookingSelectSlot', params: props.route.params }}
              >
                <BookingSelectSlotScreen {...props} />
              </RequireAuth>
            )}
          </Stack.Screen>
          <Stack.Screen name="BookingConfirm">
            {(props) => (
              <RequireAuth
                navigation={props.navigation}
                redirect={{ screen: 'BookingConfirm', params: props.route.params }}
              >
                <BookingConfirmScreen {...props} />
              </RequireAuth>
            )}
          </Stack.Screen>
          <Stack.Screen
            name="BookingSuccess"
            component={BookingSuccessScreen}
            options={{ headerBackVisible: false, gestureEnabled: false }}
          />

          <Stack.Screen name="AppointmentDetails">
            {(props) => (
              <RequireAuth
                navigation={props.navigation}
                redirect={{ screen: 'AppointmentDetails', params: props.route.params }}
              >
                <AppointmentDetailsScreen {...props} />
              </RequireAuth>
            )}
          </Stack.Screen>

          <Stack.Screen name="AppointmentCancelConfirm" options={{ presentation: 'modal' }}>
            {(props) => (
              <RequireAuth
                navigation={props.navigation}
                redirect={{ screen: 'AppointmentCancelConfirm', params: props.route.params }}
              >
                <AppointmentCancelConfirmScreen {...props} />
              </RequireAuth>
            )}
          </Stack.Screen>
          <Stack.Screen name="AppointmentRescheduleSelectDate">
            {(props) => (
              <RequireAuth
                navigation={props.navigation}
                redirect={{
                  screen: 'AppointmentRescheduleSelectDate',
                  params: props.route.params,
                }}
              >
                <AppointmentRescheduleSelectDateScreen {...props} />
              </RequireAuth>
            )}
          </Stack.Screen>
          <Stack.Screen name="AppointmentRescheduleSelectSlot">
            {(props) => (
              <RequireAuth
                navigation={props.navigation}
                redirect={{
                  screen: 'AppointmentRescheduleSelectSlot',
                  params: props.route.params,
                }}
              >
                <AppointmentRescheduleSelectSlotScreen {...props} />
              </RequireAuth>
            )}
          </Stack.Screen>
          <Stack.Screen name="AppointmentRescheduleConfirm">
            {(props) => (
              <RequireAuth
                navigation={props.navigation}
                redirect={{
                  screen: 'AppointmentRescheduleConfirm',
                  params: props.route.params,
                }}
              >
                <AppointmentRescheduleConfirmScreen {...props} />
              </RequireAuth>
            )}
          </Stack.Screen>

          <Stack.Screen name="HelpCenter" component={HelpCenterScreen} />
          <Stack.Screen name="HelpTopicDetails" component={HelpTopicDetailsScreen} />
        </Stack.Navigator>

        <VoiceAssistantSheet />
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
