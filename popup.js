document.addEventListener('DOMContentLoaded', function() {
  const toggleSwitch = document.getElementById('toggleSwitch');
  const statusDiv = document.getElementById('status');
  const statusText = document.getElementById('statusText');
  const blockedCountSpan = document.getElementById('blockedCount');
  const refreshBtn = document.getElementById('refreshBtn');
  
  chrome.storage.local.get(['enabled', 'blockedCount'], function(result) {
    if (result.enabled !== undefined) {
      toggleSwitch.checked = result.enabled;
    } else {
      toggleSwitch.checked = true;
      chrome.storage.local.set({ enabled: true });
    }
    
    updateStatus(toggleSwitch.checked);
    
    if (result.blockedCount !== undefined) {
      blockedCountSpan.textContent = result.blockedCount;
    }
  });
  
  toggleSwitch.addEventListener('change', function() {
    const isEnabled = this.checked;
    chrome.storage.local.set({ enabled: isEnabled });
    updateStatus(isEnabled);
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0].url.includes('kick.com')) {
        chrome.tabs.reload(tabs[0].id);
      }
    });
  });
  
  refreshBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.reload(tabs[0].id);
      window.close();
    });
  });
  
  function updateStatus(isEnabled) {
    if (isEnabled) {
      statusDiv.className = 'status active';
      statusDiv.innerHTML = '✓ Aktif - Knight Online yayınları gizleniyor';
      statusText.textContent = 'Çalışıyor';
      statusText.style.color = '#53fc18';
    } else {
      statusDiv.className = 'status inactive';
      statusDiv.innerHTML = '✗ Pasif - Engelleme kapalı';
      statusText.textContent = 'Durduruldu';
      statusText.style.color = '#ff5555';
    }
  }
  
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.blockedCount) {
      blockedCountSpan.textContent = changes.blockedCount.newValue;
    }
  });
});