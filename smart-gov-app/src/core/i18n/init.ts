import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Alert, I18nManager } from 'react-native';
import * as Updates from 'expo-updates';
import { StorageKeys } from '../storage/keys';
import { getSecureItem, setSecureItem } from '../storage/secureStorage';
import { ar } from './resources/ar';
import { en } from './resources/en';
import { useLanguageChangeStore } from './store/useLanguageChangeStore';

export type SupportedLanguage = 'en' | 'ar';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
} as const;

function shouldUseRtl(language: SupportedLanguage): boolean {
  // Arabic uses RTL, English uses LTR
  return language === 'ar';
}

function ensureI18nInitialized(): void {
  if (i18n.isInitialized) return;

  // Initialize synchronously (fire-and-forget) so `useTranslation()` always has an instance.
  // Language + RTL direction is finalized in `initI18n()`.
  i18n.use(initReactI18next);
  void i18n.init({
    compatibilityJSON: 'v4',
    resources: resources as any,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

ensureI18nInitialized();

export async function initI18n(): Promise<void> {
  ensureI18nInitialized();

  const saved = (await getSecureItem(StorageKeys.language)) as SupportedLanguage | null;
  const language: SupportedLanguage = saved ?? (I18nManager.isRTL ? 'ar' : 'en');

  if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  }

  const wantRtl = shouldUseRtl(language);
  const currentRtl = I18nManager.isRTL;
  
  console.log(`[i18n] Init: Language: ${language}, Current RTL: ${currentRtl}, Want RTL: ${wantRtl}`);
  
  if (currentRtl !== wantRtl) {
    console.log(`[i18n] RTL mismatch, applying fix...`);
    
    // Enable RTL support first
    I18nManager.allowRTL(true);
    // Force RTL direction (true for Arabic, false for English/LTR)
    I18nManager.forceRTL(wantRtl);
    
    console.log(`[i18n] After forceRTL: I18nManager.isRTL = ${I18nManager.isRTL}`);

    // Best-effort persistence + reload. Never block app boot on reload (dev builds can throw).
    try {
      await setSecureItem(StorageKeys.language, language);
    } catch {
      // ignore
    }

    try {
      const canReload = (Updates as any).isEnabled ?? true;
      if (canReload) {
        // Small delay to ensure everything is initialized
        setTimeout(() => {
          Updates.reloadAsync().catch(() => {
            // ignore - dev builds might not support this
          });
        }, 200);
      }
    } catch {
      // ignore
    }
    return;
  }
}

export async function setAppLanguage(
  language: SupportedLanguage
): Promise<{ requiresRestart: boolean }> {
  ensureI18nInitialized();

  const wantRtl = shouldUseRtl(language);
  const currentRtl = I18nManager.isRTL;
  const requiresRestart = currentRtl !== wantRtl;

  console.log(`[i18n] Language change requested: ${language}`);
  console.log(`[i18n] Current RTL: ${currentRtl}, Want RTL: ${wantRtl}, Requires restart: ${requiresRestart}`);

  // Mark that language is changing (to show Launch Screen)
  useLanguageChangeStore.getState().setIsChanging(true);

  // Save language first
  await setSecureItem(StorageKeys.language, language);
  await i18n.changeLanguage(language);

  // Always apply RTL/LTR changes when language changes
  // This MUST be done before reload and MUST happen for all language changes
  console.log(`[i18n] Applying RTL change: ${currentRtl} -> ${wantRtl}`);
  
  // Enable RTL support first (must be called before forceRTL)
  I18nManager.allowRTL(true);
  
  // Force RTL direction - ALWAYS call this, even if direction doesn't change
  // true = RTL (Arabic), false = LTR (English)
  // IMPORTANT: forceRTL() must be called BEFORE reload, and the app MUST reload for it to take effect
  I18nManager.forceRTL(wantRtl);
  
  // Verify the change was applied (note: this may not reflect the actual state until after reload)
  console.log(`[i18n] After forceRTL: I18nManager.isRTL = ${I18nManager.isRTL}, Expected: ${wantRtl}`);
  
  // Double-check: if we're switching to English (LTR), ensure forceRTL(false) was called
  if (language === 'en' && wantRtl === false) {
    console.log(`[i18n] Switching to English (LTR) - forceRTL(false) called`);
  } else if (language === 'ar' && wantRtl === true) {
    console.log(`[i18n] Switching to Arabic (RTL) - forceRTL(true) called`);
  }
  
  // Always reload when language changes to ensure RTL/LTR is applied correctly
  // This is the same reload behavior as when the app first opens
  // The Launch Screen will be shown during reload
  try {
    // Small delay to ensure state is saved and Launch Screen is shown
    setTimeout(async () => {
      try {
        console.log('[i18n] Attempting to reload app...');
        // Reload the app - this will trigger the Launch Screen automatically
        // This is CRITICAL: I18nManager.forceRTL() requires a full app reload to take effect
        await Updates.reloadAsync();
      } catch (e: any) {
        // If Updates.reloadAsync() fails, try alternative methods
        console.warn('[i18n] Updates.reloadAsync() failed:', e?.message || e);
        
        // Reset the changing state if reload fails
        useLanguageChangeStore.getState().setIsChanging(false);
        
        // In development, we might need to use a different approach
        if (__DEV__) {
          // Try to trigger a reload via the global reload function if available
          if (typeof (global as any).reload === 'function') {
            (global as any).reload();
          } else {
            // Last resort: show alert
            Alert.alert(
              'Language Change',
              'Please restart the app manually (close and reopen) to see the language change.'
            );
          }
        } else {
          // In production, Updates.reloadAsync() should work
          // If it doesn't, there's a configuration issue
          console.error('[i18n] Failed to reload app in production mode');
          Alert.alert(
            'Language Change',
            'Please restart the app manually to see the language change.'
          );
        }
      }
    }, 1000);
  } catch (e: any) {
    console.error('[i18n] Failed to schedule reload:', e?.message || e);
    useLanguageChangeStore.getState().setIsChanging(false);
  }

  return { requiresRestart };
}

export function getCurrentLanguage(): SupportedLanguage {
  ensureI18nInitialized();
  const lng = i18n.language as SupportedLanguage | undefined;
  return lng === 'ar' ? 'ar' : 'en';
}

export default i18n;
