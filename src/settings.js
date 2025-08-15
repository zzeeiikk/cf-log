// Settings-Management und Tab-Navigation

// Switch settings tab
function switchSettingsTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.settings-tab-content').forEach(content => {
      content.classList.add('hidden');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.classList.remove('bg-white', 'text-gray-900', 'shadow-sm');
      tab.classList.add('text-gray-600', 'hover:text-gray-900');
    });
    
    // Show selected tab content
    document.getElementById(`tab-content-${tabName}`).classList.remove('hidden');
    
    // Add active class to selected tab
    const activeTab = document.getElementById(`tab-${tabName}`);
    activeTab.classList.add('bg-white', 'text-gray-900', 'shadow-sm');
    activeTab.classList.remove('text-gray-600', 'hover:text-gray-900');
  }