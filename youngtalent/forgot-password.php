<?php
session_start();
include 'database.php';
include 'auth.php';

$message = '';
$error = '';

if ($_POST) {
    $email = trim($_POST['email']);
    
    if (empty($email)) {
        $error = 'Veuillez saisir votre adresse email';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Format d\'email invalide';
    } else {
        $result = $auth->requestPasswordReset($email);
        if ($result['success']) {
            $message = $result['message'];
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
    <title>Mot de passe oublié - Young Talent</title>
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
                                <i class="fas fa-key fa-3x text-orange"></i>
                            </div>
                            <h2 class="text-white fw-bold">Mot de passe oublié</h2>
                            <p class="text-muted">Saisissez votre email pour recevoir un lien de réinitialisation</p>
                        </div>

                        <?php if ($error): ?>
                            <div class="alert alert-danger" role="alert">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                <?php echo $error; ?>
                            </div>
                        <?php endif; ?>

                        <?php if ($message): ?>
                            <div class="alert alert-success" role="alert">
                                <i class="fas fa-check-circle me-2"></i>
                                <?php echo $message; ?>
                                <br><small>Vérifiez votre boîte email (et vos spams)</small>
                            </div>
                        <?php else: ?>
                            <form method="POST" id="forgotPasswordForm">
                                <div class="mb-4">
                                    <label for="email" class="form-label text-white">Adresse email</label>
                                    <div class="input-group">
                                        <span class="input-group-text bg-dark border-secondary">
                                            <i class="fas fa-envelope text-muted"></i>
                                        </span>
                                        <input type="email" class="form-control bg-dark border-secondary text-white" 
                                               id="email" name="email" placeholder="votre@email.com" 
                                               value="<?php echo isset($_POST['email']) ? htmlspecialchars($_POST['email']) : ''; ?>" required>
                                    </div>
                                </div>
                                
                                <button type="submit" class="btn btn-gradient-orange w-100 py-2 fw-bold mb-3">
                                    <i class="fas fa-paper-plane me-2"></i>
                                    Envoyer le lien de réinitialisation
                                </button>
                            </form>
                        <?php endif; ?>
                        
                        <div class="text-center">
                            <p class="text-muted mb-2">Vous vous souvenez de votre mot de passe ?</p>
                            <a href="login.php" class="text-orange text-decoration-none fw-bold">
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
        // Animation du formulaire
        document.getElementById('forgotPasswordForm')?.addEventListener('submit', function(e) {
            const button = this.querySelector('button[type="submit"]');
            const originalText = button.innerHTML;
            
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Envoi en cours...';
            button.disabled = true;
            
            // Réactiver le bouton après 3 secondes si pas de redirection
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
            }, 3000);
        });
    </script>
</body>
</html>