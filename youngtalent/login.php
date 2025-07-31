<?php
session_start();
include 'database.php';

$error = '';

if ($_POST) {
    $email = $_POST['email'];
    $password = $_POST['password'];
    
    $query = "SELECT id, username, email, password, artist_name FROM users WHERE email = :email";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            $_SESSION['artist_name'] = $user['artist_name'];
            header('Location: dashboard.php');
            exit();
        } else {
            $error = 'Mot de passe incorrect';
        }
    } else {
        $error = 'Email non trouvé';
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Connexion - Young Talent</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="style.css" rel="stylesheet">
</head>
<body class="auth-page">
    <div class="container-fluid vh-100 d-flex align-items-center justify-content-center">
        <div class="row w-100">
            <div class="col-md-6 col-lg-4 mx-auto">
                <div class="card bg-glass border-0 shadow-lg">
                    <div class="card-body p-5">
                        <div class="text-center mb-4">
                            <div class="logo-icon mb-3">
                                <i class="fas fa-music fa-3x text-orange"></i>
                            </div>
                            <h2 class="text-white fw-bold">Connexion</h2>
                            <p class="text-muted">Connectez-vous à votre compte Young Talent</p>
                        </div>

                        <?php if ($error): ?>
                            <div class="alert alert-danger" role="alert">
                                <?php echo $error; ?>
                            </div>
                        <?php endif; ?>

                        <form method="POST">
                            <div class="mb-3">
                                <label for="email" class="form-label text-white">Email</label>
                                <input type="email" class="form-control bg-dark border-secondary text-white" 
                                       id="email" name="email" placeholder="votre@email.com" required>
                            </div>
                            
                            <div class="mb-3">
                                <label for="password" class="form-label text-white">Mot de passe</label>
                                <div class="input-group">
                                    <input type="password" class="form-control bg-dark border-secondary text-white" 
                                           id="password" name="password" placeholder="••••••••" required>
                                    <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="d-flex justify-content-between align-items-center mb-4">
                                <a href="forgot-password.php" class="text-orange text-decoration-none">
                                    Mot de passe oublié ?
                                </a>
                            </div>
                            
                            <button type="submit" class="btn btn-gradient-orange w-100 py-2 fw-bold">
                                Se connecter
                            </button>
                        </form>
                        
                        <div class="text-center mt-4">
                            <p class="text-muted">
                                Pas encore de compte ? 
                                <a href="register.php" class="text-orange text-decoration-none fw-bold">
                                    S'inscrire
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        document.getElementById('togglePassword').addEventListener('click', function() {
            const password = document.getElementById('password');
            const icon = this.querySelector('i');
            
            if (password.type === 'password') {
                password.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                password.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    </script>
</body>
</html>