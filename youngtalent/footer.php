<?php
// Récupérer les statistiques de la plateforme
$stats_query = "SELECT 
    (SELECT COUNT(*) FROM users WHERE verified = 1) as total_artists,
    (SELECT COUNT(*) FROM tracks WHERE status = 'published') as total_tracks,
    (SELECT COUNT(*) FROM podcasts WHERE status = 'published') as total_podcasts,
    (SELECT SUM(plays_count) FROM tracks) as total_plays";

try {
    $stats_stmt = $db->prepare($stats_query);
    $stats_stmt->execute();
    $platform_stats = $stats_stmt->fetch(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $platform_stats = [
        'total_artists' => 0,
        'total_tracks' => 0,
        'total_podcasts' => 0,
        'total_plays' => 0
    ];
}

// Récupérer les derniers artistes populaires pour le footer
$popular_artists_query = "SELECT id, artist_name, profile_image, verified 
                         FROM users 
                         WHERE verified = 1 
                         ORDER BY followers_count DESC 
                         LIMIT 6";
try {
    $popular_stmt = $db->prepare($popular_artists_query);
    $popular_stmt->execute();
    $popular_artists = $popular_stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $popular_artists = [];
}

// Récupérer les dernières actualités/annonces
$news_query = "SELECT title, slug, created_at 
               FROM news 
               WHERE status = 'published' 
               ORDER BY created_at DESC 
               LIMIT 4";
try {
    $news_stmt = $db->prepare($news_query);
    $news_stmt->execute();
    $latest_news = $news_stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $latest_news = [];
}

// Fonction pour formater les nombres
function formatNumber($number) {
    if ($number >= 1000000) {
        return round($number / 1000000, 1) . 'M';
    } elseif ($number >= 1000) {
        return round($number / 1000, 1) . 'K';
    }
    return number_format($number);
}
?>

<!-- Footer -->
<footer class="footer bg-dark text-white">
    <!-- Newsletter Section -->
    <div class="newsletter-section bg-gradient-primary py-5">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6 mb-4 mb-lg-0">
                    <div class="newsletter-content">
                        <h3 class="fw-bold mb-2">
                            <i class="fas fa-envelope-open me-2"></i>
                            Restez connecté avec Young Talent
                        </h3>
                        <p class="mb-0 opacity-75">
                            Recevez les dernières nouveautés, découvertes d'artistes et actualités musicales directement dans votre boîte mail.
                        </p>
                    </div>
                </div>
                <div class="col-lg-6">
                    <form class="newsletter-form" id="newsletterForm">
                        <div class="input-group input-group-lg">
                            <input type="email" class="form-control bg-white border-0" 
                                   placeholder="Votre adresse email..." 
                                   id="newsletterEmail" required>
                            <button class="btn btn-orange px-4" type="submit" id="newsletterBtn">
                                <i class="fas fa-paper-plane me-2"></i>
                                S'abonner
                            </button>
                        </div>
                        <div class="form-text text-white-50 mt-2">
                            <small>
                                <i class="fas fa-shield-alt me-1"></i>
                                Nous respectons votre vie privée. Désabonnement possible à tout moment.
                            </small>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Main Footer Content -->
    <div class="footer-main py-5">
        <div class="container">
            <div class="row g-4">
                <!-- Brand Section -->
                <div class="col-lg-4 col-md-6">
                    <div class="footer-brand">
                        <div class="d-flex align-items-center mb-4">
                            <div class="logo-icon me-3">
                                <i class="fas fa-music"></i>
                            </div>
                            <h4 class="fw-bold mb-0">Young Talent</h4>
                        </div>
                        <p class="text-muted mb-4">
                            La plateforme qui révèle les talents musicaux de demain. 
                            Découvrez, partagez et soutenez les artistes émergents du rap, R&B et bien plus encore.
                        </p>
                        
                        <!-- Platform Stats -->
                        <div class="platform-stats">
                            <div class="row g-3">
                                <div class="col-6">
                                    <div class="stat-item text-center p-3 bg-dark-subtle rounded">
                                        <div class="stat-number text-orange fw-bold h5 mb-1">
                                            <?php echo formatNumber($platform_stats['total_artists']); ?>
                                        </div>
                                        <div class="stat-label small text-muted">Artistes</div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="stat-item text-center p-3 bg-dark-subtle rounded">
                                        <div class="stat-number text-orange fw-bold h5 mb-1">
                                            <?php echo formatNumber($platform_stats['total_tracks']); ?>
                                        </div>
                                        <div class="stat-label small text-muted">Titres</div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="stat-item text-center p-3 bg-dark-subtle rounded">
                                        <div class="stat-number text-orange fw-bold h5 mb-1">
                                            <?php echo formatNumber($platform_stats['total_podcasts']); ?>
                                        </div>
                                        <div class="stat-label small text-muted">Podcasts</div>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="stat-item text-center p-3 bg-dark-subtle rounded">
                                        <div class="stat-number text-orange fw-bold h5 mb-1">
                                            <?php echo formatNumber($platform_stats['total_plays']); ?>
                                        </div>
                                        <div class="stat-label small text-muted">Écoutes</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Links -->
                <div class="col-lg-2 col-md-6">
                    <h5 class="footer-title mb-4">
                        <i class="fas fa-compass me-2 text-orange"></i>
                        Découvrir
                    </h5>
                    <ul class="footer-links list-unstyled">
                        <li><a href="music.php" class="text-decoration-none">
                            <i class="fas fa-music me-2"></i>Musique
                        </a></li>
                        <li><a href="podcasts.php" class="text-decoration-none">
                            <i class="fas fa-microphone me-2"></i>Podcasts
                        </a></li>
                        <li><a href="artists.php" class="text-decoration-none">
                            <i class="fas fa-users me-2"></i>Artistes
                        </a></li>
                        <li><a href="trending.php" class="text-decoration-none">
                            <i class="fas fa-fire me-2"></i>Tendances
                        </a></li>
                        <li><a href="new-releases.php" class="text-decoration-none">
                            <i class="fas fa-star me-2"></i>Nouveautés
                        </a></li>
                        <li><a href="genres.php" class="text-decoration-none">
                            <i class="fas fa-tags me-2"></i>Genres
                        </a></li>
                        <li><a href="playlists.php" class="text-decoration-none">
                            <i class="fas fa-list me-2"></i>Playlists
                        </a></li>
                    </ul>
                </div>

                <!-- For Artists -->
                <div class="col-lg-2 col-md-6">
                    <h5 class="footer-title mb-4">
                        <i class="fas fa-microphone-alt me-2 text-orange"></i>
                        Artistes
                    </h5>
                    <ul class="footer-links list-unstyled">
                        <?php if ($is_logged_in): ?>
                            <li><a href="dashboard.php" class="text-decoration-none">
                                <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                            </a></li>
                            <li><a href="upload.php" class="text-decoration-none">
                                <i class="fas fa-upload me-2"></i>Upload
                            </a></li>
                            <li><a href="analytics.php" class="text-decoration-none">
                                <i class="fas fa-chart-bar me-2"></i>Analytics
                            </a></li>
                        <?php else: ?>
                            <li><a href="register.php" class="text-decoration-none">
                                <i class="fas fa-user-plus me-2"></i>Devenir artiste
                            </a></li>
                            <li><a href="login.php" class="text-decoration-none">
                                <i class="fas fa-sign-in-alt me-2"></i>Connexion
                            </a></li>
                        <?php endif; ?>
                        <li><a href="artist-guide.php" class="text-decoration-none">
                            <i class="fas fa-book me-2"></i>Guide artiste
                        </a></li>
                        <li><a href="monetization.php" class="text-decoration-none">
                            <i class="fas fa-dollar-sign me-2"></i>Monétisation
                        </a></li>
                        <li><a href="promotion.php" class="text-decoration-none">
                            <i class="fas fa-bullhorn me-2"></i>Promotion
                        </a></li>
                        <li><a href="verification.php" class="text-decoration-none">
                            <i class="fas fa-check-circle me-2"></i>Vérification
                        </a></li>
                    </ul>
                </div>

                <!-- Support & Legal -->
                <div class="col-lg-2 col-md-6">
                    <h5 class="footer-title mb-4">
                        <i class="fas fa-life-ring me-2 text-orange"></i>
                        Support
                    </h5>
                    <ul class="footer-links list-unstyled">
                        <li><a href="help.php" class="text-decoration-none">
                            <i class="fas fa-question-circle me-2"></i>Centre d'aide
                        </a></li>
                        <li><a href="contact.php" class="text-decoration-none">
                            <i class="fas fa-envelope me-2"></i>Contact
                        </a></li>
                        <li><a href="faq.php" class="text-decoration-none">
                            <i class="fas fa-comments me-2"></i>FAQ
                        </a></li>
                        <li><a href="community.php" class="text-decoration-none">
                            <i class="fas fa-users me-2"></i>Communauté
                        </a></li>
                        <li><a href="feedback.php" class="text-decoration-none">
                            <i class="fas fa-comment-dots me-2"></i>Feedback
                        </a></li>
                        <li><a href="report.php" class="text-decoration-none">
                            <i class="fas fa-flag me-2"></i>Signaler
                        </a></li>
                    </ul>
                </div>

                <!-- Popular Artists & News -->
                <div class="col-lg-2 col-md-6">
                    <h5 class="footer-title mb-4">
                        <i class="fas fa-star me-2 text-orange"></i>
                        Populaires
                    </h5>
                    
                    <!-- Popular Artists -->
                    <?php if (!empty($popular_artists)): ?>
                        <div class="popular-artists mb-4">
                            <?php foreach (array_slice($popular_artists, 0, 4) as $artist): ?>
                                <div class="artist-item mb-2">
                                    <a href="artist.php?id=<?php echo $artist['id']; ?>" 
                                       class="d-flex align-items-center text-decoration-none">
                                        <?php if ($artist['profile_image']): ?>
                                            <img src="<?php echo htmlspecialchars($artist['profile_image']); ?>" 
                                                 alt="<?php echo htmlspecialchars($artist['artist_name']); ?>" 
                                                 class="rounded-circle me-2" width="24" height="24">
                                        <?php else: ?>
                                            <div class="bg-gradient-orange rounded-circle me-2 d-flex align-items-center justify-content-center" 
                                                 style="width: 24px; height: 24px;">
                                                <i class="fas fa-user text-white small"></i>
                                            </div>
                                        <?php endif; ?>
                                        <span class="text-muted small">
                                            <?php echo htmlspecialchars($artist['artist_name']); ?>
                                            <?php if ($artist['verified']): ?>
                                                <i class="fas fa-check-circle text-primary ms-1" style="font-size: 0.7rem;"></i>
                                            <?php endif; ?>
                                        </span>
                                    </a>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>

                    <!-- Latest News -->
                    <?php if (!empty($latest_news)): ?>
                        <div class="latest-news">
                            <h6 class="text-muted mb-3">
                                <i class="fas fa-newspaper me-1"></i>
                                Actualités
                            </h6>
                            <?php foreach (array_slice($latest_news, 0, 3) as $news): ?>
                                <div class="news-item mb-2">
                                    <a href="news.php?slug=<?php echo $news['slug']; ?>" 
                                       class="text-decoration-none">
                                        <div class="text-muted small">
                                            <?php echo htmlspecialchars($news['title']); ?>
                                        </div>
                                        <div class="text-muted" style="font-size: 0.7rem;">
                                            <?php echo date('d/m/Y', strtotime($news['created_at'])); ?>
                                        </div>
                                    </a>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <!-- Social Media & Apps Section -->
    <div class="footer-social py-4 bg-dark-subtle">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6 mb-3 mb-lg-0">
                    <div class="social-links">
                        <h6 class="mb-3">
                            <i class="fas fa-share-alt me-2 text-orange"></i>
                            Suivez-nous
                        </h6>
                        <div class="d-flex flex-wrap gap-3">
                            <a href="#" class="social-link" data-platform="instagram">
                                <i class="fab fa-instagram"></i>
                                <span>Instagram</span>
                            </a>
                            <a href="#" class="social-link" data-platform="twitter">
                                <i class="fab fa-twitter"></i>
                                <span>Twitter</span>
                            </a>
                            <a href="#" class="social-link" data-platform="tiktok">
                                <i class="fab fa-tiktok"></i>
                                <span>TikTok</span>
                            </a>
                            <a href="#" class="social-link" data-platform="youtube">
                                <i class="fab fa-youtube"></i>
                                <span>YouTube</span>
                            </a>
                            <a href="#" class="social-link" data-platform="facebook">
                                <i class="fab fa-facebook"></i>
                                <span>Facebook</span>
                            </a>
                            <a href="#" class="social-link" data-platform="discord">
                                <i class="fab fa-discord"></i>
                                <span>Discord</span>
                            </a>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="app-downloads text-lg-end">
                        <h6 class="mb-3">
                            <i class="fas fa-mobile-alt me-2 text-orange"></i>
                            Téléchargez l'app
                        </h6>
                        <div class="d-flex flex-wrap gap-3 justify-content-lg-end">
                            <a href="#" class="app-store-btn">
                                <img src="/placeholder.svg?height=40&width=135&text=App+Store" 
                                     alt="Télécharger sur l'App Store" class="img-fluid">
                            </a>
                            <a href="#" class="app-store-btn">
                                <img src="/placeholder.svg?height=40&width=135&text=Google+Play" 
                                     alt="Télécharger sur Google Play" class="img-fluid">
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bottom Footer -->
    <div class="footer-bottom py-4 border-top border-secondary">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-lg-6 mb-3 mb-lg-0">
                    <div class="copyright">
                        <p class="mb-0 text-muted">
                            &copy; <?php echo date('Y'); ?> Young Talent. Tous droits réservés.
                            <span class="d-none d-md-inline">
                                | Fait avec <i class="fas fa-heart text-danger"></i> pour la musique
                            </span>
                        </p>
                    </div>
                </div>
                <div class="col-lg-6">
                    <div class="footer-legal text-lg-end">
                        <div class="d-flex flex-wrap gap-3 justify-content-lg-end">
                            <a href="privacy.php" class="text-muted text-decoration-none small">
                                <i class="fas fa-shield-alt me-1"></i>Confidentialité
                            </a>
                            <a href="terms.php" class="text-muted text-decoration-none small">
                                <i class="fas fa-file-contract me-1"></i>Conditions
                            </a>
                            <a href="cookies.php" class="text-muted text-decoration-none small">
                                <i class="fas fa-cookie-bite me-1"></i>Cookies
                            </a>
                            <a href="dmca.php" class="text-muted text-decoration-none small">
                                <i class="fas fa-copyright me-1"></i>DMCA
                            </a>
                            <a href="sitemap.php" class="text-muted text-decoration-none small">
                                <i class="fas fa-sitemap me-1"></i>Plan du site
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Back to Top Button -->
    <button class="back-to-top" id="backToTop" title="Retour en haut">
        <i class="fas fa-chevron-up"></i>
    </button>
</footer>

<!-- Cookie Consent Banner -->
<div class="cookie-consent" id="cookieConsent">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-8 mb-3 mb-lg-0">
                <div class="d-flex align-items-start">
                    <i class="fas fa-cookie-bite text-orange me-3 mt-1"></i>
                    <div>
                        <h6 class="mb-2">Nous utilisons des cookies</h6>
                        <p class="mb-0 small text-muted">
                            Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et personnaliser le contenu. 
                            <a href="cookies.php" class="text-orange">En savoir plus</a>
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="d-flex gap-2 justify-content-lg-end">
                    <button class="btn btn-outline-light btn-sm" onclick="acceptCookies('essential')">
                        Essentiels uniquement
                    </button>
                    <button class="btn btn-orange btn-sm" onclick="acceptCookies('all')">
                        Accepter tout
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Music Player Mini (if track is playing) -->
<div class="mini-player" id="miniPlayer" style="display: none;">
    <div class="container-fluid">
        <div class="row align-items-center">
            <div class="col-auto">
                <div class="track-info d-flex align-items-center">
                    <img id="miniPlayerImage" src="/placeholder.svg" alt="" class="rounded me-3" width="50" height="50">
                    <div>
                        <div class="track-title text-white fw-bold" id="miniPlayerTitle"></div>
                        <div class="track-artist text-muted small" id="miniPlayerArtist"></div>
                    </div>
                </div>
            </div>
            <div class="col">
                <div class="player-controls d-flex align-items-center justify-content-center">
                    <button class="btn btn-link text-white me-3" id="miniPlayerPrev">
                        <i class="fas fa-step-backward"></i>
                    </button>
                    <button class="btn btn-orange rounded-circle" id="miniPlayerPlayPause">
                        <i class="fas fa-play"></i>
                    </button>
                    <button class="btn btn-link text-white ms-3" id="miniPlayerNext">
                        <i class="fas fa-step-forward"></i>
                    </button>
                </div>
            </div>
            <div class="col-auto">
                <div class="player-actions d-flex align-items-center">
                    <button class="btn btn-link text-white me-2" id="miniPlayerVolume">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <button class="btn btn-link text-white me-2" id="miniPlayerFullscreen">
                        <i class="fas fa-expand"></i>
                    </button>
                    <button class="btn btn-link text-white" id="miniPlayerClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="progress-bar-container">
            <div class="progress" style="height: 2px;">
                <div class="progress-bar bg-orange" id="miniPlayerProgress" style="width: 0%"></div>
            </div>
        </div>
    </div>
</div>

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="footer.js"></script>

<!-- Custom Scripts pour cette page -->
<?php if (isset($custom_js)): ?>
    <?php foreach ($custom_js as $js): ?>
        <script src="<?php echo $js; ?>"></script>
    <?php endforeach; ?>
<?php endif; ?>

</body>
</html>