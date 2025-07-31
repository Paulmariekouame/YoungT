// Header JavaScript - Young Talent
document.addEventListener('DOMContentLoaded', function() {
    initializeHeader();
});

function initializeHeader() {
    // Initialize all header components
    initializeNavbar();
    initializeSearch();
    initializeNotifications();
    initializeUserMenu();
    initializeLoadingBar();
    initializeFlashMessages();
}

// Navbar functionality
function initializeNavbar() {
    const navbar = document.getElementById('mainNavbar');
    let lastScrollTop = 0;
    
    // Navbar scroll effect
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add scrolled class for styling
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll (optional)
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Mobile menu toggle
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    if (navbarToggler) {
        navbarToggler.addEventListener('click', function() {
            // Add animation class
            navbarCollapse.classList.toggle('show');
        });
    }
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!navbar.contains(e.target) && navbarCollapse.classList.contains('show')) {
            navbarCollapse.classList.remove('show');
        }
    });
}

// Search functionality
function initializeSearch() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchOverlay = document.getElementById('searchOverlay');
    const overlaySearchInput = document.getElementById('overlaySearchInput');
    const searchResults = document.getElementById('searchResults');
    
    let searchTimeout;
    
    // Handle search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        });
    }
    
    // Open search overlay on input focus (mobile)
    if (searchInput && window.innerWidth <= 768) {
        searchInput.addEventListener('focus', function() {
            openSearchOverlay();
        });
    }
    
    // Real-time search in overlay
    if (overlaySearchInput) {
        overlaySearchInput.addEventListener('input', function() {
            const query = this.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (query.length >= 2) {
                searchTimeout = setTimeout(() => {
                    performLiveSearch(query);
                }, 300);
            } else {
                searchResults.innerHTML = '';
            }
        });
        
        // Handle Enter key
        overlaySearchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = this.value.trim();
                if (query) {
                    performSearch(query);
                    closeSearchOverlay();
                }
            }
            
            if (e.key === 'Escape') {
                closeSearchOverlay();
            }
        });
    }
}

// Open search overlay
function openSearchOverlay() {
    const searchOverlay = document.getElementById('searchOverlay');
    const overlaySearchInput = document.getElementById('overlaySearchInput');
    
    if (searchOverlay) {
        searchOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus on input after animation
        setTimeout(() => {
            if (overlaySearchInput) {
                overlaySearchInput.focus();
            }
        }, 300);
    }
}

// Close search overlay
function closeSearchOverlay() {
    const searchOverlay = document.getElementById('searchOverlay');
    const searchResults = document.getElementById('searchResults');
    
    if (searchOverlay) {
        searchOverlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Clear results
        if (searchResults) {
            searchResults.innerHTML = '';
        }
    }
}

// Perform search
function performSearch(query) {
    // Redirect to search results page
    window.location.href = `search.php?q=${encodeURIComponent(query)}`;
}

// Live search with AJAX
function performLiveSearch(query) {
    const searchResults = document.getElementById('searchResults');
    
    if (!searchResults) return;
    
    // Show loading
    searchResults.innerHTML = `
        <div class="text-center py-4">
            <div class="spinner-border text-orange" role="status">
                <span class="visually-hidden">Recherche...</span>
            </div>
            <div class="mt-2 text-white">Recherche en cours...</div>
        </div>
    `;
    
    // AJAX request
    fetch('ajax/live_search.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query })
    })
    .then(response => response.json())
    .then(data => {
        displaySearchResults(data);
    })
    .catch(error => {
        console.error('Search error:', error);
        searchResults.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-exclamation-triangle fa-2x mb-2"></i>
                <div>Erreur lors de la recherche</div>
            </div>
        `;
    });
}

// Display search results
function displaySearchResults(data) {
    const searchResults = document.getElementById('searchResults');
    
    if (!data || (!data.artists && !data.tracks && !data.podcasts)) {
        searchResults.innerHTML = `
            <div class="text-center py-4 text-muted">
                <i class="fas fa-search fa-2x mb-2"></i>
                <div>Aucun résultat trouvé</div>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    // Artists
    if (data.artists && data.artists.length > 0) {
        html += '<div class="search-section mb-4">';
        html += '<h6 class="text-white mb-3"><i class="fas fa-users me-2"></i>Artistes</h6>';
        data.artists.forEach(artist => {
            html += `
                <div class="search-item mb-2">
                    <a href="artist.php?id=${artist.id}" class="d-flex align-items-center text-decoration-none">
                        <img src="${artist.profile_image || '/placeholder.svg?height=40&width=40'}" 
                             alt="${artist.artist_name}" class="rounded-circle me-3" width="40" height="40">
                        <div>
                            <div class="text-white">${artist.artist_name}</div>
                            <small class="text-muted">${artist.genre} • ${artist.followers_count} followers</small>
                        </div>
                    </a>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Tracks
    if (data.tracks && data.tracks.length > 0) {
        html += '<div class="search-section mb-4">';
        html += '<h6 class="text-white mb-3"><i class="fas fa-music me-2"></i>Musiques</h6>';
        data.tracks.forEach(track => {
            html += `
                <div class="search-item mb-2">
                    <div class="d-flex align-items-center">
                        <img src="${track.image_path || '/placeholder.svg?height=40&width=40'}" 
                             alt="${track.title}" class="rounded me-3" width="40" height="40">
                        <div class="flex-grow-1">
                            <div class="text-white">${track.title}</div>
                            <small class="text-muted">${track.artist_name} • ${track.plays_count} écoutes</small>
                        </div>
                        <button class="btn btn-sm btn-outline-orange" onclick="playTrack(${track.id})">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    // Podcasts
    if (data.podcasts && data.podcasts.length > 0) {
        html += '<div class="search-section mb-4">';
        html += '<h6 class="text-white mb-3"><i class="fas fa-microphone me-2"></i>Podcasts</h6>';
        data.podcasts.forEach(podcast => {
            html += `
                <div class="search-item mb-2">
                    <div class="d-flex align-items-center">
                        <div class="bg-gradient-primary rounded me-3 d-flex align-items-center justify-content-center" 
                             style="width: 40px; height: 40px;">
                            <i class="fas fa-microphone text-white"></i>
                        </div>
                        <div class="flex-grow-1">
                            <div class="text-white">${podcast.title}</div>
                            <small class="text-muted">${podcast.artist_name} • ${podcast.duration}</small>
                        </div>
                        <button class="btn btn-sm btn-outline-orange" onclick="playPodcast(${podcast.id})">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    }
    
    searchResults.innerHTML = html;
}

// Notifications functionality
function initializeNotifications() {
    const notificationsBtn = document.getElementById('notificationsBtn');
    
    if (notificationsBtn && window.YT.isLoggedIn) {
        // Check for new notifications periodically
        setInterval(checkNewNotifications, 30000); // Every 30 seconds
        
        // Mark notification as read when clicked
        document.addEventListener('click', function(e) {
            if (e.target.closest('.notification-item')) {
                const notificationId = e.target.closest('.notification-item').dataset.notificationId;
                if (notificationId) {
                    markNotificationAsRead(notificationId);
                }
            }
        });
    }
}

// Check for new notifications
function checkNewNotifications() {
    fetch('ajax/check_notifications.php')
    .then(response => response.json())
    .then(data => {
        if (data.success && data.count > 0) {
            updateNotificationBadge(data.count);
            
            // Show browser notification if permission granted
            if (Notification.permission === 'granted' && data.new_notifications) {
                data.new_notifications.forEach(notification => {
                    showBrowserNotification(notification);
                });
            }
        }
    })
    .catch(error => {
        console.error('Error checking notifications:', error);
    });
}

// Update notification badge
function updateNotificationBadge(count) {
    const badge = document.querySelector('#notificationsBtn .badge');
    
    if (count > 0) {
        if (badge) {
            badge.textContent = count > 9 ? '9+' : count;
        } else {
            const newBadge = document.createElement('span');
            newBadge.className = 'position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger';
            newBadge.textContent = count > 9 ? '9+' : count;
            document.getElementById('notificationsBtn').appendChild(newBadge);
        }
    } else if (badge) {
        badge.remove();
    }
}

// Show browser notification
function showBrowserNotification(notification) {
    if (Notification.permission === 'granted') {
        const browserNotification = new Notification(notification.title, {
            body: notification.message,
            icon: '/assets/images/logo-small.png',
            badge: '/assets/images/logo-small.png',
            tag: 'young-talent-' + notification.id
        });
        
        browserNotification.onclick = function() {
            window.focus();
            if (notification.link) {
                window.location.href = notification.link;
            }
            browserNotification.close();
        };
        
        // Auto close after 5 seconds
        setTimeout(() => {
            browserNotification.close();
        }, 5000);
    }
}

// Mark notification as read
function markNotificationAsRead(notificationId) {
    fetch('ajax/mark_notification_read.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notification_id: notificationId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update UI
            const notificationItem = document.querySelector(`[data-notification-id="${notificationId}"]`);
            if (notificationItem) {
                notificationItem.classList.remove('unread');
            }
            
            // Update badge count
            const currentCount = parseInt(document.querySelector('#notificationsBtn .badge')?.textContent || '0');
            if (currentCount > 0) {
                updateNotificationBadge(currentCount - 1);
            }
        }
    })
    .catch(error => {
        console.error('Error marking notification as read:', error);
    });
}

// Mark all notifications as read
function markAllAsRead() {
    fetch('ajax/mark_all_notifications_read.php', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Update UI
            document.querySelectorAll('.notification-item.unread').forEach(item => {
                item.classList.remove('unread');
            });
            
            // Remove badge
            updateNotificationBadge(0);
            
            showToast('Toutes les notifications ont été marquées comme lues', 'success');
        }
    })
    .catch(error => {
        console.error('Error marking all notifications as read:', error);
    });
}

// User menu functionality
function initializeUserMenu() {
    // Request notification permission
    if (window.YT.isLoggedIn && 'Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            Notification.requestPermission();
        }, 5000); // Ask after 5 seconds
    }
    
    // Handle profile image upload preview (if on profile page)
    const profileImageInput = document.getElementById('profileImageInput');
    if (profileImageInput) {
        profileImageInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('profileImagePreview');
                    if (preview) {
                        preview.src = e.target.result;
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    }
}

// Loading bar functionality
function initializeLoadingBar() {
    const loadingBar = document.getElementById('loading-bar');
    
    // Show loading bar on page navigation
    window.addEventListener('beforeunload', function() {
        if (loadingBar) {
            loadingBar.classList.add('active');
            loadingBar.style.width = '30%';
        }
    });
    
    // Hide loading bar when page loads
    window.addEventListener('load', function() {
        if (loadingBar) {
            loadingBar.style.width = '100%';
            setTimeout(() => {
                loadingBar.classList.remove('active');
                loadingBar.style.width = '0%';
            }, 200);
        }
    });
}

// Flash messages functionality
function initializeFlashMessages() {
    // Auto-hide flash messages after 5 seconds
    const flashMessages = document.querySelectorAll('.flash-message');
    flashMessages.forEach(message => {
        setTimeout(() => {
            const alert = new bootstrap.Alert(message);
            alert.close();
        }, 5000);
    });
}

// Utility function to show toast notifications
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show flash-message`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : (type === 'error' ? 'exclamation-triangle' : 'info-circle')} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            const alert = new bootstrap.Alert(toast);
            alert.close();
        }
    }, 5000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K to open search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSearchOverlay();
    }
    
    // Escape to close overlays
    if (e.key === 'Escape') {
        closeSearchOverlay();
    }
});

// Export functions for global use
window.YT = window.YT || {};
window.YT.header = {
    openSearchOverlay,
    closeSearchOverlay,
    markAllAsRead,
    showToast
};