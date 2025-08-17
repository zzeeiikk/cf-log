// Cloud Version Konfiguration für cf-log
// Diese Datei enthält alle Einstellungen für die Cloud-Version

const CLOUD_CONFIG = {
  // Supabase Konfiguration
  supabase: {
    // Diese Werte müssen in der Produktion gesetzt werden
    url: null, // 'https://your-project.supabase.co'
    anonKey: null, // 'your-anon-key'
  },

  // Feature Flags
  features: {
    cloudStorage: true,
    realtimeSync: true,
    userProfiles: true,
    subscriptionManagement: true,
    usageTracking: true,
    exportFeatures: true,
    advancedStats: true,
    teamFeatures: false, // Für später
  },

  // Subscription Plans
  plans: {
    free: {
      name: 'Kostenlos',
      price: 0,
      features: {
        maxTrainingsPerMonth: 100,
        maxDataSize: 10 * 1024 * 1024, // 10MB
        basicStats: true,
        exportJSON: true,
        realtimeSync: false,
        advancedStats: false,
        teamFeatures: false,
      }
    },
    pro: {
      name: 'Pro',
      price: 4.99,
      features: {
        maxTrainingsPerMonth: -1, // Unbegrenzt
        maxDataSize: 100 * 1024 * 1024, // 100MB
        basicStats: true,
        exportJSON: true,
        exportCSV: true,
        realtimeSync: true,
        advancedStats: true,
        teamFeatures: false,
      }
    },
    team: {
      name: 'Team',
      price: 9.99,
      features: {
        maxTrainingsPerMonth: -1,
        maxDataSize: 500 * 1024 * 1024, // 500MB
        basicStats: true,
        exportJSON: true,
        exportCSV: true,
        realtimeSync: true,
        advancedStats: true,
        teamFeatures: true,
        maxTeamMembers: 5,
      }
    }
  },

  // Usage Limits
  limits: {
    maxTrainingsPerRequest: 1000,
    maxDataSizePerRequest: 5 * 1024 * 1024, // 5MB
    maxConcurrentConnections: 5,
  },

  // UI Konfiguration
  ui: {
    showCloudFeatures: true,
    showSubscriptionUpgrade: true,
    showUsageStats: true,
    showTeamFeatures: false,
  },

  // Stripe Konfiguration (für später)
  stripe: {
    publishableKey: null, // 'pk_test_...'
    priceIds: {
      pro: null, // 'price_...'
      team: null, // 'price_...'
    }
  }
};

// Hilfsfunktionen
function getCurrentPlan(userSubscription) {
  if (!userSubscription || userSubscription.plan_type === 'free') {
    return CLOUD_CONFIG.plans.free;
  }
  return CLOUD_CONFIG.plans[userSubscription.plan_type] || CLOUD_CONFIG.plans.free;
}

function hasFeature(userSubscription, feature) {
  const plan = getCurrentPlan(userSubscription);
  return plan.features[feature] || false;
}

function checkUsageLimit(userSubscription, currentUsage, limitType) {
  const plan = getCurrentPlan(userSubscription);
  const limit = plan.features[limitType];
  
  if (limit === -1) return true; // Unbegrenzt
  return currentUsage < limit;
}

// Export für globale Verwendung
window.CLOUD_CONFIG = CLOUD_CONFIG;
window.getCurrentPlan = getCurrentPlan;
window.hasFeature = hasFeature;
window.checkUsageLimit = checkUsageLimit;
