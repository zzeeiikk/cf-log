// Cloud-Konfiguration Template
// Kopiere diese Datei zu cloud-config.js und fülle deine echten API-Keys ein

window.CLOUD_CONFIG = {
  // Supabase Konfiguration
  supabase: {
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key'
  },
  
  // Feature Flags
  features: {
    realtimeSync: true,
    csvExport: true,
    advancedStats: true,
    autoBackup: true
  },
  
  // Pläne und Limits
  plans: {
    free: {
      maxTrainingsPerMonth: 10,
      maxDataSize: 1024 * 1024, // 1MB
      features: ['basicSync', 'jsonExport']
    },
    pro: {
      maxTrainingsPerMonth: -1, // Unbegrenzt
      maxDataSize: 10 * 1024 * 1024, // 10MB
      features: ['realtimeSync', 'csvExport', 'advancedStats', 'autoBackup']
    }
  },
  
  // UI Konfiguration
  ui: {
    primaryColor: '#8b5cf6', // Purple
    accentColor: '#f59e0b', // Amber
    brandName: 'cf-log Cloud'
  },
  
  // Stripe Konfiguration (für zukünftige Zahlungen)
  stripe: {
    publishableKey: 'your-stripe-publishable-key',
    priceId: 'your-stripe-price-id'
  }
};
