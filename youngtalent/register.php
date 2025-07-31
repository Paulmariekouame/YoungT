<?php
session_start();
include 'database.php';

$error = '';
$success = '';

if ($_POST) {
    $username = $_POST['username'];
    $email = $_POST['email'];
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    $artist_name = $_POST['artist_name'];
    $genre = $_POST['genre'];
    
    // Validation
    if ($password !== $confirm_password) {
        $error = 'Les mots de passe ne correspondent pas';
    } else {
        // Vérifier si l'email existe déjà
        $check_query = "SELECT id FROM users WHERE email = :email OR username = :username";
        $check_stmt = $db->prepare($check_query);
        $check_stmt->bindParam(':email', $email);
        $check_stmt->bindParam(':username', $username);
        $check_stmt->execute();
        
        if ($check_stmt->rowCount() > 0) {
            $error = 'Email ou nom d\'utilisateur déjà utilisé';
        } else {
            // Créer le compte
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            
            $insert_query = "INSERT INTO users (username, email, password, artist_name, genre) 
                           VALUES (:username, :email, :password, :artist_name, :genre)";
            $insert_stmt = $db->prepare($insert_query);
            $insert_stmt->bindParam(':username', $username);
            $insert_stmt->bindParam(':email', $email);
            $insert_stmt->bindParam(':password', $hashed_password);
            $insert_stmt->bindParam(':artist_name', $artist_name);
            $insert_stmt->bindParam(':genre', $genre);
            
            if ($insert_stmt->execute()) {
                $success = 'Compte créé avec succès ! Vous pouvez maintenant vous connecter.';
            } else {
                $error = 'Erreur lors de la création du compte';
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inscription - Young Talent</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="style.css" rel="stylesheet">
</head>
<body class="auth-page">
    <div class="container-fluid vh-100 d-flex align-items-center justify-content-center py-5">
        <div class="row w-100">
            <div class="col-md-6 col-lg-5 mx-auto">
                <div class="card bg-glass border-0 shadow-lg">
                    <div class="card-body p-5">
                        <div class="text-center mb-4">
                            <div class="logo-icon mb-3">
                                <i class="fas fa-music fa-3x text-orange"></i>
                            </div>
                            <h2 class="text-white fw-bold">Créer un compte</h2>
                            <p class="text-muted">Rejoignez la communauté Young Talent</p>
                        </div>

                        <?php if ($error): ?>
                            <div class="alert alert-danger" role="alert">
                                <?php echo $error; ?>
                            </div>
                        <?php endif; ?>

                        <?php if ($success): ?>
                            <div class="alert alert-success" role="alert">
                                <?php echo $success; ?>
                                <br><a href="login.php" class="text-decoration-none">Se connecter maintenant</a>
                            </div>
                        <?php endif; ?>

                        <form method="POST">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="username" class="form-label text-white">Nom d'utilisateur</label>
                                    <input type="text" class="form-control bg-dark border-secondary text-white" 
                                           id="username" name="username" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="artist_name" class="form-label text-white">Nom d'artiste</label>
                                    <input type="text" class="form-control bg-dark border-secondary text-white" 
                                           id="artist_name" name="artist_name" required>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="email" class="form-label text-white">Email</label>
                                <input type="email" class="form-control bg-dark border-secondary text-white" 
                                       id="email" name="email" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="genre" class="form-label text-white">Genre musical</label>
                                <select class="form-select bg-dark border-secondary text-white" 
                                        id="genre" name="genre" required>
                                    <option value="">Sélectionnez votre genre</option>
                                    <option value="Rap">Rap</option>
                                    <option value="R&B">R&B</option>
                                    <option value="Pop">Pop</option>
                                    <option value="Rock">Rock</option>
                                    <option value="Electronic">Électronique</option>
                                    <option value="Jazz">Jazz</option>
                                    <option value="Reggae">Reggae</option>
                                    <option value="Other">Autre</option>
                                </select>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <label for="password" class="form-label text-white">Mot de passe</label>
                                    <input type="password" class="form-control bg-dark border-secondary text-white" 
                                           id="password" name="password" required>
                                </div>
                                <div class="col-md-6 mb-3">
                                    <label for="confirm_password" class="form-label text-white">Confirmer</label>
                                    <input type="password" class="form-control bg-dark border-secondary text-white" 
                                           id="confirm_password" name="confirm_password" required>
                                </div>
                            </div>
                            
                            <div class="mb-4">
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="terms" required>
                                    <label class="form-check-label text-white" for="terms">
                                        J'accepte les 
                                        <a href="terms.php" class="text-orange text-decoration-none">
                                            conditions d'utilisation
                                        </a>
                                    </label>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn btn-gradient-orange w-100 py-2 fw-bold">
                                Créer mon compte
                            </button>
                        </form>
                        
                        <div class="text-center mt-4">
                            <p class="text-muted">
                                Déjà un compte ? 
                                <a href="login.php" class="text-orange text-decoration-none fw-bold">
                                    Se connecter
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>