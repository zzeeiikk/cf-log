// Supabase Client für cf-log Cloud Version
// Diese Datei wird nur geladen, wenn Cloud-Speicherung aktiviert ist

class SupabaseClient {
  constructor() {
    this.client = null;
    this.isInitialized = false;
  }

  // Initialisiere Supabase Client
  async init(supabaseUrl, supabaseKey) {
    try {
      // Dynamisch Supabase JS Client laden
      const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
      
      this.client = createClient(supabaseUrl, supabaseKey);
      this.isInitialized = true;
      
      console.log('Supabase Client initialisiert');
      return true;
    } catch (error) {
      console.error('Fehler beim Initialisieren von Supabase:', error);
      return false;
    }
  }

  // User Authentication
  async signUp(email, password) {
    if (!this.isInitialized) throw new Error('Supabase nicht initialisiert');
    
    const { data, error } = await this.client.auth.signUp({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  async signIn(email, password) {
    if (!this.isInitialized) throw new Error('Supabase nicht initialisiert');
    
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  }

  async signOut() {
    if (!this.isInitialized) throw new Error('Supabase nicht initialisiert');
    
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser() {
    if (!this.isInitialized) throw new Error('Supabase nicht initialisiert');
    
    const { data: { user } } = await this.client.auth.getUser();
    return user;
  }

  // Trainingsdaten CRUD Operationen
  async saveTrainingData(userId, data) {
    if (!this.isInitialized) throw new Error('Supabase nicht initialisiert');
    
    const { data: result, error } = await this.client
      .from('training_data')
      .upsert({
        user_id: userId,
        data: data,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return result;
  }

  async getTrainingData(userId) {
    if (!this.isInitialized) throw new Error('Supabase nicht initialisiert');
    
    const { data, error } = await this.client
      .from('training_data')
      .select('data')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data?.data || null;
  }

  // User Profile Management
  async saveUserProfile(userId, profile) {
    if (!this.isInitialized) throw new Error('Supabase nicht initialisiert');
    
    const { data, error } = await this.client
      .from('user_profiles')
      .upsert({
        user_id: userId,
        name: profile.name,
        settings: profile.settings,
        created_at: profile.created,
        updated_at: new Date().toISOString()
      });
    
    if (error) throw error;
    return data;
  }

  async getUserProfile(userId) {
    if (!this.isInitialized) throw new Error('Supabase nicht initialisiert');
    
    const { data, error } = await this.client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Subscription Management
  async getSubscriptionStatus(userId) {
    if (!this.isInitialized) throw new Error('Supabase nicht initialisiert');
    
    const { data, error } = await this.client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  // Realtime Subscription für Live-Updates
  subscribeToTrainingData(userId, callback) {
    if (!this.isInitialized) throw new Error('Supabase nicht initialisiert');
    
    return this.client
      .channel('training_data_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'training_data',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
}

// Globale Supabase Instanz
window.supabaseClient = new SupabaseClient();
