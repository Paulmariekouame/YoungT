// Footer JavaScript - Young Talent
document.addEventListener('DOMContentLoaded', function() {
    initializeFooter();
});

function initializeFooter() {
    // Initialize all footer components
    initializeNewsletter();
    initializeBackToTop();
    initializeCookieConsent();
    initializeMiniPlayer();
    initializeStatsAnimation();
    initializeSocialTracking();
}

// Newsletter functionality
function initializeNewsletter() {
    const newsletterForm = document.getElementById('newsletterForm');
    const newsletterEmail = document.getElementById('newsletterEmail');
    const newsletterBtn = document.getElementById('newsletterBtn');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = newsletterEmail.value.trim();
            
            if (!isValidEmail(email)) {
                showToast('Veuillez entrer une adresse email valide', 'error');
                return;
            }
            
            // Disable button and show loading
            const originalText = newsletterBtn.innerHTML;
            newsletterBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Inscription...';
            newsletterBtn.disabled = true;
            
            // AJAX request
            fetch('ajax/newsletter_subscribe.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showToast('Inscription réussie ! Vérifiez votre email.', 'success');
                    newsletterEmail.value = '';
                    
                    // Track newsletter subscription
                    if (typeof gtag !== 'undefined') {
                        gtag('event', 'newsletter_subscribe', {
                            'event_category': 'engagement',
                            'event_label': 'footer'
                        });
                    }
                } else {
                    showToast(data.message || 'Erreur lors de l\'inscription', 'error');
                }
            })
            .catch(error => {
                console.error('Newsletter error:', error);
                showToast('Erreur de connexion. Veuillez réessayer.', 'error');
            })
            .finally(() => {
                // Restore button
                newsletterBtn.innerHTML = originalText;
                newsletterBtn.disabled = false;
            });
        });
    }
}

// Back to top functionality
function initializeBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (backToTopBtn) {
        // Show/hide button based on scroll position
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });
        
        // Smooth scroll to top
        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Track back to top usage
            if (typeof gtag !== 'undefined') {
                gtag('event', 'back_to_top', {
                    'event_category': 'navigation',
                    'event_label': 'footer'
                });
            }
        });
    }
}

// Cookie consent functionality
function initializeCookieConsent() {
    const cookieConsent = document.getElementById('cookieConsent');
    
    if (cookieConsent) {
        // Check if user has already made a choice
        const cookieChoice = localStorage.getItem('cookie_consent');
        
        if (!cookieChoice) {
            // Show banner after 2 seconds
            setTimeout(() => {
                cookieConsent.classList.add('show');
            }, 2000);
        }
    }
}

// Accept cookies
function acceptCookies(type) {
    const cookieConsent = document.getElementById('cookieConsent');
    
    // Store user choice
    localStorage.setItem('cookie_consent', type);
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    
    // Hide banner
    if (cookieConsent) {
        cookieConsent.classList.remove('show');
    }
    
    // Initialize analytics based on choice
    if (type === 'all') {
        initializeAnalytics();
        showToast('Cookies acceptés. Merci !', 'success');
    } else {
        showToast('Seuls les cookies essentiels sont activés.', 'info');
    }
    
    // Track cookie choice
    if (typeof gtag !== 'undefined') {
        gtag('event', 'cookie_consent', {
            'event_category': 'privacy',
            'event_label': type
        });
    }
}

// Initialize analytics (placeholder)
function initializeAnalytics() {
    // Initialize Google Analytics, Facebook Pixel, etc.
    console.log('Analytics initialized');
    
    // Example: Initialize Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('config', 'GA_MEASUREMENT_ID', {
            'anonymize_ip': true,
            'cookie_flags': 'SameSite=None;Secure'
        });
    }
}

// Mini player functionality
function initializeMiniPlayer() {
    const miniPlayer = document.getElementById('miniPlayer');
    
    if (miniPlayer) {
        // Initialize player controls
        const playPauseBtn = document.getElementById('miniPlayerPlayPause');
        const prevBtn = document.getElementById('miniPlayerPrev');
        const nextBtn = document.getElementById('miniPlayerNext');
        const closeBtn = document.getElementById('miniPlayerClose');
        const volumeBtn = document.getElementById('miniPlayerVolume');
        const fullscreenBtn = document.getElementById('miniPlayerFullscreen');
        
        // Play/Pause functionality
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', function() {
                if (window.YT && window.YT.player) {
                    window.YT.player.togglePlayPause();
                }
            });
        }
        
        // Previous track
        if (prevBtn) {
            prevBtn.addEventListener('click', function() {
                if (window.YT && window.YT.player) {
                    window.YT.player.previousTrack();
                }
            });
        }
        
        // Next track
        if (nextBtn) {
            nextBtn.addEventListener('click', function() {
                if (window.YT && window.YT.player) {
                    window.YT.player.nextTrack();
                }
            });
        }
        
        // Close mini player
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                hideMiniPlayer();
                if (window.YT && window.YT.player) {
                    window.YT.player.stop();
                }
            });
        }
        
        // Volume control
        if (volumeBtn) {
            volumeBtn.addEventListener('click', function() {
                if (window.YT && window.YT.player) {
                    window.YT.player.toggleMute();
                }
            });
        }
        
        // Fullscreen player
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', function() {
                // Open full player modal or page
                window.location.href = 'player.php';
            });
        }
    }
}

// Show mini player
function showMiniPlayer(trackData) {
    const miniPlayer = document.getElementById('miniPlayer');
    
    if (miniPlayer && trackData) {
        // Update track info
        document.getElementById('miniPlayerImage').src = trackData.image || '/placeholder.svg?height=50&width=50';
        document.getElementById('miniPlayerTitle').textContent = trackData.title;
        document.getElementById('miniPlayerArtist').textContent = trackData.artist;
        
        // Show player
        miniPlayer.style.display = 'block';
        setTimeout(() => {
            miniPlayer.classList.add('show');
        }, 100);
        
        // Adjust body padding to account for mini player
        document.body.style.paddingBottom = '100px';
    }
}

// Hide mini player
function hideMiniPlayer() {
    const miniPlayer = document.getElementById('miniPlayer');
    
    if (miniPlayer) {
        miniPlayer.classList.remove('show');
        setTimeout(() => {
            miniPlayer.style.display = 'none';
        }, 300);
        
        // Remove body padding
        document.body.style.paddingBottom = '0';
    }
}

// Update mini player progress
function updateMiniPlayerProgress(progress) {
    const progressBar = document.getElementById('miniPlayerProgress');
    if (progressBar) {
        progressBar.style.width = progress + '%';
    }
}

// Stats animation
function initializeStatsAnimation() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    // Intersection Observer for animation trigger
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateNumber(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => {
        observer.observe(stat);
    });
}

// Animate number counting
function animateNumber(element) {
    const finalNumber = element.textContent;
    const numericValue = parseInt(finalNumber.replace(/[^\d]/g, ''));
    const suffix = finalNumber.replace(/[\d]/g, '');
    
    let currentNumber = 0;
    const increment = numericValue / 50; // 50 steps
    const duration = 2000; // 2 seconds
    const stepTime = duration / 50;
    
    const timer = setInterval(() => {
        currentNumber += increment;
        
        if (currentNumber >= numericValue) {
            currentNumber = numericValue;
            clearInterval(timer);
        }
        
        element.textContent = Math.floor(currentNumber) + suffix;
    }, stepTime);
}

// Social media tracking
function initializeSocialTracking() {
    const socialLinks = document.querySelectorAll('.social-link');
    
    socialLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const platform = this.dataset.platform;
            
            // Track social media clicks
            if (typeof gtag !== 'undefined') {
                gtag('event', 'social_click', {
                    'event_category': 'social',
                    'event_label': platform,
                    'transport_type': 'beacon'
                });
            }
        });
    });
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Toast notification function
function showToast(message, type = 'info') {
    // Use the header toast function if available
    if (window.YT && window.YT.header && window.YT.header.showToast) {
        window.YT.header.showToast(message, type);
        return;
    }
    
    // Fallback toast implementation
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} alert-dismissible fade show`;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
    `;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : (type === 'error' ? 'exclamation-triangle' : 'info-circle')} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Lazy loading for images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Space bar to play/pause (when mini player is visible)
    if (e.code === 'Space' && document.getElementById('miniPlayer').classList.contains('show')) {
        e.preventDefault();
        const playPauseBtn = document.getElementById('miniPlayerPlayPause');
        if (playPauseBtn) {
            playPauseBtn.click();
        }
    }
    
    // Escape to close mini player
    if (e.key === 'Escape' && document.getElementById('miniPlayer').classList.contains('show')) {
        hideMiniPlayer();
    }
});

// Export functions for global use
window.YT = window.YT || {};
window.YT.footer = {
    showMiniPlayer,
    hideMiniPlayer,
    updateMiniPlayerProgress,
    acceptCookies,
    showToast
};

// Performance monitoring
window.addEventListener('load', function() {
    // Log page load time
    const loadTime = performance.now();
    console.log(`Footer loaded in ${loadTime.toFixed(2)}ms`);
    
    // Track page load performance
    if (typeof gtag !== 'undefined') {
        gtag('event', 'page_load_time', {
            'event_category': 'performance',
            'value': Math.round(loadTime)
        });
    }
});

// Service Worker registration (for PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
            console.log('ServiceWorker registration successful');
        })
        .catch(function(err) {
            console.log('ServiceWorker registration failed');
        });
    });
}