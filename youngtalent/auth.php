<?php
session_start();
include 'database.php';

// Classe pour gérer l'authentification
class Auth {
    private $db;
    
    public function __construct($database) {
        $this->db = $database;
    }
    
    // Inscription d'un nouvel utilisateur
    public function register($data) {
        try {
            // Validation des données
            $errors = $this->validateRegistrationData($data);
            if (!empty($errors)) {
                return ['success' => false, 'errors' => $errors];
            }
            
            // Vérifier si l'email ou le nom d'utilisateur existe déjà
            $check_query = "SELECT id FROM users WHERE email = :email OR username = :username";
            $check_stmt = $this->db->prepare($check_query);
            $check_stmt->bindParam(':email', $data['email']);
            $check_stmt->bindParam(':username', $data['username']);
            $check_stmt->execute();
            
            if ($check_stmt->rowCount() > 0) {
                return ['success' => false, 'message' => 'Email ou nom d\'utilisateur déjà utilisé'];
            }
            
            // Hacher le mot de passe
            $hashed_password = password_hash($data['password'], PASSWORD_DEFAULT);
            
            // Insérer le nouvel utilisateur
            $insert_query = "INSERT INTO users (username, email, password, artist_name, genre, bio, location) 
                           VALUES (:username, :email, :password, :artist_name, :genre, :bio, :location)";
            $insert_stmt = $this->db->prepare($insert_query);
            $insert_stmt->bindParam(':username', $data['username']);
            $insert_stmt->bindParam(':email', $data['email']);
            $insert_stmt->bindParam(':password', $hashed_password);
            $insert_stmt->bindParam(':artist_name', $data['artist_name']);
            $insert_stmt->bindParam(':genre', $data['genre']);
            $insert_stmt->bindParam(':bio', $data['bio'] ?? '');
            $insert_stmt->bindParam(':location', $data['location'] ?? '');
            
            if ($insert_stmt->execute()) {
                $user_id = $this->db->lastInsertId();
                
                // Créer le dossier de l'utilisateur
                $this->createUserDirectories($user_id);
                
                // Envoyer email de bienvenue (optionnel)
                $this->sendWelcomeEmail($data['email'], $data['artist_name']);
                
                return [
                    'success' => true, 
                    'message' => 'Compte créé avec succès !',
                    'user_id' => $user_id
                ];
            } else {
                return ['success' => false, 'message' => 'Erreur lors de la création du compte'];
            }
            
        } catch (Exception $e) {
            error_log("Registration error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur système. Veuillez réessayer.'];
        }
    }
    
    // Connexion d'un utilisateur
    public function login($email, $password, $remember_me = false) {
        try {
            $query = "SELECT id, username, email, password, artist_name, verified, profile_image FROM users WHERE email = :email";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (password_verify($password, $user['password'])) {
                    // Créer la session
                    $this->createSession($user);
                    
                    // Mettre à jour la dernière connexion
                    $this->updateLastLogin($user['id']);
                    
                    // Gérer "Se souvenir de moi"
                    if ($remember_me) {
                        $this->setRememberMeCookie($user['id']);
                    }
                    
                    // Log de connexion
                    $this->logActivity($user['id'], 'login', 'Connexion réussie');
                    
                    return [
                        'success' => true, 
                        'message' => 'Connexion réussie',
                        'user' => [
                            'id' => $user['id'],
                            'username' => $user['username'],
                            'artist_name' => $user['artist_name'],
                            'verified' => $user['verified'],
                            'profile_image' => $user['profile_image']
                        ]
                    ];
                } else {
                    // Log de tentative de connexion échouée
                    $this->logFailedLogin($email, 'Mot de passe incorrect');
                    return ['success' => false, 'message' => 'Mot de passe incorrect'];
                }
            } else {
                $this->logFailedLogin($email, 'Email non trouvé');
                return ['success' => false, 'message' => 'Email non trouvé'];
            }
            
        } catch (Exception $e) {
            error_log("Login error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur système. Veuillez réessayer.'];
        }
    }
    
    // Déconnexion
    public function logout() {
        if (isset($_SESSION['user_id'])) {
            $this->logActivity($_SESSION['user_id'], 'logout', 'Déconnexion');
        }
        
        // Détruire la session
        session_destroy();
        
        // Supprimer le cookie "Se souvenir de moi"
        if (isset($_COOKIE['remember_token'])) {
            setcookie('remember_token', '', time() - 3600, '/');
            setcookie('remember_user', '', time() - 3600, '/');
        }
        
        return ['success' => true, 'message' => 'Déconnexion réussie'];
    }
    
    // Réinitialisation du mot de passe
    public function requestPasswordReset($email) {
        try {
            $query = "SELECT id, artist_name FROM users WHERE email = :email";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Générer un token de réinitialisation
                $reset_token = bin2hex(random_bytes(32));
                $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));
                
                // Sauvegarder le token
                $update_query = "UPDATE users SET reset_token = :token, reset_expires = :expires WHERE id = :user_id";
                $update_stmt = $this->db->prepare($update_query);
                $update_stmt->bindParam(':token', $reset_token);
                $update_stmt->bindParam(':expires', $expires_at);
                $update_stmt->bindParam(':user_id', $user['id']);
                $update_stmt->execute();
                
                // Envoyer l'email de réinitialisation
                $this->sendPasswordResetEmail($email, $user['artist_name'], $reset_token);
                
                return ['success' => true, 'message' => 'Email de réinitialisation envoyé'];
            } else {
                return ['success' => false, 'message' => 'Email non trouvé'];
            }
            
        } catch (Exception $e) {
            error_log("Password reset error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur système. Veuillez réessayer.'];
        }
    }
    
    // Réinitialiser le mot de passe avec token
    public function resetPassword($token, $new_password) {
        try {
            $query = "SELECT id FROM users WHERE reset_token = :token AND reset_expires > NOW()";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':token', $token);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                // Valider le nouveau mot de passe
                if (strlen($new_password) < 8) {
                    return ['success' => false, 'message' => 'Le mot de passe doit contenir au moins 8 caractères'];
                }
                
                // Hacher le nouveau mot de passe
                $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
                
                // Mettre à jour le mot de passe et supprimer le token
                $update_query = "UPDATE users SET password = :password, reset_token = NULL, reset_expires = NULL WHERE id = :user_id";
                $update_stmt = $this->db->prepare($update_query);
                $update_stmt->bindParam(':password', $hashed_password);
                $update_stmt->bindParam(':user_id', $user['id']);
                $update_stmt->execute();
                
                $this->logActivity($user['id'], 'password_reset', 'Mot de passe réinitialisé');
                
                return ['success' => true, 'message' => 'Mot de passe réinitialisé avec succès'];
            } else {
                return ['success' => false, 'message' => 'Token invalide ou expiré'];
            }
            
        } catch (Exception $e) {
            error_log("Password reset error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Erreur système. Veuillez réessayer.'];
        }
    }
    
    // Vérifier si l'utilisateur est connecté
    public function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }
    
    // Obtenir l'utilisateur actuel
    public function getCurrentUser() {
        if (!$this->isLoggedIn()) {
            return null;
        }
        
        $query = "SELECT id, username, email, artist_name, genre, bio, location, profile_image, cover_image, verified, followers_count, total_plays FROM users WHERE id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $_SESSION['user_id']);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    // Vérifier les autorisations
    public function hasPermission($permission) {
        // Système de permissions basique
        $user = $this->getCurrentUser();
        if (!$user) return false;
        
        switch ($permission) {
            case 'upload_track':
            case 'upload_podcast':
            case 'edit_profile':
                return true;
            case 'admin':
                return $user['verified']; // Seuls les utilisateurs vérifiés ont les droits admin
            default:
                return false;
        }
    }
    
    // Validation des données d'inscription
    private function validateRegistrationData($data) {
        $errors = [];
        
        // Nom d'utilisateur
        if (empty($data['username'])) {
            $errors[] = 'Le nom d\'utilisateur est requis';
        } elseif (strlen($data['username']) < 3) {
            $errors[] = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
        } elseif (!preg_match('/^[a-zA-Z0-9_]+$/', $data['username'])) {
            $errors[] = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores';
        }
        
        // Email
        if (empty($data['email'])) {
            $errors[] = 'L\'email est requis';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Format d\'email invalide';
        }
        
        // Mot de passe
        if (empty($data['password'])) {
            $errors[] = 'Le mot de passe est requis';
        } elseif (strlen($data['password']) < 8) {
            $errors[] = 'Le mot de passe doit contenir au moins 8 caractères';
        } elseif (!preg_match('/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/', $data['password'])) {
            $errors[] = 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre';
        }
        
        // Confirmation du mot de passe
        if ($data['password'] !== $data['confirm_password']) {
            $errors[] = 'Les mots de passe ne correspondent pas';
        }
        
        // Nom d'artiste
        if (empty($data['artist_name'])) {
            $errors[] = 'Le nom d\'artiste est requis';
        }
        
        // Genre
        if (empty($data['genre'])) {
            $errors[] = 'Le genre musical est requis';
        }
        
        return $errors;
    }
    
    // Créer la session utilisateur
    private function createSession($user) {
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['artist_name'] = $user['artist_name'];
        $_SESSION['verified'] = $user['verified'];
        $_SESSION['profile_image'] = $user['profile_image'];
        $_SESSION['login_time'] = time();
        
        // Régénérer l'ID de session pour la sécurité
        session_regenerate_id(true);
    }
    
    // Mettre à jour la dernière connexion
    private function updateLastLogin($user_id) {
        $query = "UPDATE users SET last_login = NOW() WHERE id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
    }
    
    // Gérer le cookie "Se souvenir de moi"
    private function setRememberMeCookie($user_id) {
        $token = bin2hex(random_bytes(32));
        $expires = time() + (30 * 24 * 60 * 60); // 30 jours
        
        // Sauvegarder le token en base
        $query = "UPDATE users SET remember_token = :token WHERE id = :user_id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':token', password_hash($token, PASSWORD_DEFAULT));
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        
        // Créer les cookies
        setcookie('remember_token', $token, $expires, '/', '', true, true);
        setcookie('remember_user', $user_id, $expires, '/', '', true, true);
    }
    
    // Vérifier le cookie "Se souvenir de moi"
    public function checkRememberMe() {
        if (isset($_COOKIE['remember_token']) && isset($_COOKIE['remember_user'])) {
            $user_id = $_COOKIE['remember_user'];
            $token = $_COOKIE['remember_token'];
            
            $query = "SELECT id, username, email, artist_name, verified, profile_image, remember_token FROM users WHERE id = :user_id";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();
            
            if ($stmt->rowCount() > 0) {
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (password_verify($token, $user['remember_token'])) {
                    $this->createSession($user);
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Créer les dossiers utilisateur
    private function createUserDirectories($user_id) {
        $base_path = 'uploads/users/' . $user_id;
        $directories = ['tracks', 'podcasts', 'images', 'covers'];
        
        foreach ($directories as $dir) {
            $path = $base_path . '/' . $dir;
            if (!file_exists($path)) {
                mkdir($path, 0755, true);
            }
        }
    }
    
    // Envoyer email de bienvenue
    private function sendWelcomeEmail($email, $artist_name) {
        $subject = "Bienvenue sur Young Talent !";
        $message = "
        <html>
        <head>
            <title>Bienvenue sur Young Talent</title>
        </head>
        <body>
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(45deg, #f97316, #ec4899); padding: 20px; text-align: center;'>
                    <h1 style='color: white; margin: 0;'>🎵 Young Talent</h1>
                </div>
                <div style='padding: 20px; background: #f8f9fa;'>
                    <h2>Bienvenue {$artist_name} !</h2>
                    <p>Votre compte Young Talent a été créé avec succès. Vous pouvez maintenant :</p>
                    <ul>
                        <li>📤 Uploader vos tracks et podcasts</li>
                        <li>👥 Construire votre communauté de fans</li>
                        <li>📊 Suivre vos statistiques</li>
                        <li>🎯 Promouvoir votre musique</li>
                    </ul>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='" . $_SERVER['HTTP_HOST'] . "/dashboard.php' style='background: linear-gradient(45deg, #f97316, #ec4899); color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; display: inline-block;'>
                            Accéder à mon Dashboard
                        </a>
                    </div>
                    <p>Bonne chance dans votre parcours musical !</p>
                    <p><strong>L'équipe Young Talent</strong></p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= 'From: Young Talent <noreply@youngtalent.com>' . "\r\n";
        
        mail($email, $subject, $message, $headers);
    }
    
    // Envoyer email de réinitialisation
    private function sendPasswordResetEmail($email, $artist_name, $token) {
        $reset_link = "http://" . $_SERVER['HTTP_HOST'] . "/reset-password.php?token=" . $token;
        
        $subject = "Réinitialisation de votre mot de passe - Young Talent";
        $message = "
        <html>
        <head>
            <title>Réinitialisation de mot de passe</title>
        </head>
        <body>
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                <div style='background: linear-gradient(45deg, #f97316, #ec4899); padding: 20px; text-align: center;'>
                    <h1 style='color: white; margin: 0;'>🎵 Young Talent</h1>
                </div>
                <div style='padding: 20px; background: #f8f9fa;'>
                    <h2>Réinitialisation de mot de passe</h2>
                    <p>Bonjour {$artist_name},</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :</p>
                    <div style='text-align: center; margin: 30px 0;'>
                        <a href='{$reset_link}' style='background: linear-gradient(45deg, #f97316, #ec4899); color: white; padding: 12px 24px; text-decoration: none; border-radius: 25px; display: inline-block;'>
                            Réinitialiser mon mot de passe
                        </a>
                    </div>
                    <p><strong>Ce lien expire dans 1 heure.</strong></p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                    <p><strong>L'équipe Young Talent</strong></p>
                </div>
            </div>
        </body>
        </html>
        ";
        
        $headers = "MIME-Version: 1.0" . "\r\n";
        $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
        $headers .= 'From: Young Talent <noreply@youngtalent.com>' . "\r\n";
        
        mail($email, $subject, $message, $headers);
    }
    
    // Logger les activités
    private function logActivity($user_id, $action, $description) {
        try {
            $query = "INSERT INTO activity_logs (user_id, action, description, ip_address, user_agent, created_at) 
                     VALUES (:user_id, :action, :description, :ip, :user_agent, NOW())";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':action', $action);
            $stmt->bindParam(':description', $description);
            $stmt->bindParam(':ip', $_SERVER['REMOTE_ADDR']);
            $stmt->bindParam(':user_agent', $_SERVER['HTTP_USER_AGENT']);
            $stmt->execute();
        } catch (Exception $e) {
            error_log("Activity log error: " . $e->getMessage());
        }
    }
    
    // Logger les tentatives de connexion échouées
    private function logFailedLogin($email, $reason) {
        try {
            $query = "INSERT INTO failed_logins (email, reason, ip_address, user_agent, created_at) 
                     VALUES (:email, :reason, :ip, :user_agent, NOW())";
            $stmt = $this->db->prepare($query);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':reason', $reason);
            $stmt->bindParam(':ip', $_SERVER['REMOTE_ADDR']);
            $stmt->bindParam(':user_agent', $_SERVER['HTTP_USER_AGENT']);
            $stmt->execute();
        } catch (Exception $e) {
            error_log("Failed login log error: " . $e->getMessage());
        }
    }
    
    // Vérifier les tentatives de brute force
    public function checkBruteForce($email) {
        $query = "SELECT COUNT(*) as attempts FROM failed_logins 
                 WHERE email = :email AND created_at > DATE_SUB(NOW(), INTERVAL 15 MINUTE)";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['attempts'] >= 5; // Bloquer après 5 tentatives en 15 minutes
    }
    
    // Nettoyer les sessions expirées
    public function cleanupSessions() {
        // Supprimer les tokens de réinitialisation expirés
        $query = "UPDATE users SET reset_token = NULL, reset_expires = NULL WHERE reset_expires < NOW()";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        // Supprimer les logs de connexions échouées anciens
        $query = "DELETE FROM failed_logins WHERE created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
    }
}

// Initialiser la classe Auth
$auth = new Auth($db);

// Vérifier le cookie "Se souvenir de moi" si pas connecté
if (!$auth->isLoggedIn()) {
    $auth->checkRememberMe();
}

// Traitement des requêtes AJAX
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['ajax'])) {
    header('Content-Type: application/json');
    
    switch ($_POST['action']) {
        case 'login':
            $result = $auth->login(
                $_POST['email'], 
                $_POST['password'], 
                isset($_POST['remember_me'])
            );
            
            if ($result['success']) {
                $result['redirect'] = $_POST['redirect'] ?? 'dashboard.php';
            }
            
            echo json_encode($result);
            break;
            
        case 'register':
            $result = $auth->register($_POST);
            
            if ($result['success']) {
                $result['redirect'] = 'login.php?registered=1';
            }
            
            echo json_encode($result);
            break;
            
        case 'logout':
            $result = $auth->logout();
            $result['redirect'] = 'index.php';
            echo json_encode($result);
            break;
            
        case 'forgot_password':
            $result = $auth->requestPasswordReset($_POST['email']);
            echo json_encode($result);
            break;
            
        case 'reset_password':
            $result = $auth->resetPassword($_POST['token'], $_POST['password']);
            
            if ($result['success']) {
                $result['redirect'] = 'login.php?reset=1';
            }
            
            echo json_encode($result);
            break;
            
        case 'check_username':
            $query = "SELECT id FROM users WHERE username = :username";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':username', $_POST['username']);
            $stmt->execute();
            
            echo json_encode(['available' => $stmt->rowCount() === 0]);
            break;
            
        case 'check_email':
            $query = "SELECT id FROM users WHERE email = :email";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':email', $_POST['email']);
            $stmt->execute();
            
            echo json_encode(['available' => $stmt->rowCount() === 0]);
            break;
            
        default:
            echo json_encode(['success' => false, 'message' => 'Action non reconnue']);
    }
    
    exit();
}

// Fonction helper pour vérifier l'authentification
function requireAuth() {
    global $auth;
    if (!$auth->isLoggedIn()) {
        header('Location: login.php?redirect=' . urlencode($_SERVER['REQUEST_URI']));
        exit();
    }
}

// Fonction helper pour vérifier les permissions
function requirePermission($permission) {
    global $auth;
    requireAuth();
    if (!$auth->hasPermission($permission)) {
        header('Location: dashboard.php?error=permission_denied');
        exit();
    }
}

// Fonction helper pour obtenir l'utilisateur actuel
function getCurrentUser() {
    global $auth;
    return $auth->getCurrentUser();
}

// Fonction helper pour vérifier si connecté
function isLoggedIn() {
    global $auth;
    return $auth->isLoggedIn();
}

// Nettoyage automatique (à exécuter périodiquement)
if (rand(1, 100) === 1) { // 1% de chance à chaque requête
    $auth->cleanupSessions();
}
?>