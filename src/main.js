// cf-log - Flexibles Trainingslog mit GitHub Gists
// Version 1.0 - Verbesserte JSON-Struktur und moderne UI

// Hauptfunktion und App-Initialisierung

// Module loading system
const MODULES = [
  'config.js',
  'state.js', 
  'utils.js',
  'storage.js',
  'storage-helpers.js',
  'pwa.js',
  'mobile.js',
  'settings.js',
  'data.js',
  'ui.js'
];

let loadedModules = 0;

function loadModule(moduleName) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `src/${moduleName}`;
    script.onload = () => {
      loadedModules++;
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Failed to load ${moduleName}`));
    };
    document.head.appendChild(script);
  });
}

async function loadAllModules() {
  try {
    for (const module of MODULES) {
      await loadModule(module);
    }
    
    // Initialize app after all modules are loaded
    main();
  } catch (error) {
    document.getElementById('app').innerHTML = `
      <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-red-600 mb-4">Fehler beim Laden</h1>
          <p class="text-gray-600">Die Anwendung konnte nicht geladen werden.</p>
        </div>
      </div>
    `;
  }
}

// Start loading modules when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAllModules);
} else {
  loadAllModules();
}

function addMultipleSets(count) {
  for (let i = 0; i < count; i++) {
    addSet();
  }
}

function addMultipleEditSets(count) {
  for (let i = 0; i < count; i++) {
    addEditSet();
  }
}

// Universelle Mobile Dropdown Setup Funktion
function setupMobileDropdown(inputId, dropdownId, datalistId = null) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  
  if (!input || !dropdown) {
    console.warn(`Mobile Dropdown Setup fehlgeschlagen: ${inputId} oder ${dropdownId} nicht gefunden`);
    return;
  }
  
  const exercises = getAllAvailableExercises();
  
  if (isMobileDevice()) {
    // Mobile: Use custom dropdown, disable datalist
    input.removeAttribute('list');
    
    // Show mobile dropdown on focus
    input.addEventListener('focus', function() {
      showMobileDropdown(exercises, input, dropdown);
    });
    
    // Filter dropdown on input
    input.addEventListener('input', function() {
      const value = this.value.toLowerCase();
      const filtered = exercises.filter(ex => 
        ex.toLowerCase().includes(value)
      );
      showMobileDropdown(filtered, input, dropdown);
    });
    
    // Hide dropdown when clicking outside
    document.addEventListener('click', function(e) {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  } else {
    // Desktop: Use native datalist
    if (datalistId) {
      input.setAttribute('list', datalistId);
    }
    dropdown.classList.add('hidden');
  }
}