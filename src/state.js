// Globale Zustandsvariablen und State Management

// Global variable to track last edited exercise for highlighting
let lastEditedExerciseId = null;

// Global variable to track expanded training history sections
let expandedSections = new Set();

// PWA Installation Support
let deferredPrompt;
let installButton = null;