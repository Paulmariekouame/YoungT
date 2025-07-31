<?php
session_start();
require_once 'database.php';
require_once 'auth.php';
require_once 'functions.php';

// Récupérer l'ID du podcast
$podcastId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if (!$podcastId) {
    header('Location: podcasts.php');
    exit();
}

// Récupérer les informations du podcast
$podcastQuery = "SELECT p.*, u.artist_name, u.profile_image, u.verified, u.id as artist_id,
                        COUNT(DISTINCT pl.id) as likes_count,
                        COUNT(DISTINCT pc.id) as comments_count,
                        (SELECT COUNT(*) FROM podcast_likes WHERE podcast_id = p.id AND user_id = :current_user_id) as user_liked
                 FROM podcasts p
                 JOIN users u ON p.user_id = u.id
                 LEFT JOIN podcast_likes pl ON p.id = pl.podcast_id
                 LEFT JOIN podcast_comments pc ON p.id = pc.podcast_id
                 WHERE p.id = :podcast_id AND p.status = 'published'
                 GROUP BY p.id";

$stmt = $db->prepare($podcastQuery);
$stmt->bindParam(':podcast_id', $podcastId);
$stmt->bindParam(':current_user_id', $auth->getCurrentUser()['id'] ?? 0);
$stmt->execute();

$podcast = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$podcast) {
    header('Location: podcasts.php?error=not_found');
    exit();
}

// Incrémenter le nombre d'écoutes
$updatePlaysQuery = "UPDATE podcasts SET plays_count = plays_count + 1 WHERE id = :podcast_id";
$updateStmt = $db->prepare($updatePlaysQuery);
$updateStmt->bindParam(':podcast_id', $podcastId);
$updateStmt->execute();

// Récupérer les commentaires
$commentsQuery = "SELECT pc.*, u.artist_name, u.profile_image, u.verified
                  FROM podcast_comments pc
                  JOIN users u ON pc.user_id = u.id
                  WHERE pc.podcast_id = :podcast_id
                  ORDER BY pc.created_at DESC
                  LIMIT 20";

$commentsStmt = $db->prepare($commentsQuery);
$commentsStmt->bindParam(':podcast_id', $podcastId);
$commentsStmt->execute();
$comments = $commentsStmt->fetchAll(PDO::FETCH_ASSOC);

// Récupérer les podcasts similaires
$similarQuery = "SELECT p.*, u.artist_name, u.profile_image, u.verified
                 FROM podcasts p
                 JOIN users u ON p.user_id = u.id
                 WHERE p.category = :category AND p.id != :podcast_id AND p.status = 'published'
                 ORDER BY p.plays_count DESC
                 LIMIT 6";

$similarStmt = $db->prepare($similarQuery);
$similarStmt->bindParam(':category', $podcast['category']);
$similarStmt->bindParam(':podcast_id', $podcastId);
$similarStmt->execute();
$similarPodcasts = $similarStmt->fetchAll(PDO::FETCH_ASSOC);

// Récupérer les autres podcasts de l'artiste
$artistPodcastsQuery = "SELECT p.*, COUNT(DISTINCT pl.id) as likes_count
                        FROM podcasts p
                        LEFT JOIN podcast_likes pl ON p.id = pl.podcast_id
                        WHERE p.user_id = :artist_id AND p.id != :podcast_id AND p.status = 'published'
                        GROUP BY p.id
                        ORDER BY p.created_at DESC
                        LIMIT 5";

$artistStmt = $db->prepare($artistPodcastsQuery);
$artistStmt->bindParam(':artist_id', $podcast['artist_id']);
$artistStmt->bindParam(':podcast_id', $podcastId);
$artistStmt->execute();
$artistPodcasts = $artistStmt->fetchAll(PDO::FETCH_ASSOC);

// Gestion des actions POST
if ($_POST && $auth->isLoggedIn()) {
    $currentUser = $auth->getCurrentUser();
    
    if (isset($_POST['action'])) {
        switch ($_POST['action']) {
            case 'like':
                if (verifyCSRFToken($_POST['csrf_token'])) {
                    $checkLike = "SELECT id FROM podcast_likes WHERE podcast_id = :podcast_id AND user_id = :user_id";
                    $checkStmt = $db->prepare($checkLike);
                    $checkStmt->bindParam(':podcast_id', $podcastId);
                    $checkStmt->bindParam(':user_id', $currentUser['id']);
                    $checkStmt->execute();
                    
                    if ($checkStmt->rowCount() > 0) {
                        // Unlike
                        $unlikeQuery = "DELETE FROM podcast_likes WHERE podcast_id = :podcast_id AND user_id = :user_id";
                        $unlikeStmt = $db->prepare($unlikeQuery);
                        $unlikeStmt->bindParam(':podcast_id', $podcastId);
                        $unlikeStmt->bindParam(':user_id', $currentUser['id']);
                        $unlikeStmt->execute();
                        
                        echo json_encode(['success' => true, 'liked' => false]);
                    } else {
                        // Like
                        $likeQuery = "INSERT INTO podcast_likes (podcast_id, user_id, created_at) VALUES (:podcast_id, :user_id, NOW())";
                        $likeStmt = $db->prepare($likeQuery);
                        $likeStmt->bindParam(':podcast_id', $podcastId);
                        $likeStmt->bindParam(':user_id', $currentUser['id']);
                        $likeStmt->execute();
                        
                        // Créer une notification pour l'artiste
                        if ($currentUser['id'] != $podcast['artist_id']) {
                            createNotification($db, $podcast['artist_id'], 
                                'Nouveau like', 
                                $currentUser['artist_name'] . ' a aimé votre podcast "' . $podcast['title'] . '"',
                                'success', 
                                'podcast.php?id=' . $podcastId, 
                                'heart');
                        }
                        
                        echo json_encode(['success' => true, 'liked' => true]);
                    }
                    exit();
                }
                break;
                
            case 'comment':
                if (verifyCSRFToken($_POST['csrf_token']) && !empty($_POST['comment'])) {
                    $comment = sanitizeInput($_POST['comment']);
                    
                    $commentQuery = "INSERT INTO podcast_comments (podcast_id, user_id, comment, created_at) 
                                    VALUES (:podcast_id, :user_id, :comment, NOW())";
                    $commentStmt = $db->prepare($commentQuery);
                    $commentStmt->bindParam(':podcast_id', $podcastId);
                    $commentStmt->bindParam(':user_id', $currentUser['id']);
                    $commentStmt->bindParam(':comment', $comment);
                    
                    if ($commentStmt->execute()) {
                        // Créer une notification pour l'artiste
                        if ($currentUser['id'] != $podcast['artist_id']) {
                            createNotification($db, $podcast['artist_id'], 
                                'Nouveau commentaire', 
                                $currentUser['artist_name'] . ' a commenté votre podcast "' . $podcast['title'] . '"',
                                'info', 
                                'podcast.php?id=' . $podcastId, 
                                'comment');
                        }
                        
                        redirectWithMessage('podcast.php?id=' . $podcastId, 'Commentaire ajouté avec succès !', 'success');
                    }
                }
                break;
        }
    }
}

$page_title = $podcast['title'] . ' - ' . $podcast['artist_name'];
$custom_css = ['assets/css/podcast.css'];
$custom_js = ['assets/js/podcast.js'];

include 'header.php';
?>

<main class="podcast-page">
    <!-- Hero Section -->
    <section class="podcast-hero">
        <div class="hero-background">
            <div class="hero-overlay"></div>
            <div class="hero-pattern"></div>
        </div>
        
        <div class="container">
            <div class="row align-items-center min-vh-50">
                <div class="col-lg-8 mx-auto text-center">
                    <!-- Podcast Cover -->
                    <div class="podcast-cover-container mb-4">
                        <div class="podcast-cover">
                            <?php if ($podcast['cover_image']): ?>
                                <img src="<?php echo htmlspecialchars($podcast['cover_image']); ?>" 
                                     alt="<?php echo htmlspecialchars($podcast['title']); ?>" 
                                     class="img-fluid rounded-3 shadow-lg">
                            <?php else: ?>
                                <div class="default-cover bg-gradient-primary rounded-3 shadow-lg d-flex align-items-center justify-content-center">
                                    <i class="fas fa-microphone fa-4x text-white opacity-75"></i>
                                </div>
                            <?php endif; ?>
                            
                            <!-- Play Button Overlay -->
                            <div class="play-overlay">
                                <button class="btn-play" id="mainPlayBtn" data-podcast-id="<?php echo $podcast['id']; ?>">
                                    <i class="fas fa-play"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Podcast Info -->
                    <div class="podcast-info">
                        <div class="podcast-category mb-2">
                            <span class="badge bg-orange rounded-pill px-3 py-2">
                                <i class="fas fa-tag me-1"></i>
                                <?php echo htmlspecialchars($podcast['category']); ?>
                            </span>
                        </div>
                        
                        <h1 class="podcast-title display-4 fw-bold text-white mb-3">
                            <?php echo htmlspecialchars($podcast['title']); ?>
                        </h1>
                        
                        <!-- Artist Info -->
                        <div class="artist-info mb-4">
                            <a href="artist.php?id=<?php echo $podcast['artist_id']; ?>" 
                               class="d-inline-flex align-items-center text-decoration-none">
                                <?php if ($podcast['profile_image']): ?>
                                    <img src="<?php echo htmlspecialchars($podcast['profile_image']); ?>" 
                                         alt="<?php echo htmlspecialchars($podcast['artist_name']); ?>" 
                                         class="rounded-circle me-3" width="48" height="48">
                                <?php else: ?>
                                    <div class="bg-gradient-orange rounded-circle me-3 d-flex align-items-center justify-content-center" 
                                         style="width: 48px; height: 48px;">
                                        <i class="fas fa-user text-white"></i>
                                    </div>
                                <?php endif; ?>
                                
                                <div class="text-start">
                                    <div class="artist-name h5 text-white mb-0">
                                        <?php echo htmlspecialchars($podcast['artist_name']); ?>
                                        <?php if ($podcast['verified']): ?>
                                            <i class="fas fa-check-circle text-primary ms-1"></i>
                                        <?php endif; ?>
                                    </div>
                                    <small class="text-muted">Créateur du podcast</small>
                                </div>
                            </a>
                        </div>
                        
                        <!-- Podcast Stats -->
                        <div class="podcast-stats">
                            <div class="row g-3 justify-content-center">
                                <div class="col-auto">
                                    <div class="stat-item">
                                        <i class="fas fa-play text-orange me-2"></i>
                                        <span class="fw-bold"><?php echo formatNumber($podcast['plays_count']); ?></span>
                                        <small class="text-muted ms-1">écoutes</small>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <div class="stat-item">
                                        <i class="fas fa-heart text-danger me-2"></i>
                                        <span class="fw-bold" id="likesCount"><?php echo formatNumber($podcast['likes_count']); ?></span>
                                        <small class="text-muted ms-1">likes</small>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <div class="stat-item">
                                        <i class="fas fa-comment text-info me-2"></i>
                                        <span class="fw-bold"><?php echo formatNumber($podcast['comments_count']); ?></span>
                                        <small class="text-muted ms-1">commentaires</small>
                                    </div>
                                </div>
                                <div class="col-auto">
                                    <div class="stat-item">
                                        <i class="fas fa-clock text-warning me-2"></i>
                                        <span class="fw-bold"><?php echo formatDuration($podcast['duration']); ?></span>
                                        <small class="text-muted ms-1">durée</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Audio Player Section -->
    <section class="audio-player-section py-4 bg-dark-subtle">
        <div class="container">
            <div class="audio-player-container">
                <div class="audio-player" id="podcastPlayer">
                    <audio id="audioElement" preload="metadata">
                        <source src="<?php echo htmlspecialchars($podcast['audio_path']); ?>" type="audio/mpeg">
                        Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                    
                    <div class="player-controls">
                        <div class="row align-items-center">
                            <div class="col-auto">
                                <div class="control-buttons">
                                    <button class="btn btn-link text-white" id="prevBtn" disabled>
                                        <i class="fas fa-step-backward"></i>
                                    </button>
                                    <button class="btn btn-orange btn-lg rounded-circle" id="playPauseBtn">
                                        <i class="fas fa-play"></i>
                                    </button>
                                    <button class="btn btn-link text-white" id="nextBtn" disabled>
                                        <i class="fas fa-step-forward"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="col">
                                <div class="progress-container">
                                    <div class="time-display">
                                        <span id="currentTime">00:00</span>
                                        <span class="mx-2">/</span>
                                        <span id="totalTime">00:00</span>
                                    </div>
                                    <div class="progress-bar-container">
                                        <div class="progress" style="height: 6px; cursor: pointer;" id="progressBar">
                                            <div class="progress-bar bg-orange" id="progressFill" style="width: 0%"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-auto">
                                <div class="volume-control">
                                    <button class="btn btn-link text-white" id="volumeBtn">
                                        <i class="fas fa-volume-up"></i>
                                    </button>
                                    <div class="volume-slider">
                                        <input type="range" class="form-range" min="0" max="100" value="100" id="volumeSlider">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-auto">
                                <div class="player-actions">
                                    <button class="btn btn-link text-white" id="speedBtn" title="Vitesse de lecture">
                                        <i class="fas fa-tachometer-alt"></i>
                                        <span class="speed-text">1x</span>
                                    </button>
                                    <button class="btn btn-link text-white" id="downloadBtn" title="Télécharger">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    <button class="btn btn-link text-white" id="shareBtn" title="Partager">
                                        <i class="fas fa-share-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Content Section -->
    <section class="podcast-content py-5">
        <div class="container">
            <div class="row">
                <!-- Main Content -->
                <div class="col-lg-8">
                    <!-- Description -->
                    <div class="content-card mb-4">
                        <div class="card bg-dark-subtle border-0">
                            <div class="card-body p-4">
                                <h3 class="card-title text-white mb-3">
                                    <i class="fas fa-info-circle text-orange me-2"></i>
                                    Description
                                </h3>
                                
                                <?php if ($podcast['description']): ?>
                                    <div class="podcast-description text-muted">
                                        <?php echo nl2br(htmlspecialchars($podcast['description'])); ?>
                                    </div>
                                <?php else: ?>
                                    <p class="text-muted fst-italic">Aucune description disponible.</p>
                                <?php endif; ?>
                                
                                <!-- Tags -->
                                <?php if ($podcast['tags']): ?>
                                    <div class="podcast-tags mt-4">
                                        <h6 class="text-white mb-2">Tags :</h6>
                                        <div class="tags-container">
                                            <?php 
                                            $tags = explode(',', $podcast['tags']);
                                            foreach ($tags as $tag): 
                                                $tag = trim($tag);
                                                if (!empty($tag)):
                                            ?>
                                                <span class="badge bg-secondary me-2 mb-2">
                                                    <i class="fas fa-hashtag me-1"></i>
                                                    <?php echo htmlspecialchars($tag); ?>
                                                </span>
                                            <?php 
                                                endif;
                                            endforeach; 
                                            ?>
                                        </div>
                                    </div>
                                <?php endif; ?>
                                
                                <!-- Podcast Info -->
                                <div class="podcast-meta mt-4 pt-3 border-top border-secondary">
                                    <div class="row g-3">
                                        <div class="col-md-6">
                                            <small class="text-muted d-block">Date de publication</small>
                                            <span class="text-white"><?php echo formatDateFR($podcast['created_at'], 'medium'); ?></span>
                                        </div>
                                        <div class="col-md-6">
                                            <small class="text-muted d-block">Dernière mise à jour</small>
                                            <span class="text-white"><?php echo formatDateFR($podcast['updated_at'], 'medium'); ?></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="content-card mb-4">
                        <div class="card bg-dark-subtle border-0">
                            <div class="card-body p-4">
                                <div class="podcast-actions">
                                    <div class="row g-3">
                                        <div class="col-auto">
                                            <?php if ($auth->isLoggedIn()): ?>
                                                <button class="btn btn-outline-danger" id="likeBtn" 
                                                        data-podcast-id="<?php echo $podcast['id']; ?>"
                                                        data-liked="<?php echo $podcast['user_liked'] ? 'true' : 'false'; ?>">
                                                    <i class="fas fa-heart me-2"></i>
                                                    <span id="likeText"><?php echo $podcast['user_liked'] ? 'Aimé' : 'Aimer'; ?></span>
                                                </button>
                                            <?php else: ?>
                                                <a href="login.php" class="btn btn-outline-danger">
                                                    <i class="fas fa-heart me-2"></i>
                                                    Aimer
                                                </a>
                                            <?php endif; ?>
                                        </div>
                                        
                                        <div class="col-auto">
                                            <button class="btn btn-outline-info" onclick="scrollToComments()">
                                                <i class="fas fa-comment me-2"></i>
                                                Commenter
                                            </button>
                                        </div>
                                        
                                        <div class="col-auto">
                                            <div class="dropdown">
                                                <button class="btn btn-outline-light dropdown-toggle" type="button" 
                                                        data-bs-toggle="dropdown">
                                                    <i class="fas fa-share-alt me-2"></i>
                                                    Partager
                                                </button>
                                                <ul class="dropdown-menu">
                                                    <li><a class="dropdown-item" href="#" onclick="shareOnFacebook()">
                                                        <i class="fab fa-facebook text-primary me-2"></i>Facebook
                                                    </a></li>
                                                    <li><a class="dropdown-item" href="#" onclick="shareOnTwitter()">
                                                        <i class="fab fa-twitter text-info me-2"></i>Twitter
                                                    </a></li>
                                                    <li><a class="dropdown-item" href="#" onclick="shareOnWhatsApp()">
                                                        <i class="fab fa-whatsapp text-success me-2"></i>WhatsApp
                                                    </a></li>
                                                    <li><hr class="dropdown-divider"></li>
                                                    <li><a class="dropdown-item" href="#" onclick="copyLink()">
                                                        <i class="fas fa-link text-orange me-2"></i>Copier le lien
                                                    </a></li>
                                                </ul>
                                            </div>
                                        </div>
                                        
                                        <div class="col-auto">
                                            <button class="btn btn-outline-success" onclick="addToPlaylist()">
                                                <i class="fas fa-plus me-2"></i>
                                                Ajouter à une playlist
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Comments Section -->
                    <div class="content-card" id="commentsSection">
                        <div class="card bg-dark-subtle border-0">
                            <div class="card-body p-4">
                                <h3 class="card-title text-white mb-4">
                                    <i class="fas fa-comments text-orange me-2"></i>
                                    Commentaires (<?php echo count($comments); ?>)
                                </h3>
                                
                                <!-- Comment Form -->
                                <?php if ($auth->isLoggedIn()): ?>
                                    <form method="POST" class="comment-form mb-4">
                                        <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                        <input type="hidden" name="action" value="comment">
                                        
                                        <div class="d-flex">
                                            <?php $currentUser = $auth->getCurrentUser(); ?>
                                            <?php if ($currentUser['profile_image']): ?>
                                                <img src="<?php echo htmlspecialchars($currentUser['profile_image']); ?>" 
                                                     alt="Votre avatar" class="rounded-circle me-3" width="40" height="40">
                                            <?php else: ?>
                                                <div class="bg-gradient-orange rounded-circle me-3 d-flex align-items-center justify-content-center" 
                                                     style="width: 40px; height: 40px;">
                                                    <i class="fas fa-user text-white"></i>
                                                </div>
                                            <?php endif; ?>
                                            
                                            <div class="flex-grow-1">
                                                <textarea class="form-control bg-dark border-secondary text-white" 
                                                          name="comment" rows="3" 
                                                          placeholder="Partagez votre avis sur ce podcast..." required></textarea>
                                                <div class="d-flex justify-content-end mt-2">
                                                    <button type="submit" class="btn btn-orange">
                                                        <i class="fas fa-paper-plane me-2"></i>
                                                        Publier
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                <?php else: ?>
                                    <div class="text-center py-4">
                                        <p class="text-muted mb-3">Connectez-vous pour laisser un commentaire</p>
                                        <a href="login.php" class="btn btn-orange">
                                            <i class="fas fa-sign-in-alt me-2"></i>
                                            Se connecter
                                        </a>
                                    </div>
                                <?php endif; ?>
                                
                                <!-- Comments List -->
                                <div class="comments-list">
                                    <?php if (empty($comments)): ?>
                                        <div class="text-center py-5">
                                            <i class="fas fa-comments fa-3x text-muted mb-3"></i>
                                            <p class="text-muted">Aucun commentaire pour le moment.</p>
                                            <p class="text-muted">Soyez le premier à partager votre avis !</p>
                                        </div>
                                    <?php else: ?>
                                        <?php foreach ($comments as $comment): ?>
                                            <div class="comment-item mb-4">
                                                <div class="d-flex">
                                                    <?php if ($comment['profile_image']): ?>
                                                        <img src="<?php echo htmlspecialchars($comment['profile_image']); ?>" 
                                                             alt="<?php echo htmlspecialchars($comment['artist_name']); ?>" 
                                                             class="rounded-circle me-3" width="40" height="40">
                                                    <?php else: ?>
                                                        <div class="bg-gradient-orange rounded-circle me-3 d-flex align-items-center justify-content-center" 
                                                             style="width: 40px; height: 40px;">
                                                            <i class="fas fa-user text-white"></i>
                                                        </div>
                                                    <?php endif; ?>
                                                    
                                                    <div class="flex-grow-1">
                                                        <div class="comment-header mb-2">
                                                            <span class="comment-author text-white fw-bold">
                                                                <?php echo htmlspecialchars($comment['artist_name']); ?>
                                                                <?php if ($comment['verified']): ?>
                                                                    <i class="fas fa-check-circle text-primary ms-1"></i>
                                                                <?php endif; ?>
                                                            </span>
                                                            <span class="comment-time text-muted ms-2">
                                                                <?php echo timeAgo($comment['created_at']); ?>
                                                            </span>
                                                        </div>
                                                        <div class="comment-content text-muted">
                                                            <?php echo nl2br(htmlspecialchars($comment['comment'])); ?>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="col-lg-4">
                    <!-- Artist's Other Podcasts -->
                    <?php if (!empty($artistPodcasts)): ?>
                        <div class="sidebar-card mb-4">
                            <div class="card bg-dark-subtle border-0">
                                <div class="card-body p-4">
                                    <h5 class="card-title text-white mb-3">
                                        <i class="fas fa-microphone text-orange me-2"></i>
                                        Autres podcasts de <?php echo htmlspecialchars($podcast['artist_name']); ?>
                                    </h5>
                                    
                                    <div class="podcast-list">
                                        <?php foreach ($artistPodcasts as $artistPodcast): ?>
                                            <div class="podcast-item mb-3">
                                                <a href="podcast.php?id=<?php echo $artistPodcast['id']; ?>" 
                                                   class="d-flex text-decoration-none">
                                                    <div class="podcast-thumbnail me-3">
                                                        <?php if ($artistPodcast['cover_image']): ?>
                                                            <img src="<?php echo htmlspecialchars($artistPodcast['cover_image']); ?>" 
                                                                 alt="<?php echo htmlspecialchars($artistPodcast['title']); ?>" 
                                                                 class="rounded" width="60" height="60">
                                                        <?php else: ?>
                                                            <div class="bg-gradient-primary rounded d-flex align-items-center justify-content-center" 
                                                                 style="width: 60px; height: 60px;">
                                                                <i class="fas fa-microphone text-white"></i>
                                                            </div>
                                                        <?php endif; ?>
                                                    </div>
                                                    <div class="podcast-info flex-grow-1">
                                                        <h6 class="podcast-title text-white mb-1">
                                                            <?php echo htmlspecialchars($artistPodcast['title']); ?>
                                                        </h6>
                                                        <div class="podcast-stats small text-muted">
                                                            <span><i class="fas fa-play me-1"></i><?php echo formatNumber($artistPodcast['plays_count']); ?></span>
                                                            <span class="ms-3"><i class="fas fa-heart me-1"></i><?php echo formatNumber($artistPodcast['likes_count']); ?></span>
                                                        </div>
                                                        <div class="podcast-date small text-muted">
                                                            <?php echo timeAgo($artistPodcast['created_at']); ?>
                                                        </div>
                                                    </div>
                                                </a>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                    
                                    <div class="text-center mt-3">
                                        <a href="artist.php?id=<?php echo $podcast['artist_id']; ?>" 
                                           class="btn btn-outline-orange btn-sm">
                                            Voir tous les podcasts
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endif; ?>

                    <!-- Similar Podcasts -->
                    <?php if (!empty($similarPodcasts)): ?>
                        <div class="sidebar-card mb-4">
                            <div class="card bg-dark-subtle border-0">
                                <div class="card-body p-4">
                                    <h5 class="card-title text-white mb-3">
                                        <i class="fas fa-thumbs-up text-orange me-2"></i>
                                        Podcasts similaires
                                    </h5>
                                    
                                    <div class="podcast-list">
                                        <?php foreach ($similarPodcasts as $similarPodcast): ?>
                                            <div class="podcast-item mb-3">
                                                <a href="podcast.php?id=<?php echo $similarPodcast['id']; ?>" 
                                                   class="d-flex text-decoration-none">
                                                    <div class="podcast-thumbnail me-3">
                                                        <?php if ($similarPodcast['cover_image']): ?>
                                                            <img src="<?php echo htmlspecialchars($similarPodcast['cover_image']); ?>" 
                                                                 alt="<?php echo htmlspecialchars($similarPodcast['title']); ?>" 
                                                                 class="rounded" width="60" height="60">
                                                        <?php else: ?>
                                                            <div class="bg-gradient-primary rounded d-flex align-items-center justify-content-center" 
                                                                 style="width: 60px; height: 60px;">
                                                                <i class="fas fa-microphone text-white"></i>
                                                            </div>
                                                        <?php endif; ?>
                                                    </div>
                                                    <div class="podcast-info flex-grow-1">
                                                        <h6 class="podcast-title text-white mb-1">
                                                            <?php echo htmlspecialchars($similarPodcast['title']); ?>
                                                        </h6>
                                                        <div class="podcast-artist small text-orange">
                                                            <?php echo htmlspecialchars($similarPodcast['artist_name']); ?>
                                                            <?php if ($similarPodcast['verified']): ?>
                                                                <i class="fas fa-check-circle ms-1"></i>
                                                            <?php endif; ?>
                                                        </div>
                                                        <div class="podcast-stats small text-muted">
                                                            <span><i class="fas fa-play me-1"></i><?php echo formatNumber($similarPodcast['plays_count']); ?></span>
                                                        </div>
                                                    </div>
                                                </a>
                                            </div>
                                        <?php endforeach; ?>
                                    </div>
                                    
                                    <div class="text-center mt-3">
                                        <a href="podcasts.php?category=<?php echo urlencode($podcast['category']); ?>" 
                                           class="btn btn-outline-orange btn-sm">
                                            Voir plus dans <?php echo htmlspecialchars($podcast['category']); ?>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>
                    <?php endif; ?>

                    <!-- Share Widget -->
                    <div class="sidebar-card">
                        <div class="card bg-dark-subtle border-0">
                            <div class="card-body p-4">
                                <h5 class="card-title text-white mb-3">
                                    <i class="fas fa-share-alt text-orange me-2"></i>
                                    Partager ce podcast
                                </h5>
                                
                                <div class="share-buttons">
                                    <div class="row g-2">
                                        <div class="col-6">
                                            <button class="btn btn-outline-primary w-100" onclick="shareOnFacebook()">
                                                <i class="fab fa-facebook me-2"></i>
                                                Facebook
                                            </button>
                                        </div>
                                        <div class="col-6">
                                            <button class="btn btn-outline-info w-100" onclick="shareOnTwitter()">
                                                <i class="fab fa-twitter me-2"></i>
                                                Twitter
                                            </button>
                                        </div>
                                        <div class="col-6">
                                            <button class="btn btn-outline-success w-100" onclick="shareOnWhatsApp()">
                                                <i class="fab fa-whatsapp me-2"></i>
                                                WhatsApp
                                            </button>
                                        </div>
                                        <div class="col-6">
                                            <button class="btn btn-outline-orange w-100" onclick="copyLink()">
                                                <i class="fas fa-link me-2"></i>
                                                Copier
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="share-url mt-3">
                                    <label class="form-label text-white small">URL du podcast :</label>
                                    <div class="input-group">
                                        <input type="text" class="form-control bg-dark border-secondary text-white" 
                                               id="shareUrl" value="<?php echo 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']; ?>" readonly>
                                        <button class="btn btn-outline-orange" onclick="copyLink()">
                                            <i class="fas fa-copy"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</main>

<!-- Speed Control Modal -->
<div class="modal fade" id="speedModal" tabindex="-1">
    <div class="modal-dialog modal-sm">
        <div class="modal-content bg-dark">
            <div class="modal-header border-secondary">
                <h5 class="modal-title text-white">Vitesse de lecture</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
                <div class="speed-options">
                    <button class="btn btn-outline-light w-100 mb-2" onclick="setPlaybackSpeed(0.5)">0.5x</button>
                    <button class="btn btn-outline-light w-100 mb-2" onclick="setPlaybackSpeed(0.75)">0.75x</button>
                    <button class="btn btn-orange w-100 mb-2" onclick="setPlaybackSpeed(1)">1x (Normal)</button>
                    <button class="btn btn-outline-light w-100 mb-2" onclick="setPlaybackSpeed(1.25)">1.25x</button>
                    <button class="btn btn-outline-light w-100 mb-2" onclick="setPlaybackSpeed(1.5)">1.5x</button>
                    <button class="btn btn-outline-light w-100" onclick="setPlaybackSpeed(2)">2x</button>
                </div>
            </div>
        </div>
    </div>
</div>
     <script src="podcast.js"></script> <!-- chemin vers ton fichier JS -->

<script>
// Variables globales pour le podcast
window.podcastData = {
    id: <?php echo $podcast['id']; ?>,
    title: <?php echo json_encode($podcast['title']); ?>,
    artist: <?php echo json_encode($podcast['artist_name']); ?>,
    audioUrl: <?php echo json_encode($podcast['audio_path']); ?>,
    coverImage: <?php echo json_encode($podcast['cover_image'] ?: '/placeholder.svg?height=300&width=300'); ?>,
    duration: <?php echo $podcast['duration']; ?>,
    liked: <?php echo $podcast['user_liked'] ? 'true' : 'false'; ?>,
    csrfToken: <?php echo json_encode(generateCSRFToken()); ?>
};
</script>

<?php include 'footer.php'; ?>