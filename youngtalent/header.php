<?php
// Démarrer la session si elle n'est pas déjà démarrée
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Inclure les fichiers nécessaires
if (!isset($db)) {
    include_once 'config/database.php';
}
if (!isset($auth)) {
    include_once 'auth.php';
}

// Obtenir l'utilisateur actuel
$current_user = $auth->getCurrentUser();
$is_logged_in = $auth->isLoggedIn();

// Déterminer la page actuelle pour la navigation active
$current_page = basename($_SERVER['PHP_SELF'], '.php');

// Récupérer les notifications non lues (si connecté)
$notifications = [];
$unread_count = 0;
if ($is_logged_in) {
    $notif_query = "SELECT * FROM notifications WHERE user_id = :user_id AND is_read = 0 ORDER BY created_at DESC LIMIT 5";
    $notif_stmt = $db->prepare($notif_query);
    $notif_stmt->bindParam(':user_id', $current_user['id']);
    $notif_stmt->execute();
    $notifications = $notif_stmt->fetchAll(PDO::FETCH_ASSOC);
    $unread_count = count($notifications);
}

// Fonction pour formater le temps écoulé
function timeAgo($datetime) {
    $time = time() - strtotime($datetime);
    
    if ($time < 60) return 'À l\'instant';
    if ($time < 3600) return floor($time/60) . 'm';
    if ($time < 86400) return floor($time/3600) . 'h';
    if ($time < 2592000) return floor($time/86400) . 'j';
    if ($time < 31536000) return floor($time/2592000) . 'mois';
    return floor($time/31536000) . 'an';
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Young Talent - La plateforme dédiée aux jeunes talents musicaux. Partagez votre musique, créez des podcasts et connectez-vous avec vos fans.">
    <meta name="keywords" content="musique, talent, artiste, rap, r&b, podcast, streaming, jeunes, plateforme musicale">
    <meta name="author" content="Young Talent">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="<?php echo 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']; ?>">
    <meta property="og:title" content="<?php echo isset($page_title) ? $page_title . ' - Young Talent' : 'Young Talent - Plateforme Musicale'; ?>">
    <meta property="og:description" content="La plateforme qui révèle les talents musicaux de demain">
    <meta property="og:image" content="<?php echo 'http://' . $_SERVER['HTTP_HOST']; ?>/assets/images/og-image.jpg">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="<?php echo 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']; ?>">
    <meta property="twitter:title" content="<?php echo isset($page_title) ? $page_title . ' - Young Talent' : 'Young Talent - Plateforme Musicale'; ?>">
    <meta property="twitter:description" content="La plateforme qui révèle les talents musicaux de demain">
    <meta property="twitter:image" content="<?php echo 'http://' . $_SERVER['HTTP_HOST']; ?>/assets/images/og-image.jpg">

    <title><?php echo isset($page_title) ? $page_title . ' - Young Talent' : 'Young Talent - Plateforme Musicale'; ?></title>
     <script src="header.js"></script> <!-- chemin vers ton fichier JS -->
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="assets/images/favicon.ico">
    <link rel="apple-touch-icon" sizes="180x180" href="assets/images/apple-touch-icon.png">
    
    <!-- CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="style.css" rel="stylesheet">
    
    <!-- Custom CSS pour cette page -->
    <?php if (isset($custom_css)): ?>
        <?php foreach ($custom_css as $css): ?>
            <link href="<?php echo $css; ?>" rel="stylesheet">
        <?php endforeach; ?>
    <?php endif; ?>
    
    <!-- Preload des ressources importantes -->
    <link rel="preload" href="style.css" as="style">
    <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" as="style">
</head>
<body class="<?php echo isset($body_class) ? $body_class : ''; ?>">
    
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-gradient-primary <?php echo isset($navbar_fixed) && $navbar_fixed ? 'fixed-top' : ''; ?>" id="mainNavbar">
        <div class="container">
            <!-- Logo et nom -->
            <a class="navbar-brand d-flex align-items-center" href="index.php">
                <div class="logo-icon me-2">
                    <i class="fas fa-music"></i>
                </div>
                <span class="fw-bold">Young Talent</span>
            </a>
            
            <!-- Bouton mobile -->
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" 
                    aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <!-- Menu de navigation -->
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link <?php echo $current_page === 'index' ? 'active' : ''; ?>" href="index.php">
                            <i class="fas fa-home me-1"></i>
                            Accueil
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?php echo $current_page === 'music' ? 'active' : ''; ?>" href="music.php">
                            <i class="fas fa-music me-1"></i>
                            Musique
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?php echo $current_page === 'podcasts' ? 'active' : ''; ?>" href="podcasts.php">
                            <i class="fas fa-microphone me-1"></i>
                            Podcasts
                        </a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?php echo $current_page === 'artists' ? 'active' : ''; ?>" href="artists.php">
                            <i class="fas fa-users me-1"></i>
                            Artistes
                        </a>
                    </li>
                    
                    <!-- Menu déroulant Découvrir -->
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="discoverDropdown" role="button" 
                           data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-compass me-1"></i>
                            Découvrir
                        </a>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="trending.php">
                                <i class="fas fa-fire text-orange me-2"></i>Tendances
                            </a></li>
                            <li><a class="dropdown-item" href="new-releases.php">
                                <i class="fas fa-star text-yellow me-2"></i>Nouveautés
                            </a></li>
                            <li><a class="dropdown-item" href="genres.php">
                                <i class="fas fa-tags text-blue me-2"></i>Genres
                            </a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item" href="playlists.php">
                                <i class="fas fa-list text-green me-2"></i>Playlists
                            </a></li>
                        </ul>
                    </li>
                </ul>
                
                <!-- Barre de recherche -->
                <form class="d-flex me-3" role="search" id="searchForm">
                    <div class="input-group">
                        <input class="form-control bg-dark border-secondary text-white" type="search" 
                               placeholder="Rechercher..." aria-label="Search" id="searchInput">
                        <button class="btn btn-outline-light" type="submit">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </form>
                
                <!-- Menu utilisateur -->
                <div class="d-flex align-items-center">
                    <?php if ($is_logged_in): ?>
                        <!-- Notifications -->
                        <div class="dropdown me-3">
                            <button class="btn btn-outline-light position-relative" type="button" 
                                    data-bs-toggle="dropdown" aria-expanded="false" id="notificationsBtn">
                                <i class="fas fa-bell"></i>
                                <?php if ($unread_count > 0): ?>
                                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                        <?php echo $unread_count > 9 ? '9+' : $unread_count; ?>
                                    </span>
                                <?php endif; ?>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end notifications-dropdown">
                                <li class="dropdown-header d-flex justify-content-between align-items-center">
                                    <span>Notifications</span>
                                    <?php if ($unread_count > 0): ?>
                                        <button class="btn btn-sm btn-link text-orange p-0" onclick="markAllAsRead()">
                                            Tout marquer comme lu
                                        </button>
                                    <?php endif; ?>
                                </li>
                                <li><hr class="dropdown-divider"></li>
                                
                                <?php if (empty($notifications)): ?>
                                    <li class="dropdown-item-text text-center text-muted py-3">
                                        <i class="fas fa-bell-slash fa-2x mb-2"></i>
                                        <br>Aucune notification
                                    </li>
                                <?php else: ?>
                                    <?php foreach ($notifications as $notification): ?>
                                        <li>
                                            <a class="dropdown-item notification-item <?php echo !$notification['is_read'] ? 'unread' : ''; ?>" 
                                               href="<?php echo $notification['link'] ?? '#'; ?>" 
                                               data-notification-id="<?php echo $notification['id']; ?>">
                                                <div class="d-flex">
                                                    <div class="notification-icon me-2">
                                                        <i class="fas fa-<?php echo $notification['icon'] ?? 'info-circle'; ?> text-orange"></i>
                                                    </div>
                                                    <div class="flex-grow-1">
                                                        <div class="notification-title"><?php echo htmlspecialchars($notification['title']); ?></div>
                                                        <div class="notification-text text-muted small">
                                                            <?php echo htmlspecialchars($notification['message']); ?>
                                                        </div>
                                                        <div class="notification-time text-muted small">
                                                            <?php echo timeAgo($notification['created_at']); ?>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>
                                        </li>
                                    <?php endforeach; ?>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                        <a class="dropdown-item text-center text-orange" href="notifications.php">
                                            Voir toutes les notifications
                                        </a>
                                    </li>
                                <?php endif; ?>
                            </ul>
                        </div>
                        
                        <!-- Menu utilisateur -->
                        <div class="dropdown">
                            <button class="btn btn-outline-light dropdown-toggle d-flex align-items-center" 
                                    type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <?php if ($current_user['profile_image']): ?>
                                    <img src="<?php echo htmlspecialchars($current_user['profile_image']); ?>" 
                                         alt="Profile" class="rounded-circle me-2" width="24" height="24">
                                <?php else: ?>
                                    <i class="fas fa-user-circle me-2"></i>
                                <?php endif; ?>
                                <span class="d-none d-md-inline"><?php echo htmlspecialchars($current_user['artist_name']); ?></span>
                                <?php if ($current_user['verified']): ?>
                                    <i class="fas fa-check-circle text-primary ms-1" title="Compte vérifié"></i>
                                <?php endif; ?>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li class="dropdown-header">
                                    <div class="d-flex align-items-center">
                                        <?php if ($current_user['profile_image']): ?>
                                            <img src="<?php echo htmlspecialchars($current_user['profile_image']); ?>" 
                                                 alt="Profile" class="rounded-circle me-2" width="32" height="32">
                                        <?php else: ?>
                                            <div class="bg-gradient-orange rounded-circle me-2 d-flex align-items-center justify-content-center" 
                                                 style="width: 32px; height: 32px;">
                                                <i class="fas fa-user text-white"></i>
                                            </div>
                                        <?php endif; ?>
                                        <div>
                                            <div class="fw-bold"><?php echo htmlspecialchars($current_user['artist_name']); ?></div>
                                            <small class="text-muted">@<?php echo htmlspecialchars($current_user['username']); ?></small>
                                        </div>
                                    </div>
                                </li>
                                <li><hr class="dropdown-divider"></li>
                                
                                <li><a class="dropdown-item" href="dashboard.php">
                                    <i class="fas fa-tachometer-alt me-2"></i>Dashboard
                                </a></li>
                                <li><a class="dropdown-item" href="profile.php">
                                    <i class="fas fa-user me-2"></i>Mon Profil
                                </a></li>
                                <li><a class="dropdown-item" href="artist.php?id=<?php echo $current_user['id']; ?>">
                                    <i class="fas fa-eye me-2"></i>Voir mon profil public
                                </a></li>
                                <li><a class="dropdown-item" href="my-music.php">
                                    <i class="fas fa-music me-2"></i>Ma Musique
                                </a></li>
                                <li><a class="dropdown-item" href="my-podcasts.php">
                                    <i class="fas fa-microphone me-2"></i>Mes Podcasts
                                </a></li>
                                <li><a class="dropdown-item" href="analytics.php">
                                    <i class="fas fa-chart-bar me-2"></i>Statistiques
                                </a></li>
                                
                                <li><hr class="dropdown-divider"></li>
                                
                                <li><a class="dropdown-item" href="settings.php">
                                    <i class="fas fa-cog me-2"></i>Paramètres
                                </a></li>
                                <li><a class="dropdown-item" href="help.php">
                                    <i class="fas fa-question-circle me-2"></i>Aide
                                </a></li>
                                
                                <?php if ($current_user['verified']): ?>
                                    <li><hr class="dropdown-divider"></li>
                                    <li><a class="dropdown-item" href="admin.php">
                                        <i class="fas fa-shield-alt me-2"></i>Administration
                                    </a></li>
                                <?php endif; ?>
                                
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="logout.php">
                                    <i class="fas fa-sign-out-alt me-2"></i>Déconnexion
                                </a></li>
                            </ul>
                        </div>
                        
                    <?php else: ?>
                        <!-- Utilisateur non connecté -->
                        <a href="login.php" class="btn btn-outline-light me-2">
                            <i class="fas fa-sign-in-alt me-1"></i>
                            Connexion
                        </a>
                        <a href="register.php" class="btn btn-gradient-orange">
                            <i class="fas fa-user-plus me-1"></i>
                            S'inscrire
                        </a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </nav>
    
    <!-- Barre de progression de chargement -->
    <div id="loading-bar" class="loading-bar"></div>
    
    <!-- Overlay de recherche -->
    <div class="search-overlay" id="searchOverlay">
        <div class="search-overlay-content">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-md-8">
                        <div class="search-box">
                            <input type="text" class="form-control form-control-lg" 
                                   placeholder="Rechercher des artistes, musiques, podcasts..." 
                                   id="overlaySearchInput">
                            <button class="btn btn-link search-close" onclick="closeSearchOverlay()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="search-results" id="searchResults">
                            <!-- Résultats de recherche en AJAX -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Messages flash -->
    <?php if (isset($_SESSION['flash_message'])): ?>
        <div class="alert alert-<?php echo $_SESSION['flash_type'] ?? 'info'; ?> alert-dismissible fade show flash-message" role="alert">
            <i class="fas fa-<?php echo $_SESSION['flash_type'] === 'success' ? 'check-circle' : ($_SESSION['flash_type'] === 'error' ? 'exclamation-triangle' : 'info-circle'); ?> me-2"></i>
            <?php echo $_SESSION['flash_message']; ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        <?php 
        unset($_SESSION['flash_message']);
        unset($_SESSION['flash_type']);
        ?>
    <?php endif; ?>
    
    <!-- Messages d'URL -->
    <?php if (isset($_GET['logged_out'])): ?>
        <div class="alert alert-success alert-dismissible fade show flash-message" role="alert">
            <i class="fas fa-check-circle me-2"></i>
            Vous avez été déconnecté avec succès.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php endif; ?>
    
    <?php if (isset($_GET['registered'])): ?>
        <div class="alert alert-success alert-dismissible fade show flash-message" role="alert">
            <i class="fas fa-check-circle me-2"></i>
            Inscription réussie ! Vous pouvez maintenant vous connecter.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php endif; ?>
    
    <?php if (isset($_GET['reset'])): ?>
        <div class="alert alert-success alert-dismissible fade show flash-message" role="alert">
            <i class="fas fa-check-circle me-2"></i>
            Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    <?php endif; ?>

    <script>
        // Variables globales pour JavaScript
        window.YT = {
            isLoggedIn: <?php echo $is_logged_in ? 'true' : 'false'; ?>,
            currentUser: <?php echo $is_logged_in ? json_encode($current_user) : 'null'; ?>,
            currentPage: '<?php echo $current_page; ?>',
            baseUrl: '<?php echo 'http://' . $_SERVER['HTTP_HOST']; ?>',
            csrfToken: '<?php echo $_SESSION['csrf_token'] ?? ''; ?>'
        };
    </script>