// Supabase Client für Cloud-Funktionalität
class SupabaseClient {
  constructor(url, anonKey) {
    this.supabase = supabase.createClient(url, anonKey);
    console.log('Supabase Client initialisiert');
  }

  async init() {
    // Prüfen ob User bereits eingeloggt ist
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async signUp(email, password) {
    const { data, error } = await this.supabase.auth.signUp({
      email: email,
      password: password
    });
    return { data, error };
  }

  async signIn(email, password) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    return { data, error };
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    return { error };
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async saveTrainingData(userId, data) {
    const { data: result, error } = await this.supabase
      .from('training_data')
      .upsert({
        user_id: userId,
        data: data,
        updated_at: new Date().toISOString()
      });
    return { data: result, error };
  }

  async getTrainingData(userId) {
    const { data, error } = await this.supabase
      .from('training_data')
      .select('data')
      .eq('user_id', userId)
      .single();
    return { data, error };
  }

  async saveUserProfile(userId, profile) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        name: profile.name,
        email: profile.email,
        settings: profile.settings || {},
        updated_at: new Date().toISOString()
      });
    return { data, error };
  }

  async getUserProfile(userId) {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  }

  async getSubscriptionStatus(userId) {
    const { data, error } = await this.supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  }

  async subscribeToTrainingData(userId, callback) {
    return this.supabase
      .channel('training_data_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'training_data',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  }
}

// Globale Instanz erstellen
window.SupabaseClient = SupabaseClient;
