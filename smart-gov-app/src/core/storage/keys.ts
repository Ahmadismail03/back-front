export const StorageKeys = {
  authToken: 'auth.token',
  authUser: 'auth.user',
  authRegisteredUsers: 'auth.registeredUsers',
  authTrustedNationalIds: 'auth.trustedNationalIds',
  language: 'prefs.language',
  reminderPreference: 'prefs.reminderPreference',
  themeMode: 'prefs.themeMode',

  profileFullName: 'profile.fullName',
  profilePhotoUri: 'profile.photoUri',
  profileDetails: 'profile.details',
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];
