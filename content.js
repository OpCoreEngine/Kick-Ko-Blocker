let blockedCount = 0;
let isEnabled = true;
let observer = null;
let processedCards = new WeakSet();
let debounceTimer = null;

chrome.storage.local.get(['enabled'], function(result) {
  if (result.enabled !== undefined) {
    isEnabled = result.enabled;
  }
  if (isEnabled) {
    setTimeout(() => startBlocking(), 500);
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.enabled) {
    isEnabled = changes.enabled.newValue;
    if (isEnabled) {
      startBlocking();
    } else {
      stopBlocking();
      showAllStreams();
    }
  }
});

function debounce(func, wait) {
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(debounceTimer);
      func(...args);
    };
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(later, wait);
  };
}

function updateBlockedCount() {
  const currentBlocked = document.querySelectorAll('[data-ko-blocked="true"]').length;
  if (currentBlocked !== blockedCount) {
    blockedCount = currentBlocked;
    chrome.storage.local.set({ blockedCount: blockedCount });
    console.log(`Knight Online Blocker: ${blockedCount} yayın gizlendi`);
  }
}

function processCard(card) {
  if (card.hasAttribute('data-ko-processed')) {
    return false;
  }
  
  card.setAttribute('data-ko-processed', 'true');
  
  const categoryLink = card.querySelector('a[href="/category/knight-online"]');
  
  if (categoryLink) {
    card.style.display = 'none';
    card.setAttribute('data-ko-blocked', 'true');
    processedCards.add(card);
    return true;
  }
  
  return false;
}

function hideKnightOnlineStreams() {
  if (!isEnabled) return;
  
  let newBlockedCount = 0;
  const streamCards = document.querySelectorAll('.group\\/card');
  
  streamCards.forEach(card => {
    if (processCard(card)) {
      newBlockedCount++;
    }
  });
  
  if (newBlockedCount > 0) {
    updateBlockedCount();
  }
}

function showAllStreams() {
  const blockedCards = document.querySelectorAll('[data-ko-blocked="true"]');
  blockedCards.forEach(card => {
    card.style.display = '';
    card.removeAttribute('data-ko-blocked');
    card.removeAttribute('data-ko-processed');
  });
  processedCards = new WeakSet();
  blockedCount = 0;
  chrome.storage.local.set({ blockedCount: 0 });
}

const debouncedCheck = debounce(() => {
  hideKnightOnlineStreams();
}, 200);

function createObserver() {
  return new MutationObserver((mutations) => {
    if (!isEnabled) return;
    
    let shouldCheck = false;
    
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === 1) {
            if (node.classList?.contains('group/card') || 
                node.querySelector?.('.group\\/card')) {
              shouldCheck = true;
              break;
            }
          }
        }
      }
      if (shouldCheck) break;
    }
    
    if (shouldCheck) {
      debouncedCheck();
    }
  });
}

function startBlocking() {
  console.log('Knight Online Blocker: Başlatılıyor...');
  
  stopBlocking();
  
  hideKnightOnlineStreams();
  
  observer = createObserver();
  const targetNode = document.querySelector('main') || document.body;
  
  observer.observe(targetNode, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false
  });
  
  setInterval(() => {
    if (isEnabled) {
      hideKnightOnlineStreams();
    }
  }, 3000);
}

function stopBlocking() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopBlocking();
  } else if (isEnabled) {
    setTimeout(() => {
      startBlocking();
    }, 500);
  }
});

// URL değişikliklerini dinle (SPA için)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (isEnabled) {
      setTimeout(() => {
        hideKnightOnlineStreams();
      }, 1000);
    }
  }
}).observe(document, {subtree: true, childList: true});

console.log('Knight Online Stream Blocker yüklendi (v2.0)');