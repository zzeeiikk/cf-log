// Storage Provider Helper Functions und Legacy-Funktionen

// Storage Provider Helper Functions
async function createStorageProvider(type, config) {
    switch (type) {
      case 'github':
        return new GitHubGistProvider(config.token, config.gistId);
      case 'webdav':
        return new WebDAVProvider(config.url, config.username, config.password, config.filename);
      default:
        throw new Error(`Unbekannter Storage-Typ: ${type}`);
    }
  }
  
  async function testStorageConnection(type, config) {
    const provider = await createStorageProvider(type, config);
    return await provider.testConnection();
  }
  
  // Legacy functions for backward compatibility
  async function createGist(token, data) {
    const provider = new GitHubGistProvider(token);
    return await provider.create(data);
  }
  
  async function loadGist(token, gistId) {
    const provider = new GitHubGistProvider(token, gistId);
    return await provider.load();
  }
  
  async function updateGist(token, gistId, data) {
    const provider = new GitHubGistProvider(token, gistId);
    return await provider.save(data);
  }