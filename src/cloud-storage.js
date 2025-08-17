// Cloud Storage Provider für cf-log
class CloudStorage {
  constructor() {
    this.isCloudMode = false;
    this.supabaseUrl = null;
    this.supabaseKey = null;
    this.currentUser = null;
  }

  // Cloud-Modus aktivieren
  async enableCloudMode(supabaseUrl, supabaseKey) {
    try {
      this.supabaseUrl = supabaseUrl;
      this.supabaseKey = supabaseKey;
      
      // Supabase Client initialisieren
      window.supabaseClient = new window.SupabaseClient(supabaseUrl, supabaseKey);
      
      // Prüfen ob User bereits eingeloggt ist
      this.currentUser = await window.supabaseClient.getCurrentUser();
      
      this.isCloudMode = true;
      console.log('Cloud-Modus aktiviert');
      
      // Realtime Sync aktivieren
      if (this.currentUser) {
        this.enableRealtimeSync();
      }
      
      return true;
    } catch (error) {
      console.error('Fehler beim Aktivieren des Cloud-Modus:', error);
      return false;
    }
  }

  // Cloud-Modus deaktivieren
  disableCloudMode() {
    this.isCloudMode = false;
    this.supabaseUrl = null;
    this.supabaseKey = null;
    this.currentUser = null;
    console.log('Cloud-Modus deaktiviert');
  }

  // Daten speichern
  async saveData(data) {
    if (!this.isCloudMode || !this.currentUser) {
      throw new Error('Cloud-Modus nicht aktiv oder User nicht eingeloggt');
    }

    try {
      // Nutzungslimits prüfen
      await this.checkUsageLimits(data);
      
      // Daten in Cloud speichern
      await this.saveToCloud(data);
      
      // Nutzungsverfolgung aktualisieren
      await this.updateUsageTracking(data);
      
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern in Cloud:', error);
      throw error;
    }
  }

  // Daten laden
  async loadData() {
    if (!this.isCloudMode || !this.currentUser) {
      throw new Error('Cloud-Modus nicht aktiv oder User nicht eingeloggt');
    }

    try {
      return await this.loadFromCloud();
    } catch (error) {
      console.error('Fehler beim Laden aus Cloud:', error);
      throw error;
    }
  }

  // Wrapper für Kompatibilität
  async save(data) {
    return this.saveData(data);
  }

  async load() {
    return this.loadData(data);
  }

  // Daten in Cloud speichern
  async saveToCloud(data) {
    const result = await window.supabaseClient.saveTrainingData(this.currentUser.id, data);
    
    if (result.error) {
      throw new Error('Fehler beim Speichern in Cloud: ' + result.error.message);
    }
    
    console.log('Daten erfolgreich in Cloud gespeichert');
  }

  // Daten aus Cloud laden
  async loadFromCloud() {
    const result = await window.supabaseClient.getTrainingData(this.currentUser.id);
    
    if (result.error) {
      if (result.error.code === 'PGRST116') {
        // Keine Daten vorhanden - Standard-Daten zurückgeben
        console.log('Verwende Standard-Daten aufgrund von Fehler');
        return this.getDefaultDataStructure();
      }
      throw new Error('Fehler beim Laden aus Cloud: ' + result.error.message);
    }
    
    return result.data?.data || this.getDefaultDataStructure();
  }

  // Lokale Speicherung als Fallback
  async saveToLocal(data) {
    localStorage.setItem('cf_log_data', JSON.stringify(data));
  }

  async loadFromLocal() {
    const data = localStorage.getItem('cf_log_data');
    return data ? JSON.parse(data) : this.getDefaultDataStructure();
  }

  // Nutzungslimits prüfen
  async checkUsageLimits(data) {
    if (!window.CLOUD_CONFIG) return;
    
    const plan = await this.loadSubscriptionStatus();
    const limits = window.CLOUD_CONFIG.plans[plan.plan_type || 'free'];
    
    if (!limits) return;
    
    // Anzahl Trainings prüfen
    const trainingCount = data.exercises?.length || 0;
    if (limits.maxTrainingsPerMonth && trainingCount > limits.maxTrainingsPerMonth) {
      throw new Error(`Nutzungslimits überschritten. Bitte upgraden Sie Ihr Abonnement.`);
    }
    
    // Datenmenge prüfen
    const dataSize = JSON.stringify(data).length;
    if (limits.maxDataSize && dataSize > limits.maxDataSize) {
      throw new Error(`Datenmenge überschritten. Bitte upgraden Sie Ihr Abonnement.`);
    }
  }

  // Nutzungsverfolgung aktualisieren
  async updateUsageTracking(data) {
    if (!window.CLOUD_CONFIG) return;
    
    const trainingCount = data.exercises?.length || 0;
    const dataSize = JSON.stringify(data).length;
    
    // Hier könnte die Nutzungsverfolgung in der Datenbank aktualisiert werden
    console.log(`Nutzung aktualisiert: ${trainingCount} Trainings, ${dataSize} Bytes`);
  }

  // Abonnement-Status laden
  async loadSubscriptionStatus() {
    if (!this.currentUser) return { plan_type: 'free' };
    
    const result = await window.supabaseClient.getSubscriptionStatus(this.currentUser.id);
    return result.data || { plan_type: 'free' };
  }

  // Realtime Sync aktivieren
  enableRealtimeSync() {
    if (!this.currentUser) return;
    
    window.supabaseClient.subscribeToTrainingData(this.currentUser.id, (payload) => {
      this.handleRealtimeUpdate(payload);
    });
  }

  // Realtime Update Handler
  handleRealtimeUpdate(payload) {
    console.log('Realtime Update:', payload);
    
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      // UI aktualisieren
      if (window.refreshData) {
        window.refreshData();
      }
    }
  }

  // Daten exportieren
  async exportData(format = 'json') {
    const data = await this.loadData();
    
    switch (format) {
      case 'json':
        return this.exportAsJSON(data);
      case 'csv':
        return this.exportAsCSV(data);
      default:
        throw new Error('Unbekanntes Export-Format');
    }
  }

  exportAsJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `cf-log-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  exportAsCSV(data) {
    // CSV Export implementieren
    console.log('CSV Export:', data);
  }

  // Backup erstellen
  async createBackup() {
    const data = await this.loadData();
    const backup = {
      ...data,
      backup_created: new Date().toISOString(),
      version: '1.0'
    };
    
    return this.exportAsJSON(backup);
  }

  // Sync-Status prüfen
  async checkSyncStatus() {
    if (!this.isCloudMode) return { synced: false, reason: 'Cloud-Modus nicht aktiv' };
    
    try {
      const cloudData = await this.loadFromCloud();
      const localData = await this.loadFromLocal();
      
      const cloudHash = JSON.stringify(cloudData);
      const localHash = JSON.stringify(localData);
      
      return {
        synced: cloudHash === localHash,
        lastSync: new Date().toISOString()
      };
    } catch (error) {
      return { synced: false, reason: error.message };
    }
  }

  // Standard-Datenstruktur
  getDefaultDataStructure() {
    return {
      exercises: this.getDefaultExercises(),
      settings: {
        defaultExercises: ["Bankdrücken", "Kniebeugen", "Klimmzüge"],
        theme: "light"
      },
      user: {
        name: this.currentUser?.email || "Cloud User",
        created: new Date().toISOString()
      }
    };
  }

  // Standard-Übungen
  getDefaultExercises() {
    // Lade Standard-Übungen aus data.js
    if (window.getDefaultExercises) {
      return window.getDefaultExercises();
    }
    
    // Fallback
    return [];
  }
}

// Globale Cloud Storage Instanz
window.cloudStorage = new CloudStorage();
