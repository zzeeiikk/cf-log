// Cloud Storage Integration für cf-log
// Erweitert die bestehende Storage-API um Cloud-Funktionalität

class CloudStorage {
  constructor() {
    this.isCloudMode = false;
    this.currentUser = null;
    this.subscription = null;
  }

  // Cloud-Modus aktivieren
  async enableCloudMode(supabaseUrl, supabaseKey) {
    try {
      // Supabase Client initialisieren
      const success = await window.supabaseClient.init(supabaseUrl, supabaseKey);
      if (!success) {
        throw new Error('Supabase Client konnte nicht initialisiert werden');
      }

      this.isCloudMode = true;
      
      // Prüfen ob User bereits eingeloggt ist
      const user = await window.supabaseClient.getCurrentUser();
      if (user) {
        this.currentUser = user;
        await this.loadSubscriptionStatus();
      }
      
      console.log('Cloud-Modus aktiviert');
      return true;
    } catch (error) {
      console.error('Fehler beim Aktivieren des Cloud-Modus:', error);
      return false;
    }
  }

  // Cloud-Modus deaktivieren
  disableCloudMode() {
    this.isCloudMode = false;
    this.currentUser = null;
    this.subscription = null;
    console.log('Cloud-Modus deaktiviert');
  }

  // Daten speichern (Cloud oder lokal)
  async saveData(data) {
    if (this.isCloudMode && this.currentUser) {
      return await this.saveToCloud(data);
    } else {
      return await this.saveToLocal(data);
    }
  }

  // Daten laden (Cloud oder lokal)
  async loadData() {
    if (this.isCloudMode && this.currentUser) {
      return await this.loadFromCloud();
    } else {
      return await this.loadFromLocal();
    }
  }

  // Kompatibilität mit bestehender Storage-API
  async load() {
    return await this.loadData();
  }

  async save(data) {
    return await this.saveData(data);
  }

  // Daten in Cloud speichern
  async saveToCloud(data) {
    try {
      // Usage Limits prüfen
      if (!this.checkUsageLimits(data)) {
        throw new Error('Nutzungslimits überschritten. Bitte upgraden Sie Ihr Abonnement.');
      }

      // Daten in Supabase speichern
      await window.supabaseClient.saveTrainingData(this.currentUser.id, data);
      
      // Usage Tracking aktualisieren
      await this.updateUsageTracking(data);
      
      console.log('Daten in Cloud gespeichert');
      return true;
    } catch (error) {
      console.error('Fehler beim Speichern in Cloud:', error);
      throw error;
    }
  }

  // Daten aus Cloud laden
  async loadFromCloud() {
    try {
      const data = await window.supabaseClient.getTrainingData(this.currentUser.id);
      console.log('Daten aus Cloud geladen');
      
      // Falls keine Daten vorhanden sind, Standard-Daten zurückgeben
      if (!data) {
        console.log('Keine Trainingsdaten in Cloud gefunden, verwende Standard-Daten');
        return {
          user: {
            name: this.currentUser.email,
            created: new Date().toISOString()
          },
          exercises: [],
          settings: {
            defaultExercises: ["Bankdrücken", "Kniebeugen", "Klimmzüge"],
            theme: "light"
          }
        };
      }
      
      return data;
    } catch (error) {
      console.error('Fehler beim Laden aus Cloud:', error);
      
      // Bei Fehlern (z.B. keine Daten vorhanden) Standard-Daten zurückgeben
      console.log('Verwende Standard-Daten aufgrund von Fehler');
      return {
        user: {
          name: this.currentUser.email,
          created: new Date().toISOString()
        },
        exercises: [],
        settings: {
          defaultExercises: ["Bankdrücken", "Kniebeugen", "Klimmzüge"],
          theme: "light"
        }
      };
    }
  }

  // Daten lokal speichern (Fallback)
  async saveToLocal(data) {
    // Verwende bestehende Storage-API
    if (window.saveData) {
      return await window.saveData(data);
    }
    throw new Error('Lokale Speicherung nicht verfügbar');
  }

  // Daten lokal laden (Fallback)
  async loadFromLocal() {
    // Verwende bestehende Storage-API
    if (window.loadData) {
      return await window.loadData();
    }
    throw new Error('Lokale Speicherung nicht verfügbar');
  }

  // Usage Limits prüfen
  checkUsageLimits(data) {
    if (!this.subscription) return true; // Keine Limits für nicht eingeloggte User
    
    const plan = window.getCurrentPlan(this.subscription);
    
    // Trainings-Anzahl prüfen
    const trainingCount = data.exercises?.length || 0;
    if (!window.checkUsageLimit(this.subscription, trainingCount, 'maxTrainingsPerMonth')) {
      return false;
    }
    
    // Daten-Größe prüfen
    const dataSize = JSON.stringify(data).length;
    if (!window.checkUsageLimit(this.subscription, dataSize, 'maxDataSize')) {
      return false;
    }
    
    return true;
  }

  // Usage Tracking aktualisieren
  async updateUsageTracking(data) {
    if (!this.currentUser) return;
    
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const trainingCount = data.exercises?.length || 0;
    const dataSize = JSON.stringify(data).length;
    
    try {
      await window.supabaseClient.client
        .from('usage_tracking')
        .upsert({
          user_id: this.currentUser.id,
          month: currentMonth,
          training_count: trainingCount,
          data_size_bytes: dataSize
        });
    } catch (error) {
      console.error('Fehler beim Update des Usage Tracking:', error);
    }
  }

  // Subscription Status laden
  async loadSubscriptionStatus() {
    if (!this.currentUser) return;
    
    try {
      this.subscription = await window.supabaseClient.getSubscriptionStatus(this.currentUser.id);
      console.log('Subscription Status geladen:', this.subscription);
    } catch (error) {
      console.error('Fehler beim Laden des Subscription Status:', error);
    }
  }

  // Realtime Sync aktivieren
  enableRealtimeSync() {
    if (!this.isCloudMode || !this.currentUser) return;
    
    if (!window.hasFeature(this.subscription, 'realtimeSync')) {
      console.log('Realtime Sync nicht verfügbar für aktuellen Plan');
      return;
    }
    
    try {
      window.supabaseClient.subscribeToTrainingData(this.currentUser.id, (payload) => {
        console.log('Realtime Update empfangen:', payload);
        this.handleRealtimeUpdate(payload);
      });
      console.log('Realtime Sync aktiviert');
    } catch (error) {
      console.error('Fehler beim Aktivieren von Realtime Sync:', error);
    }
  }

  // Realtime Update Handler
  handleRealtimeUpdate(payload) {
    if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
      // Daten neu laden und UI aktualisieren
      this.loadData().then(data => {
        if (window.refreshUI) {
          window.refreshUI(data);
        }
      });
    }
  }

  // Export-Funktionen erweitern
  async exportData(format = 'json') {
    const data = await this.loadData();
    
    if (format === 'json') {
      return this.exportAsJSON(data);
    } else if (format === 'csv') {
      if (!window.hasFeature(this.subscription, 'exportCSV')) {
        throw new Error('CSV-Export nur in Pro-Plan verfügbar');
      }
      return this.exportAsCSV(data);
    }
    
    throw new Error('Unbekanntes Export-Format');
  }

  // JSON Export
  exportAsJSON(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    return blob;
  }

  // CSV Export
  exportAsCSV(data) {
    const exercises = data.exercises || [];
    let csv = 'Datum,Übung,Wiederholungen,Gewicht,Notizen\n';
    
    exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        csv += `"${exercise.date}","${exercise.exercise}","${set.reps}","${set.weight}","${set.notes || ''}"\n`;
      });
    });
    
    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });
    return blob;
  }

  // Backup erstellen
  async createBackup() {
    const data = await this.loadData();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `cf-log-backup-${timestamp}.json`;
    
    const blob = this.exportAsJSON(data);
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }

  // Sync Status prüfen
  async checkSyncStatus() {
    if (!this.isCloudMode || !this.currentUser) {
      return { synced: true, lastSync: null };
    }
    
    try {
      const cloudData = await this.loadFromCloud();
      const localData = await this.loadFromLocal();
      
      const cloudTimestamp = cloudData?.lastModified;
      const localTimestamp = localData?.lastModified;
      
      return {
        synced: cloudTimestamp === localTimestamp,
        lastSync: cloudTimestamp,
        hasLocalChanges: localTimestamp > cloudTimestamp
      };
    } catch (error) {
      console.error('Fehler beim Prüfen des Sync-Status:', error);
      return { synced: false, error: error.message };
    }
  }
}

// Globale Cloud Storage Instanz
window.cloudStorage = new CloudStorage();
