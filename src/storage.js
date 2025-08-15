// Storage Provider Klassen und Datenpersistierung

// Storage Provider Interface
class StorageProvider {
    async save(data) { throw new Error('save() must be implemented'); }
    async load() { throw new Error('load() must be implemented'); }
    async create(data) { throw new Error('create() must be implemented'); }
    async delete() { throw new Error('delete() must be implemented'); }
    async testConnection() { throw new Error('testConnection() must be implemented'); }
  }
  
  // GitHub Gists Storage Provider
  class GitHubGistProvider extends StorageProvider {
    constructor(token, gistId = null) {
      super();
      this.token = token;
      this.gistId = gistId;
    }
  
    async create(data) {
      const res = await fetch(`${GITHUB_API}/gists`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: 'cf-log Trainingsdaten',
          public: false,
          files: { [FILE_NAME]: { content: JSON.stringify(data, null, 2) } }
        })
      });
      if (!res.ok) throw new Error('Gist konnte nicht erstellt werden.');
      const json = await res.json();
      this.gistId = json.id;
      return json.id;
    }
  
    async load() {
      if (!this.gistId) throw new Error('Keine Gist-ID verfügbar');
      const res = await fetch(`${GITHUB_API}/gists/${this.gistId}`, {
        headers: { 'Authorization': `token ${this.token}` }
      });
      if (!res.ok) throw new Error('Gist konnte nicht geladen werden.');
      const json = await res.json();
      return JSON.parse(json.files[FILE_NAME].content);
    }
  
    async save(data) {
      if (!this.gistId) throw new Error('Keine Gist-ID verfügbar');
      const res = await fetch(`${GITHUB_API}/gists/${this.gistId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: { [FILE_NAME]: { content: JSON.stringify(data, null, 2) } }
        })
      });
      if (!res.ok) throw new Error('Gist konnte nicht aktualisiert werden.');
    }
  
    async delete() {
      if (!this.gistId) throw new Error('Keine Gist-ID verfügbar');
      const res = await fetch(`${GITHUB_API}/gists/${this.gistId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `token ${this.token}` }
      });
      if (!res.ok) throw new Error('Gist konnte nicht gelöscht werden.');
    }
  
    async testConnection() {
      try {
        const res = await fetch(`${GITHUB_API}/user`, {
          headers: { 'Authorization': `token ${this.token}` }
        });
        if (!res.ok) throw new Error('Token ungültig');
        return true;
      } catch (error) {
        throw new Error('Verbindung zu GitHub fehlgeschlagen: ' + error.message);
      }
    }
  }
  
  // WebDAV Storage Provider
  class WebDAVProvider extends StorageProvider {
    constructor(url, username, password, filename = FILE_NAME) {
      super();
      this.url = url.endsWith('/') ? url : url + '/';
      this.username = username;
      this.password = password;
      this.filename = filename;
      this.fileUrl = this.url + this.filename;
    }
  
    async create(data) {
      // Bei WebDAV ist create() das gleiche wie save()
      return await this.save(data);
    }
  
    async load() {
      const res = await fetch(this.fileUrl, {
        method: 'GET',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`)
        }
      });
      
      if (res.status === 404) {
        throw new Error('Datei nicht gefunden. Erstelle neue Datei...');
      }
      
      if (!res.ok) {
        throw new Error(`WebDAV Fehler: ${res.status} ${res.statusText}`);
      }
      
      const content = await res.text();
      return JSON.parse(content);
    }
  
    async save(data) {
      const content = JSON.stringify(data, null, 2);
      const res = await fetch(this.fileUrl, {
        method: 'PUT',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`),
          'Content-Type': 'application/json',
          'Content-Length': content.length.toString()
        },
        body: content
      });
      
      if (!res.ok) {
        throw new Error(`WebDAV Fehler beim Speichern: ${res.status} ${res.statusText}`);
      }
    }
  
    async delete() {
      const res = await fetch(this.fileUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`)
        }
      });
      
      if (!res.ok && res.status !== 404) {
        throw new Error(`WebDAV Fehler beim Löschen: ${res.status} ${res.statusText}`);
      }
    }
  
    async testConnection() {
      try {
        // Versuche zuerst einen einfachen GET-Request ohne OPTIONS
        const res = await fetch(this.url, {
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + btoa(`${this.username}:${this.password}`)
          }
        });
        
        // Akzeptiere verschiedene Status-Codes als "Server erreichbar"
        if (res.status === 401 || res.status === 403) {
          // Server ist erreichbar, aber Auth fehlt oder ist falsch
          return true;
        } else if (res.status >= 200 && res.status < 300) {
          // Erfolgreiche Verbindung
          return true;
        } else if (res.status === 404) {
          // Server erreichbar, aber Pfad nicht gefunden
          return true;
    } else {
          throw new Error(`WebDAV Server nicht erreichbar: ${res.status} ${res.statusText}`);
        }
      } catch (error) {
        // Bei CORS-Fehlern, versuche es mit einem einfacheren Test
        if (error.message.includes('CORS') || error.message.includes('access control')) {
          throw new Error('CORS-Fehler: Verwende einen CORS-Proxy. Beispiel: https://corsproxy.io/?https://dein-webdav-server.com');
        }
        throw new Error('WebDAV Verbindung fehlgeschlagen: ' + error.message);
      }
    }
  }