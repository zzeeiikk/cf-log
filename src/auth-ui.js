// Auth UI für Cloud-Funktionalität
class AuthUI {
  constructor() {
    this.currentUser = null;
    this.userProfile = null;
    this.subscription = null;
  }

  // Auth Modal anzeigen
  showAuthModal() {
    const modalHTML = `
      <div id="auth-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
          <div class="text-center">
            <h3 class="text-2xl font-bold text-gray-900 mb-6">Anmelden</h3>
            
            <form id="auth-form" class="space-y-4">
              <input type="email" name="email" placeholder="E-Mail" required 
                     class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              <input type="password" name="password" placeholder="Passwort" required 
                     class="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" />
              <button type="submit" 
                      class="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg font-medium transition-colors">
                Anmelden
              </button>
            </form>
            
            <div class="mt-4">
              <button type="button" id="auth-close" 
                      class="text-gray-500 hover:text-gray-700 text-sm">
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Event Listeners
    document.getElementById('auth-form').onsubmit = (e) => this.handleAuthSubmit(e);
    document.getElementById('auth-close').onclick = () => this.closeAuthModal();
  }

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.remove();
  }

  async handleAuthSubmit(e) {
    e.preventDefault();
    const email = e.target.email.value.trim();
    const password = e.target.password.value.trim();
    
    if (!email || !password) return;
    
    try {
      await this.login(email, password);
      this.closeAuthModal();
    } catch (error) {
      showNotification('Anmeldung fehlgeschlagen: ' + error.message, 'error');
    }
  }

  async login(email, password) {
    const result = await window.supabaseClient.signIn(email, password);
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    await this.loadUserData();
    this.updateUI();
  }

  async register(email, password) {
    const result = await window.supabaseClient.signUp(email, password);
    
    if (result.error) {
      throw new Error(result.error.message);
    }
    
    // Email-Bestätigung erforderlich
    showEmailConfirmationModal();
  }

  async logout() {
    await window.supabaseClient.signOut();
    this.currentUser = null;
    this.userProfile = null;
    this.subscription = null;
    this.updateUI();
  }

  async loadUserData() {
    try {
      // Aktuenden User laden
      this.currentUser = await window.supabaseClient.getCurrentUser();
      
      if (this.currentUser) {
        // User Profile laden
        const profileResult = await window.supabaseClient.getUserProfile(this.currentUser.id);
        if (profileResult.data) {
          this.userProfile = profileResult.data;
        }
        
        // Subscription Status laden
        const subscriptionResult = await window.supabaseClient.getSubscriptionStatus(this.currentUser.id);
        if (subscriptionResult.data) {
          this.subscription = subscriptionResult.data;
        }
      }
    } catch (error) {
      console.error('Fehler beim Laden der User-Daten:', error);
    }
  }

  updateUI() {
    const authButton = document.getElementById('auth-button');
    if (!authButton) return;
    
    if (this.currentUser) {
      // User ist eingeloggt
      authButton.innerHTML = `
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-700">${this.currentUser.email}</span>
          <button onclick="window.authUI.showUserMenu()" 
                  class="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm">
            Menü
          </button>
        </div>
      `;
    } else {
      // User ist nicht eingeloggt
      authButton.innerHTML = `
        <button onclick="window.authUI.showAuthModal()" 
                class="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-sm">
          Anmelden
        </button>
      `;
    }
  }

  showUserMenu() {
    const menuHTML = `
      <div id="user-menu" class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50">
        <div class="py-1">
          <div class="px-4 py-2 text-sm text-gray-700 border-b">
            ${this.currentUser.email}
          </div>
          <button onclick="window.authUI.showProfileSettings()" 
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Profil
          </button>
          <button onclick="window.authUI.showSubscriptionSettings()" 
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Abonnement
          </button>
          <button onclick="window.authUI.showForgotPassword()" 
                  class="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Passwort vergessen
          </button>
          <button onclick="window.authUI.logout()" 
                  class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100">
            Abmelden
          </button>
        </div>
      </div>
    `;
    
    const authButton = document.getElementById('auth-button');
    authButton.insertAdjacentHTML('beforeend', menuHTML);
    
    // Menu schließen wenn außerhalb geklickt wird
    document.addEventListener('click', (e) => {
      if (!authButton.contains(e.target)) {
        const menu = document.getElementById('user-menu');
        if (menu) menu.remove();
      }
    });
  }

  showProfileSettings() {
    // Profil-Einstellungen Modal
    showNotification('Profil-Einstellungen kommen bald!', 'info');
  }

  showSubscriptionSettings() {
    // Abonnement-Einstellungen Modal
    this.updateSubscriptionUI();
  }

  showForgotPassword() {
    // Passwort vergessen Modal
    showNotification('Passwort-Reset kommt bald!', 'info');
  }

  updateSubscriptionUI() {
    if (!this.subscription) return;
    
    const plan = this.subscription.plan_type;
    const status = this.subscription.status;
    
    showNotification(`Aktueller Plan: ${plan} (${status})`, 'info');
  }

  switchToLocalStorage() {
    if (confirm('Möchtest du zur lokalen Speicherung wechseln? Alle Cloud-Daten bleiben erhalten.')) {
      localStorage.setItem('cf_log_storage_type', 'github');
      window.location.reload();
    }
  }
}

// Globale Auth UI Instanz
window.authUI = new AuthUI();
