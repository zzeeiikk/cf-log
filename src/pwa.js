// PWA (Progressive Web App) Funktionalität und Installation

// PWA Install Event Listener
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPrompt();
  });
  
  // Show install prompt after successful login
  function showInstallPromptAfterLogin() {
    // Wait a bit for the dashboard to load
    setTimeout(() => {
      if (isMobileDevice()) {
        // Check if we should show the prompt
        const lastShown = localStorage.getItem('cf_log_install_prompt_shown');
        const now = Date.now();
        if (!lastShown || (now - parseInt(lastShown)) > 24 * 60 * 60 * 1000) {
          // Show unified banner (works for all browsers)
          showInstallPrompt();
        }
      }
    }, 2000); // Show after 2 seconds
  }
  
  // PWA Install Success
  window.addEventListener('appinstalled', () => {
    hideInstallPrompt();
    showNotification('cf-log wurde erfolgreich installiert! 🎉', 'success');
  });
  
  // Show install prompt
  function showInstallPrompt() {
    // Only show on mobile devices
    if (!isMobileDevice()) return;
    
    // Don't show if app is already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
      return;
    }
    
    // Check if user has disabled PWA hints
    if (localStorage.getItem('cf_log_pwa_hint_enabled') === 'false') {
      return;
    }
    
    // Check if already shown recently
    const lastShown = localStorage.getItem('cf_log_install_prompt_shown');
    const now = Date.now();
    if (lastShown && (now - parseInt(lastShown)) < 24 * 60 * 60 * 1000) return; // 24 hours
    
    // Create install banner
    const banner = document.createElement('div');
    banner.id = 'pwa-install-banner';
    banner.className = 'fixed top-0 left-0 right-0 bg-apple-blue text-white p-4 z-50 shadow-lg transform transition-transform duration-300';
    banner.style.transform = 'translateY(-100%)';
    
    banner.innerHTML = `
      <div class="flex items-center justify-between max-w-md mx-auto">
        <div class="flex items-center space-x-3">
          <img src="data/cf-log.jpg" alt="cf-log" class="w-8 h-8 rounded">
          <div>
            <div class="font-semibold text-sm">📱 cf-log als App installieren</div>
            <div class="text-xs opacity-90">Für bessere mobile Nutzung</div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <button id="pwa-install-btn" class="bg-white text-apple-blue px-3 py-1 rounded-full text-sm font-medium">
            ${deferredPrompt ? 'Installieren' : 'Anleitung'}
          </button>
          <button id="pwa-dismiss-btn" class="text-white opacity-70 hover:opacity-100">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(banner);
    
    // Show banner with animation
    setTimeout(() => {
      banner.style.transform = 'translateY(0)';
    }, 1000);
    
    // Install button click
    document.getElementById('pwa-install-btn').addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          localStorage.setItem('cf_log_install_prompt_shown', now.toString());
        }
        deferredPrompt = null;
      } else {
        // Show manual installation guide
        hideInstallPrompt();
        showPWAInstallGuide();
      }
    });
    
    // Dismiss button click
    document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
      hideInstallPrompt();
      localStorage.setItem('cf_log_install_prompt_shown', now.toString());
    });
  }
  
  // Force show install prompt (for manual trigger)
  function forceShowInstallPrompt() {
    // Reset the "shown recently" flag
    localStorage.removeItem('cf_log_install_prompt_shown');
    // Temporarily enable PWA hints for this manual trigger
    const originalSetting = localStorage.getItem('cf_log_pwa_hint_enabled');
    localStorage.setItem('cf_log_pwa_hint_enabled', 'true');
    showInstallPrompt();
    // Restore original setting after showing
    if (originalSetting === 'false') {
      setTimeout(() => {
        localStorage.setItem('cf_log_pwa_hint_enabled', 'false');
      }, 100);
    }
  }
  
  
  
  // Hide install prompt
  function hideInstallPrompt() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
      banner.style.transform = 'translateY(-100%)';
      setTimeout(() => {
        banner.remove();
      }, 300);
    }
  }
  
  // Check if device is mobile
  function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  
  // Show PWA installation guide
  function showPWAInstallGuide() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let guideHTML = '';
    
    if (isIOS) {
      guideHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">📱 iOS Installation</h3>
              <button onclick="hidePWAInstallGuide()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="bg-blue-50 p-4 rounded-lg">
              <h4 class="font-semibold text-blue-900 mb-2">Schritt-für-Schritt Anleitung:</h4>
              <ol class="text-sm text-blue-800 space-y-2">
                <li>1. Tippe auf das <strong>Teilen-Symbol</strong> (□↑) in Safari</li>
                <li>2. Scrolle nach unten und wähle <strong>"Zum Home-Bildschirm"</strong></li>
                <li>3. Tippe auf <strong>"Hinzufügen"</strong></li>
                <li>4. cf-log erscheint jetzt auf deinem Home-Bildschirm!</li>
              </ol>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
              <div class="text-yellow-800 text-sm">
                💡 <strong>Tipp:</strong> Die App funktioniert dann wie eine native App und du hast schnellen Zugriff auf dein Training!
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (isAndroid) {
      guideHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">📱 Android Installation</h3>
              <button onclick="hidePWAInstallGuide()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="bg-green-50 p-4 rounded-lg">
              <h4 class="font-semibold text-green-900 mb-2">Schritt-für-Schritt Anleitung:</h4>
              <ol class="text-sm text-green-800 space-y-2">
                <li>1. Tippe auf das <strong>Menü-Symbol</strong> (⋮) in Chrome</li>
                <li>2. Wähle <strong>"Zum Startbildschirm hinzufügen"</strong></li>
                <li>3. Bestätige mit <strong>"Hinzufügen"</strong></li>
                <li>4. cf-log erscheint jetzt auf deinem Startbildschirm!</li>
              </ol>
            </div>
            <div class="bg-yellow-50 p-4 rounded-lg">
              <div class="text-yellow-800 text-sm">
                💡 <strong>Tipp:</strong> Die App funktioniert dann wie eine native App und du hast schnellen Zugriff auf dein Training!
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      guideHTML = `
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">📱 Mobile Installation</h3>
              <button onclick="hidePWAInstallGuide()" class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="p-6 space-y-4">
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="font-semibold text-gray-900 mb-2">Allgemeine Anleitung:</h4>
              <div class="text-sm text-gray-700 space-y-2">
                <p>1. Öffne cf-log in deinem mobilen Browser</p>
                <p>2. Suche nach der Option <strong>"Zum Startbildschirm hinzufügen"</strong> oder <strong>"Installieren"</strong></p>
                <p>3. Folge den Anweisungen deines Browsers</p>
                <p>4. cf-log erscheint dann auf deinem Startbildschirm!</p>
              </div>
            </div>
            <div class="bg-blue-50 p-4 rounded-lg">
              <div class="text-blue-800 text-sm">
                💡 <strong>Hinweis:</strong> Die genauen Schritte können je nach Browser und Gerät variieren.
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    // Create modal overlay
    const modalHTML = `
      <div id="pwa-install-guide-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
        ${guideHTML}
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Close modal when clicking outside
    document.getElementById('pwa-install-guide-modal').addEventListener('click', (e) => {
      if (e.target.id === 'pwa-install-guide-modal') {
        hidePWAInstallGuide();
      }
    });
  }
  
  // Hide PWA installation guide
  function hidePWAInstallGuide() {
    hideModal('pwa-install-guide-modal', true);
  }