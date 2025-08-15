// Mobile-spezifische UI-Funktionen und Dropdown-Handling

// Show mobile dropdown for exercise selection
function showMobileDropdown(exercises, input, dropdown) {
    if (exercises.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }
    
    dropdown.innerHTML = exercises.map(ex => `
      <div class="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0" 
           onclick="selectExercise('${ex}', '${input.id}')">
        ${ex}
      </div>
    `).join('');
    
    dropdown.classList.remove('hidden');
  }
  
  // Select exercise from mobile dropdown
  function selectExercise(exerciseName, inputId) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById('mobile-exercise-dropdown');
    const editDropdown = document.getElementById('mobile-edit-exercise-dropdown');
    
    if (input) {
      input.value = exerciseName;
      input.focus();
    }
    
    // Hide both dropdowns
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
    if (editDropdown) {
      editDropdown.classList.add('hidden');
    }
  }