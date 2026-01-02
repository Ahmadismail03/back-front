import React from 'react';
import { I18nManager, View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabsParamList } from './types';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { HomeScreen } from '../features/home/screens/HomeScreen';
import { ServicesListScreen } from '../features/services/screens/ServicesListScreen';
import { AppointmentsListScreen } from '../features/appointments/screens/AppointmentsListScreen';
import { useThemeColors } from '../shared/theme/useTheme';
import { RequireAuth } from './RequireAuth';
import { HeaderMenuButton } from '../shared/ui/HeaderMenu';
import { HeaderLogo } from '../shared/ui/HeaderLogo';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { useVoiceStore } from '../features/voice/store/useVoiceStore';

const Tab = createBottomTabNavigator<TabsParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function VoiceTabScreen() {
  const setIsOpen = useVoiceStore((s) => s.setIsOpen);

  useFocusEffect(
    React.useCallback(() => {
      setIsOpen(true);
      return undefined;
    }, [setIsOpen])
  );

  return null;
}

export function MainTabs() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const setVoiceOpen = useVoiceStore((s) => s.setIsOpen);

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
          height: 112,
        },
        headerTintColor: colors.headerText,
        headerTitleStyle: {
          fontWeight: '700',
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === 'HomeTab') {
            const homeIconSize = Math.round(size * 1.6);
            const circleSize = homeIconSize + 26;
            const backgroundColor = focused ? colors.primaryLight : 'transparent';
            const shadowStyle = focused
              ? [styles.homeCircleFocused, { shadowColor: colors.primary }]
              : styles.homeCircleUnfocused;

            const name: IoniconName = focused ? 'home' : 'home-outline';
            return (
              <View
                style={[
                  styles.homeCircle,
                  {
                    width: circleSize,
                    height: circleSize,
                    borderRadius: circleSize / 2,
                    backgroundColor,
                  },
                  shadowStyle,
                ]}
              >
                <Ionicons name={name} size={homeIconSize} color={color} />
              </View>
            );
          }

          let name: IoniconName;
          if (route.name === 'ServicesTab') {
            name = 'grid-outline';
          } else if (route.name === 'AppointmentsTab') {
            name = 'calendar-outline';
          } else if (route.name === 'InboxTab') {
            name = focused ? 'mic' : 'mic-outline';
          } else {
            name = 'person-outline';
          }
          return <Ionicons name={name} size={size} color={color} />;
        },
        headerLeft: () =>
          I18nManager.isRTL ? (
            <View style={styles.headerSide}>
              <HeaderMenuButton />
              <HeaderLogo />
            </View>
          ) : null,
        headerRight: () =>
          I18nManager.isRTL ? null : (
            <View style={styles.headerSide}>
              <HeaderLogo />
              <HeaderMenuButton />
            </View>
          ),
      })}
    >
      <Tab.Screen name="ServicesTab" component={ServicesListScreen} options={{ title: t('tabs.services') }} />

      <Tab.Screen name="AppointmentsTab" options={{ title: t('tabs.appointments') }}>
        {(props) => (
          <RequireAuth
            navigation={props.navigation}
            redirect={{ screen: 'MainTabs', params: { screen: 'AppointmentsTab' } }}
            authOpenMode="parentNavigate"
          >
            <AppointmentsListScreen {...props} />
          </RequireAuth>
        )}
      </Tab.Screen>

      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: t('tabs.home'),
        }}
      />

      <Tab.Screen
        name="InboxTab"
        options={{ title: t('tabs.voice') }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            setVoiceOpen(true);
          },
        })}
      >
        {() => <VoiceTabScreen />}
      </Tab.Screen>

      <Tab.Screen name="ProfileTab" options={{ title: t('tabs.profile') }}>
        {(props) => (
          <RequireAuth
            navigation={props.navigation}
            redirect={{ screen: 'MainTabs', params: { screen: 'ProfileTab' } }}
            authOpenMode="parentNavigate"
          >
            <ProfileScreen {...props} />
          </RequireAuth>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  headerSide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  homeCircleFocused: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 3,
    elevation: 3,
  },
  homeCircleUnfocused: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
});
