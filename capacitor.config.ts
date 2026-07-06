import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.my2_0.app',
  appName: 'My2-0',
  webDir:  'dist/sante20/browser',

  server: {
    androidScheme: 'https',
    // Pour le développement avec live reload :
    // url: 'http://192.168.X.X:4200',
    // cleartext: true
  },

  plugins: {
    // ── StatusBar ─────────────────────────────────────────
    StatusBar: {
      // Correspond au thème sombre de l'app
      style: 'DARK',
      backgroundColor: '#0f172a', // dark-bg-primary
    },

    // ── SplashScreen ──────────────────────────────────────
    SplashScreen: {
      launchShowDuration:    2000,
      launchAutoHide:        true,
      backgroundColor:       '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType:      'CENTER_CROP',
      showSpinner:           true,
      androidSpinnerStyle:   'large',
      iosSpinnerStyle:       'small',
      spinnerColor:          '#2563eb',
      splashFullScreen:      true,
      splashImmersive:       true,
    },

    // ── Keyboard ──────────────────────────────────────────
    Keyboard: {
      // Pousse le contenu au-dessus du clavier
      resize: 'body',
      // Empêche le clavier de recouvrir les inputs
      resizeOnFullScreen: true,
    },

    // ── PushNotifications ─────────────────────────────────
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // ── LocalNotifications ────────────────────────────────
    LocalNotifications: {
      smallIcon:    'ic_stat_icon_config_sample',
      iconColor:    '#2563eb',
    },
  },

  // ── Android config ────────────────────────────────────────
  android: {
    // Permet au contenu web de passer derrière la status bar
    // (nécessaire pour les safe areas)
    allowMixedContent: false,
  },

  // ── iOS config ────────────────────────────────────────────
  ios: {
    contentInset: 'automatic',
    // Scroll vers le haut au tap sur la status bar
    scrollEnabled: true,
  },
};

export default config;
