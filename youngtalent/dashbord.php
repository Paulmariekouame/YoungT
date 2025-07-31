<?php
session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

include 'database.php';

$user_id = $_SESSION['user_id'];

// Récupérer les statistiques de l'utilisateur
$stats_query = "SELECT 
    u.followers_count,
    u.total_plays,
    COUNT(DISTINCT t.id) as tracks_count,
    COUNT(DISTINCT p.id) as podcasts_count
    FROM users u
    LEFT JOIN tracks t ON u.id = t.user_id
    LEFT JOIN podcasts p ON u.id = p.user_id
    WHERE u.id = :user_id
    GROUP BY u.id";

$stats_stmt = $db->prepare($stats_query);
$stats_stmt->bindParam(':user_id', $user_id);
$stats_stmt->execute();
$stats = $stats_stmt->fetch(PDO::FETCH_ASSOC);

// Récupérer les tracks récentes
$tracks_query = "SELECT * FROM tracks WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 5";
$tracks_stmt = $db->prepare($tracks_query);
$tracks_stmt->bindParam(':user_id', $user_id);
$tracks_stmt->execute();
$recent_tracks = $tracks_stmt->fetchAll(PDO::FETCH_ASSOC);

// Récupérer les podcasts récents
$podcasts_query = "SELECT * FROM podcasts WHERE user_id = :user_id ORDER BY created_at DESC LIMIT 5";
$podcasts_stmt = $db->prepare($podcasts_query);
$podcasts_stmt->bindParam(':user_id', $user_id);
$podcasts_stmt->execute();
$recent_podcasts = $podcasts_stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - Young Talent</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="style.css" rel="stylesheet">
</head>
<body>
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-gradient-primary">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="index.php">
                <div class="logo-icon me-2">
                    <i class="fas fa-music"></i>
                </div>
                <span class="fw-bold">Young Talent</span>
            </a>
            
            <div class="d-flex align-items-center">
                <div class="dropdown">
                    <button class="btn btn-outline-light dropdown-toggle" type="button" data-bs-toggle="dropdown">
                        <i class="fas fa-user me-2"></i>
                        <?php echo $_SESSION['artist_name']; ?>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="profile.php">Profil</a></li>
                        <li><a class="dropdown-item" href="settings.php">Paramètres</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="logout.php">Déconnexion</a></li>
                    </ul>
                </div>
            </div>
        </div>
    </nav>

    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <div class="col-md-3 col-lg-2 sidebar bg-dark">
                <div class="p-3">
                    <ul class="nav nav-pills flex-column">
                        <li class="nav-item">
                            <a class="nav-link active" href="#overview" data-bs-toggle="pill">
                                <i class="fas fa-chart-line me-2"></i>
                                Vue d'ensemble
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#music" data-bs-toggle="pill">
                                <i class="fas fa-music me-2"></i>
                                Musique
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#podcasts" data-bs-toggle="pill">
                                <i class="fas fa-microphone me-2"></i>
                                Podcasts
                            </a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#analytics" data-bs-toggle="pill">
                                <i class="fas fa-chart-bar me-2"></i>
                                Analytiques
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Main Content -->
            <div class="col-md-9 col-lg-10 main-content">
                <div class="p-4">
                    <!-- Welcome Section -->
                    <div class="mb-4">
                        <h1 class="text-white">Bienvenue, <?php echo $_SESSION['artist_name']; ?>!</h1>
                        <p class="text-muted">Gérez votre contenu et suivez vos performances</p>
                    </div>

                    <!-- Stats Cards -->
                    <div class="row mb-4">
                        <div class="col-md-3 mb-3">
                            <div class="card bg-glass border-0">
                                <div class="card-body text-center">
                                    <i class="fas fa-play fa-2x text-orange mb-2"></i>
                                    <h3 class="text-white"><?php echo number_format($stats['total_plays']); ?></h3>
                                    <p class="text-muted mb-0">Total Écoutes</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card bg-glass border-0">
                                <div class="card-body text-center">
                                    <i class="fas fa-users fa-2x text-pink mb-2"></i>
                                    <h3 class="text-white"><?php echo number_format($stats['followers_count']); ?></h3>
                                    <p class="text-muted mb-0">Followers</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card bg-glass border-0">
                                <div class="card-body text-center">
                                    <i class="fas fa-music fa-2x text-blue mb-2"></i>
                                    <h3 class="text-white"><?php echo $stats['tracks_count']; ?></h3>
                                    <p class="text-muted mb-0">Tracks</p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 mb-3">
                            <div class="card bg-glass border-0">
                                <div class="card-body text-center">
                                    <i class="fas fa-microphone fa-2x text-green mb-2"></i>
                                    <h3 class="text-white"><?php echo $stats['podcasts_count']; ?></h3>
                                    <p class="text-muted mb-0">Podcasts</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Tab Content -->
                    <div class="tab-content">
                        <!-- Overview Tab -->
                        <div class="tab-pane fade show active" id="overview">
                            <div class="row">
                                <div class="col-md-6 mb-4">
                                    <div class="card bg-glass border-0">
                                        <div class="card-header">
                                            <h5 class="text-white mb-0">Actions Rapides</h5>
                                        </div>
                                        <div class="card-body">
                                            <div class="d-grid gap-2">
                                                <button class="btn btn-gradient-orange" data-bs-toggle="modal" data-bs-target="#uploadTrackModal">
                                                    <i class="fas fa-upload me-2"></i>
                                                    Uploader une track
                                                </button>
                                                <button class="btn btn-outline-light" data-bs-toggle="modal" data-bs-target="#uploadPodcastModal">
                                                    <i class="fas fa-microphone me-2"></i>
                                                    Créer un podcast
                                                </button>
                                                <a href="#analytics" class="btn btn-outline-light" data-bs-toggle="pill">
                                                    <i class="fas fa-chart-bar me-2"></i>
                                                    Voir les statistiques
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6 mb-4">
                                    <div class="card bg-glass border-0">
                                        <div class="card-header">
                                            <h5 class="text-white mb-0">Activité Récente</h5>
                                        </div>
                                        <div class="card-body">
                                            <div class="activity-item mb-2">
                                                <i class="fas fa-circle text-success me-2" style="font-size: 8px;"></i>
                                                <small class="text-muted">Nouveau follower aujourd'hui</small>
                                            </div>
                                            <div class="activity-item mb-2">
                                                <i class="fas fa-circle text-info me-2" style="font-size: 8px;"></i>
                                                <small class="text-muted">Track populaire cette semaine</small>
                                            </div>
                                            <div class="activity-item">
                                                <i class="fas fa-circle text-warning me-2" style="font-size: 8px;"></i>
                                                <small class="text-muted">Nouveau commentaire reçu</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Music Tab -->
                        <div class="tab-pane fade" id="music">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h2 class="text-white">Mes Tracks</h2>
                                <button class="btn btn-gradient-orange" data-bs-toggle="modal" data-bs-target="#uploadTrackModal">
                                    <i class="fas fa-upload me-2"></i>
                                    Uploader
                                </button>
                            </div>
                            
                            <div class="row">
                                <?php foreach ($recent_tracks as $track): ?>
                                <div class="col-md-6 mb-3">
                                    <div class="card bg-glass border-0">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center">
                                                <div class="track-image me-3">
                                                    <i class="fas fa-music fa-2x text-orange"></i>
                                                </div>
                                                <div class="flex-grow-1">
                                                    <h6 class="text-white mb-1"><?php echo htmlspecialchars($track['title']); ?></h6>
                                                    <small class="text-muted"><?php echo $track['genre']; ?> • <?php echo $track['duration']; ?></small>
                                                    <div class="mt-1">
                                                        <small class="text-muted">
                                                            <i class="fas fa-play me-1"></i><?php echo number_format($track['plays_count']); ?>
                                                            <i class="fas fa-heart ms-2 me-1"></i><?php echo number_format($track['likes_count']); ?>
                                                        </small>
                                                    </div>
                                                </div>
                                                <div class="dropdown">
                                                    <button class="btn btn-sm btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                                                        <i class="fas fa-ellipsis-v"></i>
                                                    </button>
                                                    <ul class="dropdown-menu">
                                                        <li><a class="dropdown-item" href="#">Modifier</a></li>
                                                        <li><a class="dropdown-item" href="#">Statistiques</a></li>
                                                        <li><a class="dropdown-item text-danger" href="#">Supprimer</a></li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        </div>

                        <!-- Podcasts Tab -->
                        <div class="tab-pane fade" id="podcasts">
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <h2 class="text-white">Mes Podcasts</h2>
                                <button class="btn btn-gradient-orange" data-bs-toggle="modal" data-bs-target="#uploadPodcastModal">
                                    <i class="fas fa-microphone me-2"></i>
                                    Nouveau Podcast
                                </button>
                            </div>
                            
                            <div class="row">
                                <?php foreach ($recent_podcasts as $podcast): ?>
                                <div class="col-md-6 mb-3">
                                    <div class="card bg-glass border-0">
                                        <div class="card-body">
                                            <div class="d-flex align-items-center">
                                                <div class="podcast-image me-3">
                                                    <i class="fas fa-microphone fa-2x text-purple"></i>
                                                </div>
                                                <div class="flex-grow-1">
                                                    <h6 class="text-white mb-1"><?php echo htmlspecialchars($podcast['title']); ?></h6>
                                                    <small class="text-muted"><?php echo $podcast['category']; ?> • <?php echo $podcast['duration']; ?></small>
                                                    <div class="mt-1">
                                                        <small class="text-muted">
                                                            <i class="fas fa-play me-1"></i><?php echo number_format($podcast['plays_count']); ?>
                                                        </small>
                                                    </div>
                                                </div>
                                                <div class="dropdown">
                                                    <button class="btn btn-sm btn-outline-light dropdown-toggle" data-bs-toggle="dropdown">
                                                        <i class="fas fa-ellipsis-v"></i>
                                                    </button>
                                                    <ul class="dropdown-menu">
                                                        <li><a class="dropdown-item" href="#">Modifier</a></li>
                                                        <li><a class="dropdown-item" href="#">Statistiques</a></li>
                                                        <li><a class="dropdown-item text-danger" href="#">Supprimer</a></li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <?php endforeach; ?>
                            </div>
                        </div>

                        <!-- Analytics Tab -->
                        <div class="tab-pane fade" id="analytics">
                            <h2 class="text-white mb-4">Analytiques</h2>
                            <div class="row">
                                <div class="col-md-6 mb-4">
                                    <div class="card bg-glass border-0">
                                        <div class="card-header">
                                            <h5 class="text-white mb-0">Croissance des Followers</h5>
                                        </div>
                                        <div class="card-body">
                                            <div class="text-success mb-3">
                                                <i class="fas fa-arrow-up me-1"></i>
                                                +12% ce mois
                                            </div>
                                            <div class="chart-placeholder bg-dark rounded p-4 text-center">
                                                <i class="fas fa-chart-line fa-3x text-muted"></i>
                                                <p class="text-muted mt-2">Graphique des followers</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6 mb-4">
                                    <div class="card bg-glass border-0">
                                        <div class="card-header">
                                            <h5 class="text-white mb-0">Top Tracks</h5>
                                        </div>
                                        <div class="card-body">
                                            <?php foreach (array_slice($recent_tracks, 0, 3) as $index => $track): ?>
                                            <div class="d-flex justify-content-between align-items-center mb-2">
                                                <span class="text-white"><?php echo htmlspecialchars($track['title']); ?></span>
                                                <span class="badge bg-secondary"><?php echo number_format($track['plays_count']); ?></span>
                                            </div>
                                            <?php endforeach; ?>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Upload Track Modal -->
    <div class="modal fade" id="uploadTrackModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content bg-dark">
                <div class="modal-header border-secondary">
                    <h5 class="modal-title text-white">Uploader une Track</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <form action="upload_track.php" method="POST" enctype="multipart/form-data">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="track_title" class="form-label text-white">Titre</label>
                            <input type="text" class="form-control bg-dark border-secondary text-white" 
                                   id="track_title" name="title" required>
                        </div>
                        <div class="mb-3">
                            <label for="track_genre" class="form-label text-white">Genre</label>
                            <select class="form-select bg-dark border-secondary text-white" 
                                    id="track_genre" name="genre" required>
                                <option value="Rap">Rap</option>
                                <option value="R&B">R&B</option>
                                <option value="Pop">Pop</option>
                                <option value="Rock">Rock</option>
                                <option value="Electronic">Électronique</option>
                                <option value="Jazz">Jazz</option>
                                <option value="Other">Autre</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="track_file" class="form-label text-white">Fichier Audio</label>
                            <input type="file" class="form-control bg-dark border-secondary text-white" 
                                   id="track_file" name="track_file" accept="audio/*" required>
                        </div>
                        <div class="mb-3">
                            <label for="track_image" class="form-label text-white">Image de couverture</label>
                            <input type="file" class="form-control bg-dark border-secondary text-white" 
                                   id="track_image" name="track_image" accept="image/*">
                        </div>
                    </div>
                    <div class="modal-footer border-secondary">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="submit" class="btn btn-gradient-orange">Uploader</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Upload Podcast Modal -->
    <div class="modal fade" id="uploadPodcastModal" tabindex="-1">
        <div class="modal-dialog">
            <div class="modal-content bg-dark">
                <div class="modal-header border-secondary">
                    <h5 class="modal-title text-white">Créer un Podcast</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <form action="upload_podcast.php" method="POST" enctype="multipart/form-data">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="podcast_title" class="form-label text-white">Titre</label>
                            <input type="text" class="form-control bg-dark border-secondary text-white" 
                                   id="podcast_title" name="title" required>
                        </div>
                        <div class="mb-3">
                            <label for="podcast_description" class="form-label text-white">Description</label>
                            <textarea class="form-control bg-dark border-secondary text-white" 
                                      id="podcast_description" name="description" rows="3" required></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="podcast_category" class="form-label text-white">Catégorie</label>
                            <select class="form-select bg-dark border-secondary text-white" 
                                    id="podcast_category" name="category" required>
                                <option value="Histoire personnelle">Histoire personnelle</option>
                                <option value="Créativité">Créativité</option>
                                <option value="Industrie">Industrie</option>
                                <option value="Conseils">Conseils</option>
                                <option value="Production">Production</option>
                                <option value="Autre">Autre</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="podcast_file" class="form-label text-white">Fichier Audio</label>
                            <input type="file" class="form-control bg-dark border-secondary text-white" 
                                   id="podcast_file" name="podcast_file" accept="audio/*" required>
                        </div>
                    </div>
                    <div class="modal-footer border-secondary">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                        <button type="submit" class="btn btn-gradient-orange">Créer</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>