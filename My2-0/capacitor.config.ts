import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.my2_0.app',
  appName: 'sante20',
  webDir: 'dist/sante20/browser',
  server: {
      androidScheme: 'https',
      // On ne met PAS de propriété 'url' ici pour la prod/mobile
    }
};

export default config;
