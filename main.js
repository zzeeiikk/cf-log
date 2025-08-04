// cf-log - Flexibles Trainingslog mit GitHub Gists
// Version 1.0 - Verbesserte JSON-Struktur und moderne UI

const FILE_NAME = 'cf-log.json';
const GITHUB_API = 'https://api.github.com';

// Datenstruktur
let appData = {
  user: {
    name: '',
    created: new Date().toISOString().split('T')[0]
  },
  exercises: [],
  settings: {
    defaultExercises: [  
      "Deadlift",
      "Squat",
      "Clean and Jerk",
      "Snatch",
      "Strict Press",
      "Power Clean",
      "Thruster",
      "Pull-ups",
      "Toes-to-Bar",
      "Muscle-ups",
      "Handstand Push-ups",
      "Push-ups",
      "Burpees",
      "Dips",
      "Rope Jumps",
      "Sit-ups",
      "Air Squat",
      "Front Squat",
      "Back Squat",
      "Squat Cleans"],
    theme: 'light'
  }
};

// UI State
let currentView = getDefaultView(); // 'summary', 'activity' oder 'training'

// Funktion zur Bestimmung der Standard-Ansicht basierend auf Bildschirmgröße
function getDefaultView() {
  // Mobile (< 768px): Training Mode
  // Desktop (≥ 768px): Zusammenfassung
  return window.innerWidth < 768 ? 'training' : 'summary';
}

// Funktion zur Sortierung von Übungen nach Standard-Reihenfolge
function sortExercisesByDefaultOrder(exerciseEntries) {
  return exerciseEntries.sort(([aName], [bName]) => {
    const aIndex = appData.settings.defaultExercises.indexOf(aName);
    const bIndex = appData.settings.defaultExercises.indexOf(bName);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    // Beide nicht in der Liste: alphabetisch
    return aName.localeCompare(bName, 'de');
  });
}

// Utility Functions
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getAllAvailableExercises() {
  // Sammle alle Standard-Übungen
  const exercises = new Set(appData.settings.defaultExercises);
  
  // Sammle alle bereits verwendeten Übungen aus den Trainings
  appData.exercises.forEach(exercise => {
    exercises.add(exercise.exercise);
  });
  
  // Sortiere alphabetisch und entferne Duplikate
  return Array.from(exercises).sort();
}

function formatDate(date) {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear().toString().slice(-2);
  return `${day}.${month}.${year}`;
}

// Neue Funktion zur intelligenten Darstellung von Sets
function formatSetsIntelligently(sets) {
  if (sets.length === 0) return '';
  
  // Gruppiere gleiche Sets
  const groupedSets = [];
  let currentGroup = { reps: sets[0].reps, weight: sets[0].weight, count: 1 };
  
  for (let i = 1; i < sets.length; i++) {
    const set = sets[i];
    if (set.reps === currentGroup.reps && set.weight === currentGroup.weight) {
      currentGroup.count++;
    } else {
      groupedSets.push(currentGroup);
      currentGroup = { reps: set.reps, weight: set.weight, count: 1 };
    }
  }
  groupedSets.push(currentGroup);
  
  // Prüfe ob alle Sets die gleiche Anzahl Wiederholungen haben
  const allSameReps = groupedSets.every(group => group.reps === groupedSets[0].reps);
  
  if (allSameReps && groupedSets.length > 1) {
    // Alle Sets haben gleiche Wiederholungen - zeige Anzahl der Sets und Gewichte an
    const reps = groupedSets[0].reps;
    const totalSets = groupedSets.reduce((sum, group) => sum + group.count, 0);
    const weightGroups = groupedSets.map(group => {
      if (group.count === 1) {
        return `${group.weight}kg`;
      } else {
        return `${group.count}×${group.weight}kg`;
      }
    });
    return `${totalSets}×${reps} (${weightGroups.join(' ')})`;
  } else {
    // Prüfe ob alle Sets das gleiche Gewicht haben
    const allSameWeight = groupedSets.every(group => group.weight === groupedSets[0].weight);
    
    if (allSameWeight && groupedSets.length === 1 && groupedSets[0].count > 1) {
      // Alle Sets haben gleiches Gewicht - zeige Anzahl der Sets und Wiederholungen an
      const weight = groupedSets[0].weight;
      const reps = groupedSets[0].reps;
      const totalSets = groupedSets[0].count;
      return `${totalSets}×${reps} (${weight}kg)`;
    } else {
      // Normale Darstellung für gemischte Wiederholungen
      return groupedSets.map(group => {
        if (group.count === 1) {
          return `${group.reps}×${group.weight}kg`;
        } else {
          return `${group.count}×${group.reps}×${group.weight}kg`;
        }
      }).join(' ');
    }
  }
}

// GitHub Gist Functions
async function createGist(token, data) {
  const res = await fetch(`${GITHUB_API}/gists`, {
    method: 'POST',
    headers: {
      'Authorization': `token ${token}`,
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
  return json.id;
}

async function loadGist(token, gistId) {
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    headers: { 'Authorization': `token ${token}` }
  });
  if (!res.ok) throw new Error('Gist konnte nicht geladen werden.');
  const json = await res.json();
  return JSON.parse(json.files[FILE_NAME].content);
}

async function updateGist(token, gistId, data) {
  const res = await fetch(`${GITHUB_API}/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `token ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: { [FILE_NAME]: { content: JSON.stringify(data, null, 2) } }
    })
  });
  if (!res.ok) throw new Error('Gist konnte nicht aktualisiert werden.');
}

// UI Functions
function renderOnboarding() {
  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <div class="text-4xl mb-4">🏋️‍♂️</div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">cf-log</h1>
          <p class="text-gray-600">Dein flexibles Trainingslog mit GitHub Gists</p>
        </div>
        
        <div class="mb-8 p-4 bg-blue-50 rounded-lg">
          <h3 class="font-semibold text-blue-900 mb-3">GitHub Token erstellen:</h3>
          <div class="flex justify-center mb-3">
            <a href="https://github.com/settings/tokens" target="_blank" 
               class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
              </svg>
              GitHub Token erstellen
            </a>
          </div>
          <ol class="text-sm text-blue-800 space-y-1">
            <li>1. Klicke auf "Generate new token (classic)"</li>
            <li>2. Vergib einen Namen und Ablaufdatum</li>
            <li>3. Setze <span class="font-mono bg-blue-200 px-1 rounded">nur</span> das Häkchen bei <span class="font-mono bg-blue-200 px-1 rounded">gist</span></li>
            <li>4. Klicke "Generate token" und kopiere den Token</li>
          </ol>
        </div>



                <form id="login-form" class="space-y-4 mb-6">
          <input type="text" name="gist_id" placeholder="Gist-ID (optional)" 
                 class="w-full border border-gray-300 p-3 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input type="password" name="token" placeholder="GitHub Token" required 
                 class="w-full border border-gray-300 p-3 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <button type="submit" 
                  class="w-full bg-gray-400 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold text-lg transition-colors">
            Einloggen
          </button>
        </form>

        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">oder</span>
          </div>
        </div>

        <form id="onboarding-form" class="space-y-4 mt-6 mb-6">
          <input type="text" name="name" placeholder="Dein Name" required 
                 class="w-full border border-gray-300 p-3 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input type="password" name="token" placeholder="GitHub Token" required 
                 class="w-full border border-gray-300 p-3 rounded-xl text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <button type="submit" 
                  class="w-full bg-blue-400 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold text-lg transition-colors">
            Neues Profil anlegen
          </button>
        </form>
        


        <!-- Demo Button -->
        <div class="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-medium text-purple-900">App testen</h4>
              <p class="text-sm text-purple-700 mt-1">Lade Beispieldaten mit 51 Trainings über 5 Jahre</p>
            </div>
            <button type="button" id="demo-btn" 
                    class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              Demo starten
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event Listeners
  document.getElementById('onboarding-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = e.target.name.value.trim();
    const token = e.target.token.value.trim();
    if (!token || !name) return;
    
    try {
      appData.user.name = name;
      const gistId = await createGist(token, appData);
      localStorage.setItem('cf_log_token', token);
      localStorage.setItem('cf_log_gist_id', gistId);
      localStorage.setItem('cf_log_user_name', name);
  window.location.reload();
    } catch (err) {
      showNotification('Fehler: ' + err.message, 'error');
    }
  };

  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const gistId = e.target.gist_id.value.trim();
    const token = e.target.token.value.trim();
    if (!token) return;
    
    try {
      if (gistId) {
        // Bestehenden Gist laden
        const data = await loadGist(token, gistId);
        appData = { ...appData, ...data };
        localStorage.setItem('cf_log_token', token);
        localStorage.setItem('cf_log_gist_id', gistId);
        localStorage.setItem('cf_log_user_name', appData.user.name);
      } else {
        // Neuen Gist erstellen
        appData.user.name = 'Benutzer';
        const newGistId = await createGist(token, appData);
        localStorage.setItem('cf_log_token', token);
        localStorage.setItem('cf_log_gist_id', newGistId);
        localStorage.setItem('cf_log_user_name', appData.user.name);
      }
      window.location.reload();
    } catch (err) {
      showNotification('Fehler: ' + err.message, 'error');
    }
  };

  // Demo Button Event Listener
  document.getElementById('demo-btn').onclick = async () => {
    try {
      // Beispieldaten laden
      const response = await fetch('example_training_data.json');
      if (!response.ok) {
        throw new Error('Beispieldaten konnten nicht geladen werden');
      }
      const demoData = await response.json();
      
      // App-Daten mit Demo-Daten überschreiben
      appData = { ...appData, ...demoData };
      
      // Lokale Speicherung für Demo-Modus
      localStorage.setItem('cf_log_demo_mode', 'true');
      localStorage.setItem('cf_log_user_name', demoData.user.name);
      
      // Dashboard anzeigen
      renderDashboard();
      
      showNotification('Demo-Daten erfolgreich geladen!', 'success');
    } catch (err) {
      showNotification('Demo-Fehler: ' + err.message, 'error');
    }
  };
}

function renderDashboard() {
  const token = localStorage.getItem('cf_log_token');
  const gistId = localStorage.getItem('cf_log_gist_id');
  const userName = localStorage.getItem('cf_log_user_name');

  document.getElementById('app').innerHTML = `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center ${currentView === 'training' ? 'h-12' : 'h-16'}">
            <div class="flex items-center">
              <h1 class="${currentView === 'training' ? 'text-lg' : 'text-xl'} font-semibold text-gray-900">🏋️‍♂️ cf-log</h1>
              <span class="ml-3 text-sm text-gray-500">Hallo, ${userName}</span>
      </div>
            <div class="flex items-center space-x-4">
              <button onclick="showAddExerciseModal()" 
                      class="bg-blue-600 hover:bg-blue-700 text-white ${currentView === 'training' ? 'px-4 py-2' : 'px-3 py-1'} text-sm rounded-md font-medium transition-colors">
                ${currentView === 'training' ? '+' : '+ Training'}
              </button>
              <button onclick="showSettingsModal()" 
                      class="text-gray-600 hover:text-gray-800 p-2 rounded-lg hover:bg-gray-100 transition-colors ${currentView === 'training' ? 'hidden' : ''}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
              </button>
              <button onclick="logout()" 
                      class="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors ${currentView === 'training' ? 'hidden' : ''}">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
              </button>
    </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 ${currentView === 'training' ? 'lg:grid-cols-1' : 'lg:grid-cols-3'} gap-8">
          <!-- Exercise List -->
          <div class="${currentView === 'training' ? 'lg:col-span-1' : 'lg:col-span-2'}">
            <div class="bg-white rounded-lg shadow">
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                  <h2 class="text-lg font-semibold text-gray-900">
                    ${currentView === 'summary' ? 'Übungszusammenfassung' : 
                      currentView === 'training' ? 'Training Mode' : 'Trainingsverlauf'}
                  </h2>
                  <div class="flex flex-wrap bg-gray-100 rounded-lg p-1 gap-1">
                    <button onclick="switchView('training')" 
                            class="flex-1 min-w-0 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                              currentView === 'training' 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                            }">
                      <span class="hidden sm:inline">💪 Training</span>
                      <span class="sm:hidden">💪 Train</span>
                    </button>
                    <button onclick="switchView('activity')" 
                            class="flex-1 min-w-0 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                              currentView === 'activity' 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                            }">
                      <span class="hidden sm:inline">📝 Aktivitätslog</span>
                      <span class="sm:hidden">📝 Log</span>
                    </button>
                                        <button onclick="switchView('summary')" 
                            class="flex-1 min-w-0 px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                              currentView === 'summary' 
                                ? 'bg-white text-gray-900 shadow-sm' 
                                : 'text-gray-600 hover:text-gray-900'
                            }">
                      <span class="hidden sm:inline">📊 Statistiken</span>
                      <span class="sm:hidden">📊 Stats</span>
                    </button>
                  </div>
                </div>
              </div>
              <div id="exercise-list" class="divide-y divide-gray-500">
                ${currentView === 'summary' ? renderExerciseSummary() : 
                  currentView === 'training' ? renderTrainingMode() : renderExerciseList()}
              </div>
            </div>
          </div>

          <!-- Stats Sidebar -->
          <div class="space-y-6 ${currentView === 'training' ? 'hidden' : ''}">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-900">Statistiken</h3>
                <button onclick="toggleYearComparison()" 
                        class="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1">
                  <span id="year-comparison-text">📊 Jahresvergleich</span>
                  <svg id="year-comparison-icon" class="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </button>
              </div>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-600">Gesamt Trainings:</span>
                  <span class="font-semibold">${appData.exercises.length}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Eindeutige Übungen:</span>
                  <span class="font-semibold">${getUniqueExerciseCount()}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Letztes Training:</span>
                  <span class="font-semibold">${getLastTrainingDate()}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Top Übung:</span>
                  <span class="font-semibold">${getTopExercise()}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600">Gesamt Sets:</span>
                  <span class="font-semibold">${getTotalSets()}</span>
                </div>
              </div>
              
              <!-- Jahresvergleich (ausgeklappt) -->
              <div id="year-comparison" class="hidden mt-4 pt-4 border-t border-gray-200">
                <h4 class="text-sm font-medium text-gray-900 mb-3">Jahresvergleich</h4>
                <div class="space-y-3">
                  ${renderYearComparison()}
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Hilfe</h3>
              <div class="space-y-3 text-sm text-gray-600">
                <p>💡 <strong>Tipp:</strong> Verwende den Training Mode für eine ablenkungsfreie Ansicht während des Trainings.</p>
                <p>⚙️ Alle Einstellungen und Daten-Management-Funktionen findest du im Einstellungen-Menü.</p>
              </div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">CrossFit</h3>
              <div class="space-y-3 text-sm text-gray-600">
                <p>💪 <strong>CrossFit</strong> is constantly varied, functional movements, performed at high intensity.</p>
                <p>🙌 <strong>CrossFit</strong> besteht aus ständig wechselnden, funktionellen Bewegungen, die mit hoher Intensität ausgeführt werden.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>

    <!-- Modals -->
    ${renderAddExerciseModal()}
    ${renderSettingsModal()}
    ${renderImportModal()}
  `;

  // Event Listeners für Modals
  setupModalEventListeners();
}

function switchView(view) {
  currentView = view;
  renderDashboard();
}

function toggleTrainingHistory(exerciseName) {
  const historyId = `training-history-${exerciseName.replace(/\s+/g, '-')}`;
  const iconId = `toggle-icon-${exerciseName.replace(/\s+/g, '-')}`;
  
  const historyDiv = document.getElementById(historyId);
  const icon = document.getElementById(iconId);
  const button = icon.closest('button');
  const buttonText = button.querySelector('span');
  
  if (historyDiv.classList.contains('hidden')) {
    historyDiv.classList.remove('hidden');
    icon.classList.add('rotate-180');
    buttonText.textContent = 'Weniger anzeigen';
  } else {
    historyDiv.classList.add('hidden');
    icon.classList.remove('rotate-180');
    buttonText.textContent = `Alle ${appData.exercises.filter(ex => ex.exercise === exerciseName).length} Trainings anzeigen`;
  }
}

function renderExerciseSummary() {
  if (appData.exercises.length === 0) {
    return `
      <div class="p-8 text-center">
        <div class="text-4xl mb-4">🏋️‍♂️</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Noch keine Trainings</h3>
        <p class="text-gray-500 mb-4">Füge dein erstes Training hinzu!</p>
        <button onclick="showAddExerciseModal()" 
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          Erstes Training hinzufügen
        </button>
      </div>
    `;
  }
  // Gruppiere Übungen nach Namen
  const exerciseGroups = {};
  appData.exercises.forEach(exercise => {
    if (!exerciseGroups[exercise.exercise]) {
      exerciseGroups[exercise.exercise] = [];
    }
    exerciseGroups[exercise.exercise].push(exercise);
  });
  // Sortiere nach Standard-Übungen
  const sortedExercises = sortExercisesByDefaultOrder(Object.entries(exerciseGroups));
  return sortedExercises.map(([exerciseName, exercises]) => {
    const totalSessions = exercises.length;
    const lastSession = exercises.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const firstSession = exercises.sort((a, b) => new Date(a.date) - new Date(b.date))[0];
    
    // Berechne Statistiken
    let totalSets = 0;
    let totalReps = 0;
    let maxWeight = 0;
    let totalWeight = 0;
    let is1RMCount = 0;
    let inWorkoutCount = 0;
    let oneRMWeight = null;

    exercises.forEach(ex => {
      ex.sets.forEach(set => {
        totalSets++;
        totalReps += set.reps;
        maxWeight = Math.max(maxWeight, set.weight);
        totalWeight += set.weight;
      });
      if (ex.is1RM) {
        is1RMCount++;
        // Finde das höchste Gewicht aus 1RM Trainings
        const oneRMSets = ex.sets.map(set => set.weight);
        const maxOneRM = Math.max(...oneRMSets);
        if (!oneRMWeight || maxOneRM > oneRMWeight) {
          oneRMWeight = maxOneRM;
        }
      }
      if (ex.inWorkout) inWorkoutCount++;
    });

    const avgWeight = totalWeight > 0 ? (totalWeight / totalSets).toFixed(1) : 0;
    const avgReps = totalSets > 0 ? (totalReps / totalSets).toFixed(1) : 0;

    return `
      <div class="p-6 hover:bg-gray-50 transition-colors">
        <div class="flex justify-between items-start mb-4">
          <div class="flex-1">
            <h3 class="text-xl font-semibold text-gray-900 mb-1">${exerciseName}</h3>
            <div class="flex items-center space-x-4 text-sm text-gray-500">
              <span>${totalSessions} Training${totalSessions > 1 ? 's' : ''}</span>
              <span>•</span>
              <span>Letztes: ${formatDate(lastSession.date)}</span>
              <span>•</span>
              <span>Erstes: ${formatDate(firstSession.date)}</span>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            ${is1RMCount > 0 ? `<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">${is1RMCount} 1RM</span>` : ''}
            <button onclick="showExerciseDetails('${exerciseName}')" 
                    class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">${totalSets}</div>
            <div class="text-sm text-gray-600">Gesamt Sets</div>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">${avgReps}</div>
            <div class="text-sm text-gray-600">Ø Wiederholungen</div>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">${avgWeight} kg</div>
            <div class="text-sm text-gray-600">Ø Gewicht</div>
          </div>
          <div class="bg-gray-50 p-3 rounded-lg">
            <div class="text-2xl font-bold text-gray-900">${oneRMWeight ? oneRMWeight + ' kg' : '—'}</div>
            <div class="text-sm text-gray-600">1RM / Max Gewicht</div>
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-gray-200">
          <div class="flex justify-between items-center mb-3">
            <h4 class="text-sm font-medium text-gray-900">Letzte Trainings</h4>
            <span class="text-xs text-gray-500">Fortschritt: ${formatDate(firstSession.date)} → ${formatDate(lastSession.date)}</span>
          </div>
          <div class="space-y-2">
            ${exercises
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 3)
              .map(training => `
                <div class="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <div class="flex items-center space-x-3">
                    <span class="text-sm font-medium text-gray-900">${formatDate(training.date)}</span>
                    <span class="text-xs text-gray-500">${training.sets.length} Sets</span>
                    ${training.is1RM ? '<span class="bg-red-100 text-red-800 text-xs px-1 py-0.5 rounded">1RM</span>' : ''}
                    ${training.inWorkout ? '<span class="bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded">Workout</span>' : ''}
                  </div>
                  <div class="text-xs text-gray-600 max-w-32 truncate">
                    ${formatSetsIntelligently(training.sets)}
                  </div>
                </div>
              `).join('')}
          </div>
          ${exercises.length > 3 ? `
            <div class="mt-3 text-center">
              <button onclick="showExerciseDetails('${exerciseName}')" 
                      class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Alle ${exercises.length} Trainings anzeigen →
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function renderTrainingMode() {
  if (appData.exercises.length === 0) {
    return `
      <div class="p-8 text-center">
        <div class="text-4xl mb-4">🏋️‍♂️</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Noch keine Trainings</h3>
        <p class="text-gray-500 mb-4">Füge dein erstes Training hinzu!</p>
        <button onclick="showAddExerciseModal()" 
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          Erstes Training hinzufügen
        </button>
      </div>
    `;
  }
  // Gruppiere Übungen nach Namen
  const exerciseGroups = {};
  appData.exercises.forEach(exercise => {
    if (!exerciseGroups[exercise.exercise]) {
      exerciseGroups[exercise.exercise] = [];
    }
    exerciseGroups[exercise.exercise].push(exercise);
  });
  // Sortiere nach Standard-Übungen
  const sortedExercises = sortExercisesByDefaultOrder(Object.entries(exerciseGroups));
  return sortedExercises.map(([exerciseName, exercises]) => {
    const lastSession = exercises.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    
    // Finde 1RM falls vorhanden
    let oneRMWeight = null;
    exercises.forEach(ex => {
      if (ex.is1RM) {
        const oneRMSets = ex.sets.map(set => set.weight);
        const maxOneRM = Math.max(...oneRMSets);
        if (!oneRMWeight || maxOneRM > oneRMWeight) {
          oneRMWeight = maxOneRM;
        }
      }
    });

    return `
      <div class="p-4 hover:bg-gray-50 transition-colors">
        <div class="flex justify-between items-start mb-3">
          <div class="flex-1">
            <h3 class="text-lg font-semibold text-gray-900">${exerciseName}</h3>
            <div class="text-sm text-gray-500">
              Letztes: ${formatDate(lastSession.date)} • ${lastSession.sets.length} Sets
            </div>
          </div>
          ${oneRMWeight ? `
            <div class="text-right">
              <div class="text-lg font-bold text-red-600">${oneRMWeight} kg</div>
              <div class="text-xs text-gray-500">1RM</div>
            </div>
          ` : ''}
        </div>
        
        <div class="space-y-2">
          ${exercises
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 2)
            .map(training => `
              <div class="p-2 bg-gray-50 rounded text-sm group relative">
                <div class="flex justify-between items-start">
                  <div class="flex items-center space-x-2">
                    <span class="font-medium">${formatDate(training.date)}</span>
                    ${training.is1RM ? '<span class="bg-red-100 text-red-800 text-xs px-1 py-0.5 rounded">1RM</span>' : ''}
                    ${training.inWorkout ? '<span class="bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded">W</span>' : ''}
                  </div>
                  <div class="flex items-center space-x-1">
                    <div class="flex flex-col items-end space-y-1">
                      <div class="text-gray-600 font-mono text-right">
                        ${formatSetsIntelligently(training.sets)}
                      </div>
                      ${training.notes ? `
                        <div class="text-gray-600 italic text-xs text-right">
                          📝 ${training.notes}
                        </div>
                      ` : ''}
                    </div>
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onclick="showTrainingContextMenu('${training.id}', event)" 
                              class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200">
                        ⋯
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
        </div>
        
        ${exercises.length > 2 ? `
          <div class="mt-3 pt-3 border-t border-gray-200">
            <button onclick="toggleTrainingHistory('${exerciseName}')" 
                    class="w-full text-left text-gray-500 hover:text-blue-600 text-sm flex items-center justify-between transition-colors">
              <span>Alle ${exercises.length} Trainings anzeigen</span>
              <svg id="toggle-icon-${exerciseName.replace(/\s+/g, '-')}" class="w-4 h-4 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </div>
        ` : ''}
        
        <!-- Ausgeklappte Historie -->
        <div id="training-history-${exerciseName.replace(/\s+/g, '-')}" class="hidden mt-3 pt-3 border-t border-gray-200">
          <div class="space-y-2">
            ${exercises
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(2)
              .map(training => `
                <div class="p-2 bg-gray-50 rounded text-sm group relative">
                  <div class="flex justify-between items-start">
                    <div class="flex items-center space-x-2">
                      <span class="font-medium">${formatDate(training.date)}</span>
                      ${training.is1RM ? '<span class="bg-red-100 text-red-800 text-xs px-1 py-0.5 rounded">1RM</span>' : ''}
                      ${training.inWorkout ? '<span class="bg-green-100 text-green-800 text-xs px-1 py-0.5 rounded">W</span>' : ''}
                    </div>
                    <div class="flex items-center space-x-1">
                      <div class="flex flex-col items-end space-y-1">
                        <div class="text-gray-600 font-mono text-right">
                          ${formatSetsIntelligently(training.sets)}
                        </div>
                        ${training.notes ? `
                          <div class="text-gray-600 italic text-xs text-right">
                            📝 ${training.notes}
                          </div>
                        ` : ''}
                      </div>
                      <div class="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="showTrainingContextMenu('${training.id}', event)" 
                                class="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-200">
                          ⋯
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderExerciseList() {
  if (appData.exercises.length === 0) {
    return `
      <div class="p-8 text-center">
        <div class="text-4xl mb-4">🏋️‍♂️</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Noch keine Trainings</h3>
        <p class="text-gray-500 mb-4">Füge dein erstes Training hinzu!</p>
        <button onclick="showAddExerciseModal()" 
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
          Erstes Training hinzufügen
        </button>
      </div>
    `;
  }

  return appData.exercises
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(exercise => `
      <div class="p-6 hover:bg-gray-50 transition-colors">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">${formatDate(exercise.date)}</h3>
            <p class="text-sm text-gray-500">${exercise.exercise}</p>
          </div>
          <div class="flex items-center space-x-2">
            ${exercise.inWorkout ? '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Im Workout</span>' : ''}
            ${exercise.is1RM ? '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">1RM</span>' : ''}
            <button onclick="editExercise('${exercise.id}')" 
                    class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button onclick="deleteExercise('${exercise.id}')" 
                    class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="space-y-2">
          ${exercise.sets.map((set, index) => `
            <div class="flex items-center space-x-4 text-sm">
              <span class="text-sm font-medium text-gray-500 min-w-[3rem]">Set ${index + 1}</span>
              <span class="bg-gray-100 px-2 py-1 rounded">${set.reps} Wdh.</span>
              <span class="bg-gray-100 px-2 py-1 rounded">${set.weight} kg</span>
              ${set.notes ? `<span class="text-gray-600 italic">"${set.notes}"</span>` : ''}
            </div>
          `).join('')}
        </div>
        
        ${exercise.notes ? `<p class="mt-3 text-sm text-gray-600 italic">"${exercise.notes}"</p>` : ''}
      </div>
    `).join('');
}

function renderAddExerciseModal() {
  return `
    <div id="add-exercise-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Training hinzufügen</h3>
              <button onclick="hideAddExerciseModal()" 
                      class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          
          <form id="exercise-form" class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Datum</label>
              <input type="date" id="exercise-date" required 
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     value="${new Date().toISOString().split('T')[0]}">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Übung</label>
              <input type="text" id="exercise-name" list="exercise-datalist" required 
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     placeholder="Übung auswählen oder eingeben">
              <datalist id="exercise-datalist">
                ${getAllAvailableExercises().map(ex => `<option value="${ex}">`).join('')}
              </datalist>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sets</label>
              <div id="sets-container" class="space-y-2">
                <div class="set-row grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                  <div class="text-sm font-medium text-gray-600 text-center">1</div>
                  <input type="number" min="1" placeholder="Wdh." class="border border-gray-300 rounded-lg px-3 py-2" required>
                  <input type="number" min="0" step="0.1" placeholder="kg" class="border border-gray-300 rounded-lg px-3 py-2" required>
                  <input type="text" placeholder="Notizen" class="border border-gray-300 rounded-lg px-3 py-2">
                  <button type="button" onclick="removeSet(this)" class="text-red-600 hover:text-red-800 px-2 py-2 rounded-lg hover:bg-red-50">×</button>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 mt-2">
                <button type="button" onclick="addSet()" class="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-300 rounded-lg hover:bg-blue-50">+ Set hinzufügen</button>
                <button type="button" onclick="addMultipleSets(3)" class="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-300 rounded-lg hover:bg-green-50">+ 3 Sets</button>
                <button type="button" onclick="addMultipleSets(5)" class="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-300 rounded-lg hover:bg-green-50">+ 5 Sets</button>
                <button type="button" onclick="addMultipleSets(7)" class="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-300 rounded-lg hover:bg-green-50">+ 7 Sets</button>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <label class="flex items-center">
                <input type="checkbox" id="in-workout" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="ml-2 text-sm text-gray-700">Im Workout abgerufen</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="is-1rm" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="ml-2 text-sm text-gray-700">1RM Versuch</span>
              </label>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
              <textarea id="exercise-notes" rows="3" 
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optionale Notizen zum Training..."></textarea>
            </div>
            
            <div class="flex space-x-3 pt-4">
              <button type="button" onclick="hideAddExerciseModal()" 
                      class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors">
                Abbrechen
              </button>
              <button type="submit" 
                      class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                Speichern
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsModal() {
  return `
    <div id="settings-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
          <div class="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Einstellungen</h3>
              <button onclick="hideSettingsModal()" 
                      class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="p-6 space-y-6 overflow-y-auto flex-1">
            <!-- Standard-Übungen -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Standard-Übungen</label>
              <textarea id="default-exercises" rows="4" 
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Eine Übung pro Zeile">${appData.settings.defaultExercises.join('\n')}</textarea>
            </div>
            
            <!-- Daten-Management -->
            <div class="border-t border-gray-200 pt-4">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Daten-Management</h4>
              <div class="space-y-3">
                <button onclick="exportData()" 
                        class="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                  <span>📥</span>
                  <span>Daten exportieren</span>
                </button>
                <button onclick="hideSettingsModal(); showImportModal();" 
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                  <span>📤</span>
                  <span>Daten importieren</span>
                </button>
              </div>
            </div>
            
            <!-- Login-Daten -->
            <div class="border-t border-gray-200 pt-4">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Login-Daten</h4>
              <div class="space-y-3 text-sm">
                <div class="bg-blue-50 p-3 rounded-lg">
                  <div class="font-medium text-blue-900 mb-1">Gist-ID</div>
                  <div class="text-blue-700 font-mono break-all">${localStorage.getItem('cf_log_gist_id') || 'Nicht verfügbar'}</div>
                  <button onclick="copyToClipboard('${localStorage.getItem('cf_log_gist_id') || ''}')" 
                          class="text-blue-600 hover:text-blue-800 text-xs mt-1">
                    📋 Kopieren
                  </button>
                </div>
                <div class="bg-green-50 p-3 rounded-lg">
                  <div class="font-medium text-green-900 mb-1">GitHub Token</div>
                  <div class="text-green-700 font-mono break-all">
                    ${localStorage.getItem('cf_log_token') ? 
                      localStorage.getItem('cf_log_token').substring(0, 8) + '••••••••••••••••' : 
                      'Nicht verfügbar'}
                  </div>
                  <div class="flex space-x-2 mt-1">
                    <button onclick="copyToClipboard('${localStorage.getItem('cf_log_token') || ''}')" 
                            class="text-green-600 hover:text-green-800 text-xs">
                      📋 Kopieren
                    </button>
                    <button onclick="toggleTokenVisibility()" 
                            class="text-green-600 hover:text-green-800 text-xs">
                      👁️ Anzeigen
                    </button>
                  </div>
                </div>
                <div class="bg-yellow-50 p-3 rounded-lg">
                  <div class="text-yellow-800 text-xs">
                    💡 <strong>Tipp:</strong> Speichere diese Daten sicher ab! Ohne sie kannst du dich nicht wieder einloggen.
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Statistiken -->
            <div class="border-t border-gray-200 pt-4">
              <h4 class="text-sm font-medium text-gray-900 mb-3">Statistiken</h4>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="bg-gray-50 p-3 rounded-lg">
                  <div class="text-lg font-bold text-gray-900">${appData.exercises.length}</div>
                  <div class="text-gray-600">Trainings</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <div class="text-lg font-bold text-gray-900">${getUniqueExerciseCount()}</div>
                  <div class="text-gray-600">Übungen</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <div class="text-lg font-bold text-gray-900">${getTotalSets()}</div>
                  <div class="text-gray-600">Sets</div>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg">
                  <div class="text-lg font-bold text-gray-900">${getLastTrainingDate()}</div>
                  <div class="text-gray-600">Letztes</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="px-6 py-4 border-t border-gray-200 flex-shrink-0">
            <div class="flex space-x-3">
              <button onclick="hideSettingsModal()" 
                      class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors">
                Schließen
              </button>
              <button onclick="saveSettings()" 
                      class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                Speichern
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  `;
}

function renderImportModal() {
  return `
    <div id="import-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Daten importieren</h3>
              <button onclick="hideImportModal()" 
                      class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">JSON-Datei auswählen</label>
              <input type="file" id="import-file" accept=".json" 
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <div class="text-sm text-gray-600">
              <p>Unterstützte Formate:</p>
              <ul class="list-disc list-inside mt-1 space-y-1">
                <li>cf-log Export</li>
                <li>Einfaches JSON-Array mit Trainingsdaten</li>
              </ul>
            </div>
            
            <div class="flex space-x-3 pt-4">
              <button onclick="hideImportModal()" 
                      class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors">
                Abbrechen
              </button>
              <button onclick="importData()" 
                      class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                Importieren
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Modal Functions
function showAddExerciseModal() {
  document.getElementById('add-exercise-modal').classList.remove('hidden');
  
  // Datalist mit aktuellen Übungen aktualisieren
  setTimeout(() => {
    const datalist = document.getElementById('exercise-datalist');
    if (datalist) {
      datalist.innerHTML = getAllAvailableExercises().map(ex => `<option value="${ex}">`).join('');
    }
  }, 100);
}

function hideAddExerciseModal() {
  document.getElementById('add-exercise-modal').classList.add('hidden');
}

function showSettingsModal() {
  document.getElementById('settings-modal').classList.remove('hidden');
}

function hideSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

function showImportModal() {
  document.getElementById('import-modal').classList.remove('hidden');
}

function hideImportModal() {
  document.getElementById('import-modal').classList.add('hidden');
}

function showExerciseDetails(exerciseName) {
  // Filtere alle Trainings für diese Übung
  const exerciseTrainings = appData.exercises
    .filter(ex => ex.exercise === exerciseName)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  // Erstelle Modal HTML
  const modalHTML = `
    <div id="exercise-details-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-xl font-semibold text-gray-900">${exerciseName} - Details</h3>
              <button onclick="hideExerciseDetails()" 
                      class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div class="bg-blue-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-blue-900">${exerciseTrainings.length}</div>
                <div class="text-sm text-blue-700">Trainingseinheiten</div>
              </div>
              <div class="bg-green-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-green-900">${exerciseTrainings.reduce((sum, ex) => sum + ex.sets.length, 0)}</div>
                <div class="text-sm text-green-700">Gesamt Sets</div>
              </div>
              <div class="bg-purple-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-purple-900">${exerciseTrainings.filter(ex => ex.is1RM).length}</div>
                <div class="text-sm text-purple-700">1RM Versuche</div>
              </div>
              <div class="bg-orange-50 p-4 rounded-lg">
                <div class="text-2xl font-bold text-orange-900">${exerciseTrainings.filter(ex => ex.inWorkout).length}</div>
                <div class="text-sm text-orange-700">Im Workout</div>
              </div>
            </div>
            
            <div class="space-y-4">
              <h4 class="text-lg font-semibold text-gray-900">Trainingsverlauf</h4>
              ${exerciseTrainings.map(training => `
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <div class="font-medium text-gray-900">${formatDate(training.date)}</div>
                      <div class="text-sm text-gray-500">${training.sets.length} Sets</div>
                    </div>
                    <div class="flex items-center space-x-2">
                      ${training.is1RM ? '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">1RM</span>' : ''}
                      ${training.inWorkout ? '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Workout</span>' : ''}
                      <button onclick="editExercise('${training.id}')" 
                              class="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button onclick="deleteExercise('${training.id}')" 
                              class="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div class="space-y-2">
                    ${training.sets.map((set, index) => `
                      <div class="flex items-center space-x-4 text-sm">
                        <span class="text-sm font-medium text-gray-500 min-w-[3rem]">Set ${index + 1}</span>
                        <span class="bg-gray-100 px-2 py-1 rounded">${set.reps} Wdh.</span>
                        <span class="bg-gray-100 px-2 py-1 rounded">${set.weight} kg</span>
                        ${set.notes ? `<span class="text-gray-600 italic">"${set.notes}"</span>` : ''}
                      </div>
                    `).join('')}
                  </div>
                  
                  ${training.notes ? `<p class="mt-3 text-sm text-gray-600 italic">"${training.notes}"</p>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Modal zum DOM hinzufügen
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function hideExerciseDetails() {
  const modal = document.getElementById('exercise-details-modal');
  if (modal) {
    modal.remove();
  }
}

function showEditExerciseModal(exercise) {
  // Erstelle Modal HTML
  const modalHTML = `
    <div id="edit-exercise-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">Training bearbeiten</h3>
              <button onclick="hideEditExerciseModal()" 
                      class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          
          <form id="edit-exercise-form" class="p-6 space-y-4">
            <input type="hidden" id="edit-exercise-id" value="${exercise.id}">
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Datum</label>
              <input type="date" id="edit-exercise-date" required 
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     value="${exercise.date}">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Übung</label>
              <input type="text" id="edit-exercise-name" list="edit-exercise-datalist" required 
                     class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     value="${exercise.exercise}">
              <datalist id="edit-exercise-datalist">
                ${getAllAvailableExercises().map(ex => `<option value="${ex}">`).join('')}
              </datalist>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Sets</label>
              <div id="edit-sets-container" class="space-y-2">
                ${exercise.sets.map((set, index) => `
                  <div class="edit-set-row grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                    <div class="text-sm font-medium text-gray-600 text-center">${index + 1}</div>
                    <input type="number" min="1" placeholder="Wdh." class="border border-gray-300 rounded-lg px-3 py-2" value="${set.reps}" required>
                    <input type="number" min="0" step="0.1" placeholder="kg" class="border border-gray-300 rounded-lg px-3 py-2" value="${set.weight}" required>
                    <input type="text" placeholder="Notizen" class="border border-gray-300 rounded-lg px-3 py-2" value="${set.notes || ''}">
                    <button type="button" onclick="removeEditSet(this)" class="text-red-600 hover:text-red-800 px-2 py-2 rounded-lg hover:bg-red-50">×</button>
                  </div>
                `).join('')}
              </div>
              <div class="flex flex-wrap gap-2 mt-2">
                <button type="button" onclick="addEditSet()" class="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-300 rounded-lg hover:bg-blue-50">+ Set hinzufügen</button>
                <button type="button" onclick="addMultipleEditSets(3)" class="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-300 rounded-lg hover:bg-green-50">+ 3 Sets</button>
                <button type="button" onclick="addMultipleEditSets(5)" class="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-300 rounded-lg hover:bg-green-50">+ 5 Sets</button>
                <button type="button" onclick="addMultipleEditSets(7)" class="text-green-600 hover:text-green-800 text-sm px-3 py-1 border border-green-300 rounded-lg hover:bg-green-50">+ 7 Sets</button>
              </div>
            </div>
            
            <div class="flex items-center space-x-4">
              <label class="flex items-center">
                <input type="checkbox" id="edit-in-workout" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" ${exercise.inWorkout ? 'checked' : ''}>
                <span class="ml-2 text-sm text-gray-700">Im Workout abgerufen</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" id="edit-is-1rm" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" ${exercise.is1RM ? 'checked' : ''}>
                <span class="ml-2 text-sm text-gray-700">1RM Versuch</span>
              </label>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Notizen</label>
              <textarea id="edit-exercise-notes" rows="3" 
                        class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Optionale Notizen zum Training...">${exercise.notes || ''}</textarea>
            </div>
            
            <div class="flex space-x-3 pt-4">
              <button type="button" onclick="hideEditExerciseModal()" 
                      class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors">
                Abbrechen
              </button>
              <button type="submit" 
                      class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                Speichern
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Modal zum DOM hinzufügen
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Event Listener für das Formular
  document.getElementById('edit-exercise-form').addEventListener('submit', async (e) => {
  e.preventDefault();

    const id = document.getElementById('edit-exercise-id').value;
    const date = document.getElementById('edit-exercise-date').value;
    const exerciseName = document.getElementById('edit-exercise-name').value.trim();
    const inWorkout = document.getElementById('edit-in-workout').checked;
    const is1RM = document.getElementById('edit-is-1rm').checked;
    const notes = document.getElementById('edit-exercise-notes').value.trim();
    
    const sets = [];
    const setRows = document.querySelectorAll('#edit-sets-container > div');
    for (const row of setRows) {
      const inputs = row.querySelectorAll('input');
    const reps = inputs[0].value;
    const weight = inputs[1].value;
      const setNotes = inputs[2].value.trim();
      
      if (reps && weight) {
        sets.push({
          reps: parseInt(reps),
          weight: parseFloat(weight),
          notes: setNotes || null
        });
      }
    }
    
    if (!date || !exerciseName || sets.length === 0) {
      showNotification('Bitte alle Pflichtfelder ausfüllen!', 'error');
      return;
    }
    
    // Training aktualisieren
    const exerciseIndex = appData.exercises.findIndex(e => e.id === id);
    if (exerciseIndex !== -1) {
      appData.exercises[exerciseIndex] = {
        ...appData.exercises[exerciseIndex],
        date,
        exercise: exerciseName,
        sets,
        inWorkout,
        is1RM,
        notes: notes || null
      };
      
      await saveData();
      hideEditExerciseModal();
      renderDashboard();
      showNotification('Training erfolgreich aktualisiert!', 'success');
    }
  });
}

function hideEditExerciseModal() {
  const modal = document.getElementById('edit-exercise-modal');
  if (modal) {
    modal.remove();
  }
}

function addEditSet() {
  const container = document.getElementById('edit-sets-container');
  const existingSets = container.querySelectorAll('.edit-set-row');
  const setNumber = existingSets.length + 1;
  
  // Werte des letzten Sets holen (falls vorhanden)
  let lastReps = '';
  let lastWeight = '';
  let lastNotes = '';
  
  if (existingSets.length > 0) {
    const lastSet = existingSets[existingSets.length - 1];
    const inputs = lastSet.querySelectorAll('input');
    lastReps = inputs[0].value;
    lastWeight = inputs[1].value;
    lastNotes = inputs[2].value;
  }
  
  const setDiv = document.createElement('div');
  setDiv.className = 'edit-set-row grid grid-cols-1 sm:grid-cols-5 gap-2 items-center';
  setDiv.innerHTML = `
    <div class="text-sm font-medium text-gray-600 text-center">${setNumber}</div>
    <input type="number" min="1" placeholder="Wdh." class="border border-gray-300 rounded-lg px-3 py-2" required value="${lastReps}">
    <input type="number" min="0" step="0.1" placeholder="kg" class="border border-gray-300 rounded-lg px-3 py-2" required value="${lastWeight}">
    <input type="text" placeholder="Notizen" class="border border-gray-300 rounded-lg px-3 py-2" value="${lastNotes}">
    <button type="button" onclick="removeEditSet(this)" class="text-red-600 hover:text-red-800 px-2 py-2 rounded-lg hover:bg-red-50">×</button>
  `;
  container.appendChild(setDiv);
  
  // Set-Nummern aktualisieren
  updateEditSetNumbers();
}

function removeEditSet(button) {
  button.parentElement.remove();
  updateEditSetNumbers();
}

function updateEditSetNumbers() {
  const container = document.getElementById('edit-sets-container');
  if (!container) return;
  
  const setRows = container.querySelectorAll('.edit-set-row');
  setRows.forEach((row, index) => {
    const numberDiv = row.querySelector('div');
    if (numberDiv) {
      numberDiv.textContent = index + 1;
    }
  });
}

function showTrainingContextMenu(exerciseId, event) {
  event.stopPropagation();
  
  // Entferne bestehende Kontextmenüs
  const existingMenus = document.querySelectorAll('.context-menu');
  existingMenus.forEach(menu => menu.remove());
  
  const exercise = appData.exercises.find(e => e.id === exerciseId);
  if (!exercise) return;
  
  const menuHTML = `
    <div class="context-menu fixed bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-32">
      <button onclick="showTrainingDetails('${exerciseId}'); hideContextMenu();" 
              class="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center space-x-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
        </svg>
        <span>Details</span>
      </button>
      <button onclick="editExercise('${exerciseId}'); hideContextMenu();" 
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        <span>Bearbeiten</span>
      </button>
      <button onclick="deleteExercise('${exerciseId}'); hideContextMenu();" 
              class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        <span>Löschen</span>
      </button>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', menuHTML);
  
  const menu = document.querySelector('.context-menu');
  const rect = event.target.getBoundingClientRect();
  
  // Positioniere das Menü nach innen
  const menuWidth = 140; // Geschätzte Breite des Menüs
  const viewportWidth = window.innerWidth;
  
  // Prüfe, ob das Menü nach rechts hinausragen würde
  if (rect.right + menuWidth + 5 > viewportWidth) {
    // Positioniere nach links (nach innen)
    menu.style.left = `${rect.left - menuWidth - 5}px`;
  } else {
    // Positioniere nach rechts (normal)
    menu.style.left = `${rect.right + 5}px`;
  }
  
  menu.style.top = `${rect.top}px`;
  
  // Schließe Menü beim Klick außerhalb
  setTimeout(() => {
    document.addEventListener('click', hideContextMenu, { once: true });
  }, 100);
}

function hideContextMenu() {
  const menus = document.querySelectorAll('.context-menu');
  menus.forEach(menu => menu.remove());
}

function showTrainingDetails(exerciseId) {
  const exercise = appData.exercises.find(e => e.id === exerciseId);
  if (!exercise) return;
  
  const modalHTML = `
    <div id="training-details-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-xl font-semibold text-gray-900">Training Details</h3>
              <button onclick="hideTrainingDetails()" 
                      class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="p-6">
            <div class="mb-6">
              <h4 class="text-lg font-semibold text-gray-900 mb-2">${exercise.exercise}</h4>
              <div class="flex items-center space-x-4 text-sm text-gray-500">
                <span>${formatDate(exercise.date)}</span>
                <span>•</span>
                <span>${exercise.sets.length} Sets</span>
                ${exercise.is1RM ? '<span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">1RM</span>' : ''}
                ${exercise.inWorkout ? '<span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Workout</span>' : ''}
              </div>
            </div>
            
            <div class="space-y-4">
              <div>
                <h5 class="text-md font-medium text-gray-900 mb-3">Sets</h5>
                <div class="space-y-2">
                  ${exercise.sets.map((set, index) => `
                    <div class="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <span class="text-sm font-medium text-gray-500">Set ${index + 1}</span>
                      <span class="bg-gray-100 px-3 py-1 rounded text-sm">${set.reps} Wdh.</span>
                      <span class="bg-gray-100 px-3 py-1 rounded text-sm">${set.weight} kg</span>
                      ${set.notes ? `<span class="text-gray-600 italic text-sm">"${set.notes}"</span>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
              
              ${exercise.notes ? `
                <div>
                  <h5 class="text-md font-medium text-gray-900 mb-2">Notizen</h5>
                  <p class="text-gray-600 italic bg-gray-50 p-3 rounded-lg">"${exercise.notes}"</p>
                </div>
              ` : ''}
            </div>
            
            <div class="mt-6 pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button onclick="editExercise('${exerciseId}'); hideTrainingDetails();" 
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium">
                Bearbeiten
              </button>
              <button onclick="hideTrainingDetails()" 
                      class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium">
                Schließen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function hideTrainingDetails() {
  const modal = document.getElementById('training-details-modal');
  if (modal) {
    modal.remove();
  }
}

function copyToClipboard(text) {
  if (!text) {
    showNotification('Nichts zum Kopieren verfügbar!', 'error');
    return;
  }
  
  navigator.clipboard.writeText(text).then(() => {
    showNotification('In Zwischenablage kopiert!', 'success');
  }).catch(err => {
    // Fallback für ältere Browser
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      showNotification('In Zwischenablage kopiert!', 'success');
    } catch (err) {
      showNotification('Kopieren fehlgeschlagen!', 'error');
    }
    document.body.removeChild(textArea);
  });
}

function toggleTokenVisibility() {
  const token = localStorage.getItem('cf_log_token');
  if (!token) {
    showNotification('Kein Token verfügbar!', 'error');
    return;
  }
  
  // Modal zum Anzeigen des Tokens
  const modalHTML = `
    <div id="token-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 z-50">
      <div class="flex items-center justify-center min-h-screen p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900">GitHub Token</h3>
              <button onclick="hideTokenModal()" 
                      class="text-gray-400 hover:text-gray-600">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          
          <div class="p-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="font-mono text-sm break-all">${token}</div>
            </div>
            <div class="mt-4 text-sm text-gray-600">
              ⚠️ <strong>Achtung:</strong> Teile diesen Token niemals mit anderen!
            </div>
          </div>
          
          <div class="px-6 py-4 border-t border-gray-200 flex space-x-3">
            <button onclick="copyToClipboard('${token}')" 
                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
              📋 Kopieren
            </button>
            <button onclick="hideTokenModal()" 
                    class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 px-4 rounded-lg font-medium transition-colors">
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function hideTokenModal() {
  const modal = document.getElementById('token-modal');
  if (modal) {
    modal.remove();
  }
}

function setupModalEventListeners() {
  // Exercise Form
  document.getElementById('exercise-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const date = document.getElementById('exercise-date').value;
    const exercise = document.getElementById('exercise-name').value.trim();
    const inWorkout = document.getElementById('in-workout').checked;
    const is1RM = document.getElementById('is-1rm').checked;
    const notes = document.getElementById('exercise-notes').value.trim();
    
    const sets = [];
    const setRows = document.querySelectorAll('#sets-container > div');
    for (const row of setRows) {
      const inputs = row.querySelectorAll('input');
      const reps = inputs[0].value;
      const weight = inputs[1].value;
      const setNotes = inputs[2].value.trim();
      
      if (reps && weight) {
        sets.push({
          reps: parseInt(reps),
          weight: parseFloat(weight),
          notes: setNotes || null
        });
      }
    }

  if (!date || !exercise || sets.length === 0) {
      showNotification('Bitte alle Pflichtfelder ausfüllen!', 'error');
    return;
  }

    // Automatisch neue Übung zur Standard-Liste hinzufügen
    if (!appData.settings.defaultExercises.includes(exercise)) {
      appData.settings.defaultExercises.push(exercise);
      showNotification(`Neue Übung "${exercise}" wurde zur Standard-Liste hinzugefügt!`, 'info');
    }
    
    const newExercise = {
      id: generateId(),
      date,
      exercise,
      sets,
      inWorkout,
      is1RM,
      notes: notes || null
    };
    
    appData.exercises.push(newExercise);
    await saveData();
    
    hideAddExerciseModal();
    renderDashboard();
    showNotification('Training erfolgreich gespeichert!', 'success');
  });
}

// Utility Functions
function addSet() {
  const container = document.getElementById('sets-container');
  const existingSets = container.querySelectorAll('.set-row');
  const setNumber = existingSets.length + 1;
  
  // Werte des letzten Sets holen (falls vorhanden)
  let lastReps = '';
  let lastWeight = '';
  let lastNotes = '';
  
  if (existingSets.length > 0) {
    const lastSet = existingSets[existingSets.length - 1];
    const inputs = lastSet.querySelectorAll('input');
    lastReps = inputs[0].value;
    lastWeight = inputs[1].value;
    lastNotes = inputs[2].value;
  }
  
  const setDiv = document.createElement('div');
  setDiv.className = 'set-row grid grid-cols-1 sm:grid-cols-5 gap-2 items-center';
  setDiv.innerHTML = `
    <div class="text-sm font-medium text-gray-600 text-center">${setNumber}</div>
    <input type="number" min="1" placeholder="Wdh." class="border border-gray-300 rounded-lg px-3 py-2" required value="${lastReps}">
    <input type="number" min="0" step="0.1" placeholder="kg" class="border border-gray-300 rounded-lg px-3 py-2" required value="${lastWeight}">
    <input type="text" placeholder="Notizen" class="border border-gray-300 rounded-lg px-3 py-2" value="${lastNotes}">
    <button type="button" onclick="removeSet(this)" class="text-red-600 hover:text-red-800 px-2 py-2 rounded-lg hover:bg-red-50">×</button>
  `;
  container.appendChild(setDiv);
  
  // Set-Nummern aktualisieren
  updateSetNumbers();
}

function updateSetNumbers() {
  const container = document.getElementById('sets-container');
  const setRows = container.querySelectorAll('.set-row');
  setRows.forEach((row, index) => {
    const numberDiv = row.querySelector('div');
    if (numberDiv) {
      numberDiv.textContent = index + 1;
    }
  });
}

function removeSet(button) {
  button.parentElement.remove();
  updateSetNumbers();
}

function editExercise(id) {
  const exercise = appData.exercises.find(e => e.id === id);
  if (!exercise) return;
  
  // Modal zum Bearbeiten anzeigen
  showEditExerciseModal(exercise);
}

function deleteExercise(id) {
  if (!confirm('Möchtest du dieses Training wirklich löschen?')) return;
  
  appData.exercises = appData.exercises.filter(e => e.id !== id);
  saveData();
  renderDashboard();
  showNotification('Training gelöscht!', 'success');
}

function saveSettings() {
  const defaultExercises = document.getElementById('default-exercises').value
    .split('\n')
    .map(ex => ex.trim())
    .filter(ex => ex.length > 0);
  
  appData.settings.defaultExercises = defaultExercises;
  saveData();
  hideSettingsModal();
  renderDashboard(); // UI aktualisieren
  showNotification('Einstellungen gespeichert!', 'success');
}

function exportData() {
  const dataStr = JSON.stringify(appData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `cf-log-export-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  
  URL.revokeObjectURL(url);
  showNotification('Daten exportiert!', 'success');
}

function importData() {
  const fileInput = document.getElementById('import-file');
  const file = fileInput.files[0];
  
  if (!file) {
    showNotification('Bitte eine Datei auswählen!', 'error');
    return;
  }
  
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      
      // Handle different import formats
      if (Array.isArray(importedData)) {
        // Simple array format
        const exercises = importedData.map(item => ({
          id: generateId(),
          date: item.date || item.datum || new Date().toISOString().split('T')[0],
          exercise: item.exercise || item.uebung || 'Unbekannte Übung',
          sets: Array.isArray(item.sets) ? item.sets : [],
          inWorkout: item.inWorkout || item.im_workout || false,
          is1RM: item.is1RM || item.is_1rm || false,
          notes: item.notes || null
        }));
        
        // Neue Übungen zur Standard-Liste hinzufügen
        exercises.forEach(ex => {
          if (!appData.settings.defaultExercises.includes(ex.exercise)) {
            appData.settings.defaultExercises.push(ex.exercise);
          }
        });
        
        appData.exercises = [...appData.exercises, ...exercises];
      } else if (importedData.exercises) {
        // cf-log format
        // Neue Übungen zur Standard-Liste hinzufügen
        importedData.exercises.forEach(ex => {
          if (!appData.settings.defaultExercises.includes(ex.exercise)) {
            appData.settings.defaultExercises.push(ex.exercise);
          }
        });
        
        appData.exercises = [...appData.exercises, ...importedData.exercises];
      } else {
        throw new Error('Unbekanntes Datenformat');
      }
      
      await saveData();
      hideImportModal();
      renderDashboard();
      showNotification(`${importedData.length || importedData.exercises?.length || 0} Trainings importiert!`, 'success');
    } catch (error) {
      showNotification('Fehler beim Importieren: ' + error.message, 'error');
    }
  };
  reader.readAsText(file);
}

function getLastTrainingDate() {
  if (appData.exercises.length === 0) return 'Keine';
  const lastExercise = appData.exercises
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  return formatDate(lastExercise.date);
}

function getTopExercise() {
  if (appData.exercises.length === 0) return 'Keine';
  const exerciseCounts = {};
  appData.exercises.forEach(ex => {
    exerciseCounts[ex.exercise] = (exerciseCounts[ex.exercise] || 0) + 1;
  });
  return Object.entries(exerciseCounts)
    .sort(([,a], [,b]) => b - a)[0][0];
}

function getUniqueExerciseCount() {
  const uniqueExercises = new Set(appData.exercises.map(ex => ex.exercise));
  return uniqueExercises.size;
}

function getTotalSets() {
  return appData.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
}

function toggleYearComparison() {
  const comparisonDiv = document.getElementById('year-comparison');
  const icon = document.getElementById('year-comparison-icon');
  const text = document.getElementById('year-comparison-text');
  
  if (comparisonDiv.classList.contains('hidden')) {
    comparisonDiv.classList.remove('hidden');
    icon.classList.add('rotate-180');
    text.textContent = '📊 Verstecken';
  } else {
    comparisonDiv.classList.add('hidden');
    icon.classList.remove('rotate-180');
    text.textContent = '📊 Jahresvergleich';
  }
}

function renderYearComparison() {
  // Gruppiere Trainings nach Jahr
  const yearGroups = {};
  appData.exercises.forEach(exercise => {
    const year = new Date(exercise.date).getFullYear();
    if (!yearGroups[year]) {
      yearGroups[year] = [];
    }
    yearGroups[year].push(exercise);
  });
  
  // Sortiere Jahre absteigend
  const sortedYears = Object.keys(yearGroups).sort((a, b) => b - a);
  
  if (sortedYears.length === 0) {
    return '<div class="text-sm text-gray-500">Keine Daten verfügbar</div>';
  }
  
  return sortedYears.map(year => {
    const exercises = yearGroups[year];
    const totalTrainings = exercises.length;
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const uniqueExercises = new Set(exercises.map(ex => ex.exercise)).size;
    const is1RMCount = exercises.filter(ex => ex.is1RM).length;
    const inWorkoutCount = exercises.filter(ex => ex.inWorkout).length;
    
    // Berechne Durchschnitt pro Monat
    const months = new Set(exercises.map(ex => ex.date.substring(0, 7))).size;
    const avgPerMonth = months > 0 ? (totalTrainings / months).toFixed(1) : 0;
    
    return `
      <div class="bg-gray-50 p-3 rounded-lg">
        <div class="flex justify-between items-center mb-2">
          <h5 class="font-medium text-gray-900">${year}</h5>
          <span class="text-sm text-gray-500">${totalTrainings} Trainings</span>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div class="flex justify-between">
            <span class="text-gray-600">Sets:</span>
            <span class="font-medium">${totalSets}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Übungen:</span>
            <span class="font-medium">${uniqueExercises}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Ø/Monat:</span>
            <span class="font-medium">${avgPerMonth}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">1RM:</span>
            <span class="font-medium">${is1RMCount}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Workouts:</span>
            <span class="font-medium">${inWorkoutCount}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Monate:</span>
            <span class="font-medium">${months}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function saveData() {
  const token = localStorage.getItem('cf_log_token');
  const gistId = localStorage.getItem('cf_log_gist_id');
  const demoMode = localStorage.getItem('cf_log_demo_mode');
  
  // Im Demo-Modus keine Daten speichern
  if (demoMode === 'true') {
    showNotification('Demo-Modus: Daten werden nicht gespeichert', 'info');
    return;
  }
  
  if (!token || !gistId) return;
  
  try {
    await updateGist(token, gistId, appData);
  } catch (error) {
    showNotification('Fehler beim Speichern: ' + error.message, 'error');
  }
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${
    type === 'success' ? 'bg-green-500 text-white' :
    type === 'error' ? 'bg-red-500 text-white' :
    'bg-blue-500 text-white'
  }`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function logout() {
  const token = localStorage.getItem('cf_log_token');
  const gistId = localStorage.getItem('cf_log_gist_id');
  const demoMode = localStorage.getItem('cf_log_demo_mode');
  
  if (demoMode === 'true') {
    // Demo-Modus beenden
    if (confirm('Demo-Modus beenden?')) {
      localStorage.removeItem('cf_log_demo_mode');
      localStorage.removeItem('cf_log_user_name');
      window.location.reload();
    }
    return;
  }
  
  let message = 'Möchtest du dich wirklich abmelden?\n\n';
  message += '⚠️ Wichtiger Hinweis:\n';
  message += 'Speichere dir deine Login-Daten:\n';
  message += `• Gist-ID: ${gistId}\n`;
  message += `• GitHub Token: ${token ? token.substring(0, 8) + '...' : 'Nicht verfügbar'}\n\n`;
  message += 'Ohne diese Daten kannst du dich nicht wieder einloggen!';
  
  if (confirm(message)) {
    localStorage.removeItem('cf_log_token');
    localStorage.removeItem('cf_log_gist_id');
    localStorage.removeItem('cf_log_user_name');
    window.location.reload();
  }
}

// Main function
async function main() {
  const token = localStorage.getItem('cf_log_token');
  const gistId = localStorage.getItem('cf_log_gist_id');
  const demoMode = localStorage.getItem('cf_log_demo_mode');
  
  // Demo-Modus prüfen
  if (demoMode === 'true') {
    renderDashboard();
    return;
  }
  
  if (!token || !gistId) {
    renderOnboarding();
    return;
  }
  
  try {
    const data = await loadGist(token, gistId);
    appData = { ...appData, ...data };
    renderDashboard();
  } catch (err) {
    showNotification('Fehler beim Laden: ' + err.message, 'error');
    logout();
  }
}

// Initialize app
main();

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
