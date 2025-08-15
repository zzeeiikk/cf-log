// Utility-Funktionen, Formatierung und Hilfsfunktionen

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
    // Verwende Date.now() für Millisekunden-Präzision
    // und einen Zähler für noch höhere Präzision bei sehr schnellen Aufrufen
    if (!window.idCounter) window.idCounter = 0;
    window.idCounter++;
    
    const timestamp = Date.now();
    const counter = window.idCounter;
    
    // Kombiniere Timestamp und Zähler für eindeutige, sortierbare IDs
    return timestamp.toString(36) + counter.toString(36);
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
  
  // Einfache Markdown-Formatierung für Notizen
  function formatNotes(text) {
    if (!text) return '';
    
    // Erst Listen verarbeiten
    let formatted = text;
    
    // Listen verarbeiten
    const lines = formatted.split('\n');
    const processedLines = [];
    let inList = false;
    let listItems = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('- ')) {
        // Listenpunkt gefunden
        if (!inList) {
          inList = true;
        }
        listItems.push(line.trim().substring(2)); // "- " entfernen
      } else {
        // Kein Listenpunkt
        if (inList && listItems.length > 0) {
          // Liste beenden
          const listHtml = `<ul class="list-disc list-inside space-y-1">${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
          processedLines.push(listHtml);
          listItems = [];
          inList = false;
        }
        processedLines.push(line);
      }
    }
    
    // Letzte Liste verarbeiten
    if (inList && listItems.length > 0) {
      const listHtml = `<ul class="list-disc list-inside space-y-1">${listItems.map(item => `<li>${item}</li>`).join('')}</ul>`;
      processedLines.push(listHtml);
    }
    
    formatted = processedLines.join('\n');
    
    // Dann andere Formatierungen
    return formatted
      // Zeilenumbrüche zu <br> konvertieren (außer bei Listen)
      .replace(/\n/g, '<br>')
      // **text** zu <strong>text</strong> (Fett)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // *text* zu <em>text</em> (Kursiv)
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
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