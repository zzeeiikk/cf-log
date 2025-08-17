// Auth UI Komponenten für cf-log Cloud Version

class AuthUI {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  // Login/Register Modal anzeigen
  showAuthModal(mode = 'login') {
    const modal = document.createElement('div');
    modal.id = 'auth-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">
            ${mode === 'login' ? 'Anmelden' : 'Registrieren'}
          </h2>
          <button onclick="authUI.closeAuthModal()" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <form id="auth-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
            <input type="email" id="auth-email" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-apple-blue">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Passwort</label>
            <input type="password" id="auth-password" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-apple-blue">
          </div>
          
          ${mode === 'register' ? `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" id="auth-name" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-apple-blue">
          </div>
          ` : ''}
          
          <button type="submit" 
                  class="w-full bg-apple-blue text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors">
            ${mode === 'login' ? 'Anmelden' : 'Registrieren'}
          </button>
        </form>
        
        <div class="mt-4 text-center">
          <button onclick="authUI.showAuthModal('${mode === 'login' ? 'register' : 'login'}')" 
                  class="text-apple-blue hover:underline">
            ${mode === 'login' ? 'Noch kein Konto? Registrieren' : 'Bereits ein Konto? Anmelden'}
          </button>
        </div>
        
        <div class="mt-4 text-center">
          <button onclick="authUI.showForgotPassword()" 
                  class="text-gray-500 hover:text-gray-700 text-sm">
            Passwort vergessen?
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Form Handler
    document.getElementById('auth-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleAuthSubmit(mode);
    });
  }

  // Auth Modal schließen
  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) {
      modal.remove();
    }
  }

  // Auth Submit Handler
  async handleAuthSubmit(mode) {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name')?.value;
    
    try {
      if (mode === 'login') {
        await this.login(email, password);
      } else {
        await this.register(email, password, name);
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  // Login
  async login(email, password) {
    const { data, error } = await window.supabaseClient.signIn(email, password);
    if (error) throw error;
    
    this.currentUser = data.user;
    this.isAuthenticated = true;
    
    this.closeAuthModal();
    this.updateUI();
    this.loadUserData();
  }

  // Register
  async register(email, password, name) {
    const { data, error } = await window.supabaseClient.signUp(email, password);
    if (error) throw error;
    
    // User Profile erstellen
    if (data.user) {
      await window.supabaseClient.saveUserProfile(data.user.id, {
        name: name,
        created: new Date().toISOString(),
        settings: {}
      });
    }
    
    this.currentUser = data.user;
    this.isAuthenticated = true;
    
    this.closeAuthModal();
    this.updateUI();
    this.loadUserData();
  }

  // Logout
  async logout() {
    await window.supabaseClient.signOut();
    this.currentUser = null;
    this.isAuthenticated = false;
    
    this.updateUI();
    // Zurück zur lokalen Speicherung
    this.switchToLocalStorage();
  }

  // User Data laden
  async loadUserData() {
    if (!this.currentUser) return;
    
    try {
      // User Profile laden
      const profile = await window.supabaseClient.getUserProfile(this.currentUser.id);
      if (profile) {
        // Profile in App-State setzen (falls die Funktion existiert)
        if (window.setUserProfile) {
          window.setUserProfile(profile);
        } else {
          // Fallback: Profile direkt setzen
          if (window.appData) {
            window.appData.user = {
              name: profile.name,
              created: profile.created_at
            };
          }
        }
      }
      
      // Trainingsdaten laden
      const trainingData = await window.supabaseClient.getTrainingData(this.currentUser.id);
      if (trainingData) {
        // Trainingsdaten in App-State setzen (falls die Funktion existiert)
        if (window.loadTrainingData) {
          // Stelle sicher, dass die Daten die richtige Struktur haben
          const formattedData = {
            user: {
              name: profile?.name || 'Benutzer',
              created: profile?.created_at || new Date().toISOString()
            },
            exercises: trainingData.exercises || [],
            settings: trainingData.settings || {}
          };
          window.loadTrainingData(formattedData);
        } else {
          // Fallback: Daten direkt setzen
          if (window.appData) {
            window.appData.exercises = trainingData.exercises || [];
            window.appData.settings = trainingData.settings || {};
          }
        }
      }
      
      // Subscription Status laden
      const subscription = await window.supabaseClient.getSubscriptionStatus(this.currentUser.id);
      if (subscription) {
        this.updateSubscriptionUI(subscription);
      }
      
    } catch (error) {
      console.error('Fehler beim Laden der User-Daten:', error);
    }
  }

  // UI aktualisieren
  updateUI() {
    const header = document.querySelector('header');
    if (!header) return;
    
    // Auth Button im Header aktualisieren
    const authButton = header.querySelector('#auth-button');
    if (authButton) {
      if (this.isAuthenticated) {
        authButton.innerHTML = `
          <div class="flex items-center space-x-2">
            <span class="text-sm">${this.currentUser?.email}</span>
            <button onclick="authUI.showUserMenu()" class="text-apple-blue hover:text-blue-600">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
          </div>
        `;
      } else {
        authButton.innerHTML = `
          <button onclick="authUI.showAuthModal('login')" 
                  class="bg-apple-blue text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors">
            Anmelden
          </button>
        `;
      }
    }
  }

  // User Menu anzeigen
  showUserMenu() {
    const menu = document.createElement('div');
    menu.id = 'user-menu';
    menu.className = 'absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50';
    
    menu.innerHTML = `
      <div class="px-4 py-2 text-sm text-gray-700 border-b">
        <div class="font-medium">${this.currentUser?.email}</div>
        <div class="text-gray-500">Kostenloser Plan</div>
      </div>
      
      <a href="#" onclick="authUI.showProfileSettings()" 
         class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
        Profil-Einstellungen
      </a>
      
      <a href="#" onclick="authUI.showSubscriptionSettings()" 
         class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
        Abonnement
      </a>
      
      <a href="#" onclick="authUI.logout()" 
         class="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
        Abmelden
      </a>
    `;
    
    // Menu positionieren
    const authButton = document.querySelector('#auth-button');
    if (authButton) {
      authButton.style.position = 'relative';
      authButton.appendChild(menu);
    }
    
    // Menu schließen bei Klick außerhalb
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !authButton.contains(e.target)) {
        menu.remove();
      }
    });
  }

  // Error anzeigen
  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4';
    errorDiv.innerHTML = message;
    
    const form = document.getElementById('auth-form');
    form.insertBefore(errorDiv, form.firstChild);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }

  // Profile Settings anzeigen
  showProfileSettings() {
    // TODO: Implementiere Profile Settings Modal
    console.log('Profile Settings');
  }

  // Subscription Settings anzeigen
  showSubscriptionSettings() {
    // TODO: Implementiere Subscription Settings Modal
    console.log('Subscription Settings');
  }

  // Passwort vergessen
  showForgotPassword() {
    // TODO: Implementiere Passwort vergessen
    console.log('Passwort vergessen');
  }

  // Subscription UI aktualisieren
  updateSubscriptionUI(subscription) {
    // TODO: Implementiere Subscription UI Updates
    console.log('Subscription:', subscription);
  }

  // Zurück zur lokalen Speicherung
  switchToLocalStorage() {
    // TODO: Implementiere Switch zurück zu GitHub Gists/WebDAV
    console.log('Switch to local storage');
  }
}

// Globale Auth UI Instanz
window.authUI = new AuthUI();
