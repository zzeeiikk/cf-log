// Datenstruktur, globale Variablen und App-State

// Globaler Storage Provider
let currentStorageProvider = null;

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