// AdMob configuration for KEMET AI.
// Note: AdMob is a native Android/iOS SDK — it does NOT render on the web.
// The wrappers below no-op on the web. When the PWA is wrapped with
// Capacitor, install @capacitor-community/admob and rewire the wrappers
// to call the plugin. IDs are stored here (config-only) so the Capacitor
// build picks them up automatically.

export const ADMOB_APP_ID = "ca-app-pub-2412257074620050~0000000000"; // set the real App ID at Capacitor build time

export const ADMOB_UNITS = {
  interstitial: "ca-app-pub-2412257074620050/8757752566",
  banner: "ca-app-pub-2412257074620050/3278883535",
  rewarded: "ca-app-pub-2412257074620050/1733747432",
} as const;

export type AdUnit = keyof typeof ADMOB_UNITS;

function isNativeCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  // Capacitor exposes window.Capacitor with isNativePlatform()
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return !!cap?.isNativePlatform?.();
}

export async function initAdMob(): Promise<void> {
  if (!isNativeCapacitor()) return;
  // On Capacitor build, uncomment:
  // const { AdMob } = await import("@capacitor-community/admob");
  // await AdMob.initialize({ requestTrackingAuthorization: true, initializeForTesting: false });
}

export async function showBanner(): Promise<void> {
  if (!isNativeCapacitor()) return;
  // const { AdMob, BannerAdPosition, BannerAdSize } = await import("@capacitor-community/admob");
  // await AdMob.showBanner({ adId: ADMOB_UNITS.banner, adSize: BannerAdSize.ADAPTIVE_BANNER, position: BannerAdPosition.BOTTOM_CENTER, margin: 0 });
}

export async function hideBanner(): Promise<void> {
  if (!isNativeCapacitor()) return;
  // const { AdMob } = await import("@capacitor-community/admob");
  // await AdMob.hideBanner();
}

export async function showInterstitial(): Promise<void> {
  if (!isNativeCapacitor()) return;
  // const { AdMob } = await import("@capacitor-community/admob");
  // await AdMob.prepareInterstitial({ adId: ADMOB_UNITS.interstitial });
  // await AdMob.showInterstitial();
}

export async function showRewarded(): Promise<boolean> {
  if (!isNativeCapacitor()) return false;
  // const { AdMob } = await import("@capacitor-community/admob");
  // await AdMob.prepareRewardVideoAd({ adId: ADMOB_UNITS.rewarded });
  // const result = await AdMob.showRewardVideoAd();
  // return !!result;
  return false;
}