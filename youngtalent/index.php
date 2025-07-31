<?php
session_start();
include 'database.php';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Young Talent - Plateforme Musicale</title>
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
                        <a class="nav-link" href="podcast.php">Podcasts</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="artist.php">Artistes</a>
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

    <!-- Hero Section -->
    <section class="hero-section">
        <div class="hero-overlay"></div>
        <div class="container">
            <div class="row align-items-center min-vh-100">
                <div class="col-lg-8 mx-auto text-center text-white">
                    <h1 class="display-2 fw-bold mb-4">
                        Votre Talent
                        <span class="text-gradient">Mérite</span>
                        d'Être Entendu
                    </h1>
                    <p class="lead mb-5">
                        La plateforme dédiée aux jeunes talents musicaux. 
                        Partagez votre musique, créez des podcasts et connectez-vous avec vos fans.
                    </p>
                    <div class="d-flex flex-column flex-sm-row gap-3 justify-content-center">
                        <a href="register.php" class="btn btn-gradient-orange btn-lg px-5">
                            <i class="fas fa-microphone me-2"></i>
                            Devenir Artiste
                        </a>
                        <a href="music.php" class="btn btn-outline-light btn-lg px-5">
                            <i class="fas fa-play me-2"></i>
                            Découvrir
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Features Section -->
    <section class="py-5 bg-dark">
        <div class="container">
            <div class="row">
                <div class="col-lg-12 text-center mb-5">
                    <h2 class="display-4 text-white fw-bold">Tout ce dont vous avez besoin</h2>
                </div>
            </div>
            <div class="row g-4">
                <div class="col-md-4">
                    <div class="card bg-glass border-0 h-100">
                        <div class="card-body text-center text-white p-4">
                            <div class="feature-icon mb-3">
                                <i class="fas fa-music fa-3x text-orange"></i>
                            </div>
                            <h4 class="fw-bold">Diffusion Musicale</h4>
                            <p>Partagez vos créations avec le monde entier</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-glass border-0 h-100">
                        <div class="card-body text-center text-white p-4">
                            <div class="feature-icon mb-3">
                                <i class="fas fa-microphone fa-3x text-pink"></i>
                            </div>
                            <h4 class="fw-bold">Podcasts</h4>
                            <p>Créez et diffusez vos podcasts</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card bg-glass border-0 h-100">
                        <div class="card-body text-center text-white p-4">
                            <div class="feature-icon mb-3">
                                <i class="fas fa-users fa-3x text-blue"></i>
                            </div>
                            <h4 class="fw-bold">Gestion des Fans</h4>
                            <p>Construisez votre communauté</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Featured Artists -->
    <section class="py-5">
        <div class="container">
            <div class="row mb-5">
                <div class="col-lg-6">
                    <h2 class="display-5 text-white fw-bold">Artistes en Vedette</h2>
                </div>
                <div class="col-lg-6 text-end">
                    <a href="artist.php" class="btn btn-outline-orange">
                        Voir tous <i class="fas fa-arrow-right ms-2"></i>
                    </a>
                </div>
            </div>
            
            <div class="row g-4" id="featured-artist">
                <!-- Artists will be loaded via JavaScript -->
            </div>
        </div>
    </section>

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
                    <div class="player-controls">
                        <button class="btn btn-link text-white me-2">
                            <i class="fas fa-step-backward"></i>
                        </button>
                        <button id="play-pause-btn" class="btn btn-orange rounded-circle">
                            <i class="fas fa-play"></i>
                        </button>
                        <button class="btn btn-link text-white ms-2">
                            <i class="fas fa-step-forward"></i>
                        </button>
                    </div>
                    <div class="progress mt-2">
                        <div class="progress-bar bg-orange" style="width: 30%"></div>
                    </div>
                </div>
                <div class="col-md-3 text-end">
                    <button class="btn btn-link text-white me-2">
                        <i class="fas fa-heart"></i>
                    </button>
                    <button class="btn btn-link text-white">
                        <i class="fas fa-volume-up"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer -->
    <footer class="bg-black py-5">
        <div class="container">
            <div class="row">
                <div class="col-md-3 mb-4">
                    <div class="d-flex align-items-center mb-3">
                        <div class="logo-icon me-2">
                            <i class="fas fa-music"></i>
                        </div>
                        <span class="fw-bold text-white">Young Talent</span>
                    </div>
                    <p class="text-muted">La plateforme qui révèle les talents musicaux de demain.</p>
                </div>
                <div class="col-md-3 mb-4">
                    <h5 class="text-white mb-3">Plateforme</h5>
                    <ul class="list-unstyled">
                        <li><a href="music.php" class="text-muted text-decoration-none">Musique</a></li>
                        <li><a href="podcasts.php" class="text-muted text-decoration-none">Podcasts</a></li>
                        <li><a href="artists.php" class="text-muted text-decoration-none">Artistes</a></li>
                    </ul>
                </div>
                <div class="col-md-3 mb-4">
                    <h5 class="text-white mb-3">Support</h5>
                    <ul class="list-unstyled">
                        <li><a href="#" class="text-muted text-decoration-none">Aide</a></li>
                        <li><a href="#" class="text-muted text-decoration-none">Contact</a></li>
                        <li><a href="#" class="text-muted text-decoration-none">FAQ</a></li>
                    </ul>
                </div>
                <div class="col-md-3 mb-4">
                    <h5 class="text-white mb-3">Légal</h5>
                    <ul class="list-unstyled">
                        <li><a href="#" class="text-muted text-decoration-none">Confidentialité</a></li>
                        <li><a href="#" class="text-muted text-decoration-none">Conditions</a></li>
                    </ul>
                </div>
            </div>
            <hr class="border-secondary">
            <div class="text-center">
                <p class="text-muted mb-0">&copy; 2024 Young Talent. Tous droits réservés.</p>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="main.js"></script>
</body>
</html>