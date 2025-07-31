<?php
session_start();
include 'database.php';

// Récupérer l'ID de l'artiste depuis l'URL
$artist_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;

if ($artist_id == 0) {
    header('Location: index.php');
    exit();
}

// Récupérer les informations de l'artiste
$artist_query = "SELECT * FROM users WHERE id = :artist_id";
$artist_stmt = $db->prepare($artist_query);
$artist_stmt->bindParam(':artist_id', $artist_id);
$artist_stmt->execute();
$artist = $artist_stmt->fetch(PDO::FETCH_ASSOC);

if (!$artist) {
    header('Location: index.php');
    exit();
}

// Vérifier si l'utilisateur connecté suit cet artiste
$is_following = false;
if (isset($_SESSION['user_id'])) {
    $follow_check_query = "SELECT id FROM followers WHERE follower_id = :user_id AND following_id = :artist_id";
    $follow_check_stmt = $db->prepare($follow_check_query);
    $follow_check_stmt->bindParam(':user_id', $_SESSION['user_id']);
    $follow_check_stmt->bindParam(':artist_id', $artist_id);
    $follow_check_stmt->execute();
    $is_following = $follow_check_stmt->rowCount() > 0;
}

// Récupérer les tracks de l'artiste
$tracks_query = "SELECT * FROM tracks WHERE user_id = :artist_id ORDER BY created_at DESC";
$tracks_stmt = $db->prepare($tracks_query);
$tracks_stmt->bindParam(':artist_id', $artist_id);
$tracks_stmt->execute();
$tracks = $tracks_stmt->fetchAll(PDO::FETCH_ASSOC);

// Récupérer les podcasts de l'artiste
$podcasts_query = "SELECT * FROM podcasts WHERE user_id = :artist_id ORDER BY created_at DESC";
$podcasts_stmt = $db->prepare($podcasts_query);
$podcasts_stmt->bindParam(':artist_id', $artist_id);
$podcasts_stmt->execute();
$podcasts = $podcasts_stmt->fetchAll(PDO::FETCH_ASSOC);

// Traitement du follow/unfollow
if ($_POST && isset($_POST['action']) && isset($_SESSION['user_id'])) {
    if ($_POST['action'] == 'follow' && !$is_following) {
        $follow_query = "INSERT INTO followers (follower_id, following_id) VALUES (:user_id, :artist_id)";
        $follow_stmt = $db->prepare($follow_query);
        $follow_stmt->bindParam(':user_id', $_SESSION['user_id']);
        $follow_stmt->bindParam(':artist_id', $artist_id);
        $follow_stmt->execute();
        
        // Mettre à jour le compteur de followers
        $update_followers = "UPDATE users SET followers_count = followers_count + 1 WHERE id = :artist_id";
        $update_stmt = $db->prepare($update_followers);
        $update_stmt->bindParam(':artist_id', $artist_id);
        $update_stmt->execute();
        
        $is_following = true;
        $artist['followers_count']++;
        
    } elseif ($_POST['action'] == 'unfollow' && $is_following) {
        $unfollow_query = "DELETE FROM followers WHERE follower_id = :user_id AND following_id = :artist_id";
        $unfollow_stmt = $db->prepare($unfollow_query);
        $unfollow_stmt->bindParam(':user_id', $_SESSION['user_id']);
        $unfollow_stmt->bindParam(':artist_id', $artist_id);
        $unfollow_stmt->execute();
        
        // Mettre à jour le compteur de followers
        $update_followers = "UPDATE users SET followers_count = followers_count - 1 WHERE id = :artist_id";
        $update_stmt = $db->prepare($update_followers);
        $update_stmt->bindParam(':artist_id', $artist_id);
        $update_stmt->execute();
        
        $is_following = false;
        $artist['followers_count']--;
    }
}

// Formater les nombres
function formatNumber($number) {
    if ($number >= 1000000) {
        return number_format($number / 1000000, 1) . 'M';
    } elseif ($number >= 1000) {
        return number_format($number / 1000, 1) . 'K';
    }
    return number_format($number);
}

// Formater la date
function formatDate($date) {
    return date('d M Y', strtotime($date));
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($artist['artist_name']); ?> - Young Talent</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="style.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-gradient-primary fixed-top">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="index.php">
                <div class="logo-icon me-2">
                    <i class="fas fa-music"></i>
                </div>
                <span class="fw-bold">Young Talent</span>
            </a>
            
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link" href="music.php">Musique</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="podcasts.php">Podcasts</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="artists.php">Artistes</a>
                    </li>
                </ul>
                
                <div class="d-flex">
                    <?php if(isset($_SESSION['user_id'])): ?>
                        <a href="dashboard.php" class="btn btn-outline-light me-2">Dashboard</a>
                        <a href="logout.php" class="btn btn-gradient-orange">Déconnexion</a>
                    <?php else: ?>
                        <a href="login.php" class="btn btn-outline-light me-2">Connexion</a>
                        <a href="register.php" class="btn btn-gradient-orange">S'inscrire</a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </nav>

    <!-- Cover Image -->
    <div class="artist-cover" style="margin-top: 76px;">
        <div class="cover-image">
            <?php if ($artist['cover_image']): ?>
                <img src="<?php echo htmlspecialchars($artist['cover_image']); ?>" alt="Cover" class="w-100">
            <?php else: ?>
                <div class="default-cover bg-gradient-primary d-flex align-items-center justify-content-center">
                    <i class="fas fa-music fa-5x text-white opacity-50"></i>
                </div>
            <?php endif; ?>
            <div class="cover-overlay"></div>
        </div>
    </div>

    <!-- Artist Info -->
    <div class="container artist-info-section">
        <div class="row">
            <div class="col-12">
                <div class="artist-header d-flex flex-column flex-md-row align-items-center align-items-md-end">
                    <!-- Profile Image -->
                    <div class="profile-image-container position-relative me-md-4 mb-3 mb-md-0">
                        <?php if ($artist['profile_image']): ?>
                            <img src="<?php echo htmlspecialchars($artist['profile_image']); ?>" 
                                 alt="<?php echo htmlspecialchars($artist['artist_name']); ?>" 
                                 class="profile-image">
                        <?php else: ?>
                            <div class="profile-image bg-gradient-primary d-flex align-items-center justify-content-center">
                                <i class="fas fa-user fa-4x text-white"></i>
                            </div>
                        <?php endif; ?>
                        
                        <?php if ($artist['verified']): ?>
                            <div class="verified-badge">
                                <i class="fas fa-check-circle text-primary"></i>
                            </div>
                        <?php endif; ?>
                    </div>

                    <!-- Artist Details -->
                    <div class="artist-details flex-grow-1 text-center text-md-start">
                        <h1 class="artist-name text-white fw-bold mb-2">
                            <?php echo htmlspecialchars($artist['artist_name']); ?>
                        </h1>
                        
                        <div class="artist-genre mb-3">
                            <span class="badge bg-gradient-orange fs-6">
                                <?php echo htmlspecialchars($artist['genre']); ?>
                            </span>
                        </div>

                        <!-- Stats -->
                        <div class="artist-stats d-flex flex-wrap justify-content-center justify-content-md-start gap-4 mb-3">
                            <div class="stat-item">
                                <i class="fas fa-users text-pink me-1"></i>
                                <span class="text-white"><?php echo formatNumber($artist['followers_count']); ?> followers</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-play text-orange me-1"></i>
                                <span class="text-white"><?php echo formatNumber($artist['total_plays']); ?> écoutes</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-music text-blue me-1"></i>
                                <span class="text-white"><?php echo count($tracks); ?> tracks</span>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-microphone text-purple me-1"></i>
                                <span class="text-white"><?php echo count($podcasts); ?> podcasts</span>
                            </div>
                            <?php if ($artist['location']): ?>
                            <div class="stat-item">
                                <i class="fas fa-map-marker-alt text-green me-1"></i>
                                <span class="text-white"><?php echo htmlspecialchars($artist['location']); ?></span>
                            </div>
                            <?php endif; ?>
                            <div class="stat-item">
                                <i class="fas fa-calendar text-muted me-1"></i>
                                <span class="text-white">Membre depuis <?php echo formatDate($artist['created_at']); ?></span>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="artist-actions d-flex flex-wrap justify-content-center justify-content-md-start gap-3">
                            <?php if (isset($_SESSION['user_id']) && $_SESSION['user_id'] != $artist_id): ?>
                                <form method="POST" class="d-inline">
                                    <input type="hidden" name="action" value="<?php echo $is_following ? 'unfollow' : 'follow'; ?>">
                                    <button type="submit" class="btn <?php echo $is_following ? 'btn-outline-light' : 'btn-gradient-orange'; ?>">
                                        <i class="fas fa-<?php echo $is_following ? 'user-check' : 'user-plus'; ?> me-2"></i>
                                        <?php echo $is_following ? 'Suivi' : 'Suivre'; ?>
                                    </button>
                                </form>
                            <?php endif; ?>
                            
                            <button class="btn btn-outline-light" onclick="shareArtist()">
                                <i class="fas fa-share me-2"></i>
                                Partager
                            </button>
                            
                            <?php if (count($tracks) > 0): ?>
                            <button class="btn btn-outline-orange" onclick="playRandomTrack()">
                                <i class="fas fa-random me-2"></i>
                                Lecture aléatoire
                            </button>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bio Section -->
    <?php if ($artist['bio']): ?>
    <div class="container mt-5">
        <div class="row">
            <div class="col-12">
                <div class="card bg-glass border-0">
                    <div class="card-body">
                        <h3 class="text-white mb-3">
                            <i class="fas fa-info-circle text-orange me-2"></i>
                            À propos
                        </h3>
                        <p class="text-white-50 mb-0 lh-lg">
                            <?php echo nl2br(htmlspecialchars($artist['bio'])); ?>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <!-- Content Tabs -->
    <div class="container mt-5">
        <div class="row">
            <div class="col-12">
                <!-- Tab Navigation -->
                <ul class="nav nav-pills nav-fill mb-4" id="contentTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="music-tab" data-bs-toggle="pill" data-bs-target="#music" type="button" role="tab">
                            <i class="fas fa-music me-2"></i>
                            Musique (<?php echo count($tracks); ?>)
                        </button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="podcasts-tab" data-bs-toggle="pill" data-bs-target="#podcasts" type="button" role="tab">
                            <i class="fas fa-microphone me-2"></i>
                            Podcasts (<?php echo count($podcasts); ?>)
                        </button>
                    </li>
                </ul>

                <!-- Tab Content -->
                <div class="tab-content" id="contentTabsContent">
                    <!-- Music Tab -->
                    <div class="tab-pane fade show active" id="music" role="tabpanel">
                        <?php if (count($tracks) > 0): ?>
                            <div class="tracks-list">
                                <?php foreach ($tracks as $index => $track): ?>
                                <div class="card bg-glass border-0 mb-3 track-item" data-track-id="<?php echo $track['id']; ?>">
                                    <div class="card-body">
                                        <div class="row align-items-center">
                                            <div class="col-auto">
                                                <div class="track-number text-muted me-3">
                                                    <?php echo $index + 1; ?>
                                                </div>
                                            </div>
                                            <div class="col-auto">
                                                <button class="btn btn-gradient-orange btn-sm rounded-circle play-btn" 
                                                        onclick="playTrack(<?php echo $track['id']; ?>, '<?php echo htmlspecialchars($track['title']); ?>', '<?php echo htmlspecialchars($artist['artist_name']); ?>')">
                                                    <i class="fas fa-play"></i>
                                                </button>
                                            </div>
                                            <div class="col-auto">
                                                <?php if ($track['image_path']): ?>
                                                    <img src="<?php echo htmlspecialchars($track['image_path']); ?>" 
                                                         alt="<?php echo htmlspecialchars($track['title']); ?>" 
                                                         class="track-thumbnail">
                                                <?php else: ?>
                                                    <div class="track-thumbnail bg-gradient-primary d-flex align-items-center justify-content-center">
                                                        <i class="fas fa-music text-white"></i>
                                                    </div>
                                                <?php endif; ?>
                                            </div>
                                            <div class="col">
                                                <h6 class="text-white mb-1"><?php echo htmlspecialchars($track['title']); ?></h6>
                                                <div class="d-flex align-items-center">
                                                    <span class="badge bg-secondary me-2"><?php echo htmlspecialchars($track['genre']); ?></span>
                                                    <small class="text-muted">
                                                        Sorti le <?php echo formatDate($track['release_date'] ?: $track['created_at']); ?>
                                                    </small>
                                                </div>
                                            </div>
                                            <div class="col-auto">
                                                <div class="track-stats d-flex align-items-center gap-3 text-muted">
                                                    <div class="d-flex align-items-center">
                                                        <i class="fas fa-play me-1"></i>
                                                        <span><?php echo formatNumber($track['plays_count']); ?></span>
                                                    </div>
                                                    <div class="d-flex align-items-center">
                                                        <i class="fas fa-heart me-1"></i>
                                                        <span><?php echo formatNumber($track['likes_count']); ?></span>
                                                    </div>
                                                    <div class="d-flex align-items-center">
                                                        <i class="fas fa-clock me-1"></i>
                                                        <span><?php echo $track['duration'] ?: '3:24'; ?></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-auto">
                                                <div class="dropdown">
                                                    <button class="btn btn-sm btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                                                        <i class="fas fa-ellipsis-v"></i>
                                                    </button>
                                                    <ul class="dropdown-menu">
                                                        <li><a class="dropdown-item" href="#" onclick="addToPlaylist(<?php echo $track['id']; ?>)">
                                                            <i class="fas fa-plus me-2"></i>Ajouter à une playlist
                                                        </a></li>
                                                        <li><a class="dropdown-item" href="#" onclick="shareTrack(<?php echo $track['id']; ?>)">
                                                            <i class="fas fa-share me-2"></i>Partager
                                                        </a></li>
                                                        <li><a class="dropdown-item" href="#" onclick="likeTrack(<?php echo $track['id']; ?>)">
                                                            <i class="fas fa-heart me-2"></i>J'aime
                                                        </a></li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        <?php else: ?>
                            <div class="text-center py-5">
                                <i class="fas fa-music fa-4x text-muted mb-3"></i>
                                <h4 class="text-white">Aucune musique disponible</h4>
                                <p class="text-muted">Cet artiste n'a pas encore publié de musique.</p>
                            </div>
                        <?php endif; ?>
                    </div>

                    <!-- Podcasts Tab -->
                    <div class="tab-pane fade" id="podcasts" role="tabpanel">
                        <?php if (count($podcasts) > 0): ?>
                            <div class="row">
                                <?php foreach ($podcasts as $podcast): ?>
                                <div class="col-md-6 col-lg-4 mb-4">
                                    <div class="card bg-glass border-0 h-100 podcast-item" data-podcast-id="<?php echo $podcast['id']; ?>">
                                        <div class="card-body">
                                            <div class="podcast-image-container position-relative mb-3">
                                                <?php if ($podcast['image_path']): ?>
                                                    <img src="<?php echo htmlspecialchars($podcast['image_path']); ?>" 
                                                         alt="<?php echo htmlspecialchars($podcast['title']); ?>" 
                                                         class="podcast-image">
                                                <?php else: ?>
                                                    <div class="podcast-image bg-gradient-primary d-flex align-items-center justify-content-center">
                                                        <i class="fas fa-microphone fa-3x text-white"></i>
                                                    </div>
                                                <?php endif; ?>
                                                
                                                <button class="btn btn-gradient-orange rounded-circle play-podcast-btn" 
                                                        onclick="playPodcast(<?php echo $podcast['id']; ?>, '<?php echo htmlspecialchars($podcast['title']); ?>', '<?php echo htmlspecialchars($artist['artist_name']); ?>')">
                                                    <i class="fas fa-play"></i>
                                                </button>
                                            </div>
                                            
                                            <div class="text-center">
                                                <span class="badge bg-secondary mb-2"><?php echo htmlspecialchars($podcast['category']); ?></span>
                                                <h6 class="text-white mb-2"><?php echo htmlspecialchars($podcast['title']); ?></h6>
                                                <p class="text-muted small mb-3"><?php echo htmlspecialchars($podcast['description']); ?></p>
                                                
                                                <div class="d-flex justify-content-center align-items-center gap-3 text-muted small">
                                                    <div class="d-flex align-items-center">
                                                        <i class="fas fa-clock me-1"></i>
                                                        <span><?php echo $podcast['duration'] ?: '25:30'; ?></span>
                                                    </div>
                                                    <div class="d-flex align-items-center">
                                                        <i class="fas fa-play me-1"></i>
                                                        <span><?php echo formatNumber($podcast['plays_count']); ?></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        <?php else: ?>
                            <div class="text-center py-5">
                                <i class="fas fa-microphone fa-4x text-muted mb-3"></i>
                                <h4 class="text-white">Aucun podcast disponible</h4>
                                <p class="text-muted">Cet artiste n'a pas encore publié de podcast.</p>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Music Player -->
    <div id="music-player" class="music-player d-none">
        <div class="container-fluid">
            <div class="row align-items-center">
                <div class="col-md-3">
                    <div class="d-flex align-items-center">
                        <img id="current-track-image" src="/placeholder.svg" alt="" class="track-image me-3">
                        <div>
                            <h6 id="current-track-title" class="mb-0 text-white"></h6>
                            <small id="current-track-artist" class="text-muted"></small>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 text-center">
                    <div class="player-controls mb-2">
                        <button class="btn btn-link text-white me-2" onclick="previousTrack()">
                            <i class="fas fa-step-backward"></i>
                        </button>
                        <button id="play-pause-btn" class="btn btn-orange rounded-circle" onclick="togglePlayPause()">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-link text-white ms-2" onclick="nextTrack()">
                            <i class="fas fa-step-forward"></i>
                        </button>
                    </div>
                    <div class="progress">
                        <div id="progress-bar" class="progress-bar bg-orange" style="width: 0%"></div>
                    </div>
                    <div class="d-flex justify-content-between mt-1">
                        <small id="current-time" class="text-muted">0:00</small>
                        <small id="total-time" class="text-muted">0:00</small>
                    </div>
                </div>
                <div class="col-md-3 text-end">
                    <button class="btn btn-link text-white me-2" onclick="toggleLike()">
                        <i id="like-btn" class="fas fa-heart"></i>
                    </button>
                    <button class="btn btn-link text-white me-2" onclick="toggleMute()">
                        <i id="volume-btn" class="fas fa-volume-up"></i>
                    </button>
                    <input type="range" id="volume-slider" class="form-range" min="0" max="100" value="50" style="width: 100px;">
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/js/artist.js"></script>

    <style>
        .artist-cover {
            height: 300px;
            position: relative;
            overflow: hidden;
        }

        .cover-image {
            height: 100%;
            position: relative;
        }

        .cover-image img {
            height: 100%;
            object-fit: cover;
        }

        .default-cover {
            height: 100%;
        }

        .cover-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));
        }

        .artist-info-section {
            margin-top: -100px;
            position: relative;
            z-index: 10;
        }

        .profile-image-container {
            position: relative;
        }

        .profile-image {
            width: 200px;
            height: 200px;
            border-radius: 50%;
            border: 4px solid rgba(255,255,255,0.2);
            object-fit: cover;
        }

        .verified-badge {
            position: absolute;
            bottom: 10px;
            right: 10px;
            background: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .artist-name {
            font-size: 3rem;
        }

        .stat-item {
            white-space: nowrap;
        }

        .track-thumbnail {
            width: 60px;
            height: 60px;
            border-radius: 8px;
            object-fit: cover;
        }

        .track-number {
            width: 30px;
            text-align: center;
            font-weight: 500;
        }

        .track-item:hover {
            background: rgba(255,255,255,0.15) !important;
        }

        .podcast-image-container {
            position: relative;
        }

        .podcast-image {
            width: 100%;
            height: 150px;
            border-radius: 12px;
            object-fit: cover;
        }

        .play-podcast-btn {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 50px;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .podcast-item:hover .play-podcast-btn {
            opacity: 1;
        }

        .nav-pills .nav-link {
            background: rgba(255,255,255,0.1);
            color: rgba(255,255,255,0.7);
            border-radius: 25px;
            margin: 0 5px;
            transition: all 0.3s ease;
        }

        .nav-pills .nav-link:hover {
            background: rgba(255,255,255,0.2);
            color: white;
        }

        .nav-pills .nav-link.active {
            background: linear-gradient(45deg, var(--orange-primary), var(--pink-primary));
            color: white;
        }

        @media (max-width: 768px) {
            .artist-name {
                font-size: 2rem;
            }
            
            .profile-image {
                width: 150px;
                height: 150px;
            }
            
            .artist-info-section {
                margin-top: -75px;
            }
            
            .artist-cover {
                height: 200px;
            }
        }
    </style>
</body>
</html>