// notifications.js
export function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

export function showLoading(message) {
  const loading = document.createElement('div');
  loading.className = 'loading-overlay';
  loading.innerHTML = `
    <div class="loading-content">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
  
  document.body.appendChild(loading);
  return loading;
}

export function hideLoading(loadingElement) {
  if (loadingElement) {
    loadingElement.remove();
  }
}