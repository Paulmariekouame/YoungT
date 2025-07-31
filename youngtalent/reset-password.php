<?php
session_start();
include 'database.php';
include 'auth.php';

$token = $_GET['token'] ?? '';
$error = '';
$success = '';

// Vérifier si le token est valide
if (empty($token)) {
    header('Location: login.php');
    exit();
}

// Vérifier le token en base
$query = "SELECT id, artist_name FROM users WHERE reset_token = :token AND reset_expires > NOW()";
$stmt = $db->prepare($query);
$stmt->bindParam(':token', $token);
$stmt->execute();

if ($stmt->rowCount() === 0) {
    $error = 'Token invalide ou expiré. Veuillez faire une nouvelle demande de réinitialisation.';
}

if ($_POST && empty($error)) {
    $password = $_POST['password'];
    $confirm_password = $_POST['confirm_password'];
    
    if (empty($password)) {
        $error = 'Le mot de passe est requis';
    } elseif (strlen($password) < 8) {
        $error = 'Le mot de passe doit contenir au moins 8 caractères';
    } elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $password)) {
        $error = 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre';
    } elseif ($password !== $confirm_password) {
        $error = 'Les mots de passe ne correspondent pas';
    } else {
        $result = $auth->resetPassword($token, $password);
        if ($result['success']) {
            $success = $result['message'];
        } else {
            $error = $result['message'];
        }
    }
}
?>

<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialiser le mot de passe - Young Talent</title>
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
                                <i class="fas fa-lock fa-3x text-orange"></i>
                            </div>
                            <h2 class="text-white fw-bold">Nouveau mot de passe</h2>
                            <p class="text-muted">Choisissez un mot de passe sécurisé</p>
                        </div>

                        <?php if ($error): ?>
                            <div class="alert alert-danger" role="alert">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <?php echo $error; ?>
                                <?php if (strpos($error, 'Token invalide') !== false): ?>
                                    <br><br>
                                    <a href="forgot-password.php" class="text-decoration-none">
                                        Faire une nouvelle demande
                                    </a>
                                <?php endif; ?>
                            </div>
                        <?php endif; ?>

                        <?php if ($success): ?>
                            <div class="alert alert-success" role="alert">
                                <i class="fas fa-check-circle me-2"></i>
                                <?php echo $success; ?>
                                <br><br>
                                <a href="login.php" class="btn btn-gradient-orange w-100">
                                    Se connecter maintenant
                                </a>
                            </div>
                        <?php elseif (empty($error) || strpos($error, 'Token invalide') === false): ?>
                            <form method="POST" id="resetPasswordForm">
                                <div class="mb-3">
                                    <label for="password" class="form-label text-white">Nouveau mot de passe</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-dark border-secondary">
                                            <i class="fas fa-lock text-muted"></i>
                                        </span>
                                        <input type="password" class="form-control bg-dark border-secondary text-white" 
                                               id="password" name="password" placeholder="••••••••" required>
                                        <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                    <div class="form-text text-muted">
                                        <small>
                                            <i class="fas fa-info-circle me-1"></i>
                                            Au moins 8 caractères avec majuscule, minuscule et chiffre
                                        </small>
                                    </div>
                                </div>
                                
                                <div class="mb-4">
                                    <label for="confirm_password" class="form-label text-white">Confirmer le mot de passe</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-dark border-secondary">
                                            <i class="fas fa-lock text-muted"></i>
                                        </span>
                                        <input type="password" class="form-control bg-dark border-secondary text-white" 
                                               id="confirm_password" name="confirm_password" placeholder="••••••••" required>
                                        <button class="btn btn-outline-secondary" type="button" id="toggleConfirmPassword">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <!-- Indicateur de force du mot de passe -->
                                <div class="mb-3">
                                    <div class="password-strength">
                                        <div class="progress" style="height: 4px;">
                                            <div id="password-strength-bar" class="progress-bar" style="width: 0%"></div>
                                        </div>
                                        <small id="password-strength-text" class="text-muted"></small>
                                    </div>
                                </div>
                                
                                <button type="submit" class="btn btn-gradient-orange w-100 py-2 fw-bold">
                                    <i class="fas fa-save me-2"></i>
                                    Réinitialiser le mot de passe
                                </button>
                            </form>
                        <?php endif; ?>
                        
                        <div class="text-center mt-4">
                            <a href="login.php" class="text-orange text-decoration-none">
                                <i class="fas fa-arrow-left me-1"></i>
                                Retour à la connexion
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Toggle password visibility
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

        document.getElementById('toggleConfirmPassword').addEventListener('click', function() {
            const password = document.getElementById('confirm_password');
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

        // Password strength indicator
        document.getElementById('password').addEventListener('input', function() {
            const password = this.value;
            const strengthBar = document.getElementById('password-strength-bar');
            const strengthText = document.getElementById('password-strength-text');
            
            let strength = 0;
            let text = '';
            let color = '';
            
            if (password.length >= 8) strength += 25;
            if (/[a-z]/.test(password)) strength += 25;
            if (/[A-Z]/.test(password)) strength += 25;
            if (/\d/.test(password)) strength += 25;
            
            if (strength === 0) {
                text = '';
                color = '';
            } else if (strength <= 25) {
                text = 'Très faible';
                color = 'bg-danger';
            } else if (strength <= 50) {
                text = 'Faible';
                color = 'bg-warning';
            } else if (strength <= 75) {
                text = 'Moyen';
                color = 'bg-info';
            } else {
                text = 'Fort';
                color = 'bg-success';
            }
            
            strengthBar.style.width = strength + '%';
            strengthBar.className = 'progress-bar ' + color;
            strengthText.textContent = text;
        });

        // Form validation
        document.getElementById('resetPasswordForm')?.addEventListener('submit', function(e) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm_password').value;
            
            if (password !== confirmPassword) {
                e.preventDefault();
                alert('Les mots de passe ne correspondent pas');
                return;
            }
            
            const button = this.querySelector('button[type="submit"]');
            const originalText = button.innerHTML;
            
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Réinitialisation...';
            button.disabled = true;
        });
    </script>
</body>
</html>