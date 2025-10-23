// CRITICAL CHAT CONTEXT FIX - Run this in browser console
console.log('🔧 Clearing all browser storage to fix state issues...');

// Clear all storage
localStorage.clear();
sessionStorage.clear();

// Clear any cached data
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
    });
  });
}

// Clear IndexedDB if present
if (window.indexedDB) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      indexedDB.deleteDatabase(db.name);
    });
  });
}

console.log('✅ Storage cleared! Reloading page...');
setTimeout(() => window.location.reload(), 1000);