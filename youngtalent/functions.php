<?php
/**
 * Functions.php - Young Talent Platform
 * Fonctions utilitaires et helpers pour la plateforme
 */

// Empêcher l'accès direct
if (!defined('ABSPATH')) {
    define('ABSPATH', dirname(__FILE__) . '/');
}

/**
 * ==============================================
 * FONCTIONS DE SÉCURITÉ
 * ==============================================
 */

/**
 * Générer un token CSRF
 */
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Vérifier un token CSRF
 */
function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Nettoyer et sécuriser les données d'entrée
 */
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    
    $data = trim($data);
    $data = stripslashes($data);
    $data = htmlspecialchars($data, ENT_QUOTES, 'UTF-8');
    return $data;
}

/**
 * Valider une adresse email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Générer un mot de passe sécurisé
 */
function generateSecurePassword($length = 12) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    return substr(str_shuffle($chars), 0, $length);
}

/**
 * Vérifier la force d'un mot de passe
 */
function checkPasswordStrength($password) {
    $score = 0;
    $feedback = [];
    
    // Longueur
    if (strlen($password) >= 8) {
        $score += 25;
    } else {
        $feedback[] = 'Au moins 8 caractères';
    }
    
    // Minuscules
    if (preg_match('/[a-z]/', $password)) {
        $score += 25;
    } else {
        $feedback[] = 'Au moins une minuscule';
    }
    
    // Majuscules
    if (preg_match('/[A-Z]/', $password)) {
        $score += 25;
    } else {
        $feedback[] = 'Au moins une majuscule';
    }
    
    // Chiffres
    if (preg_match('/\d/', $password)) {
        $score += 25;
    } else {
        $feedback[] = 'Au moins un chiffre';
    }
    
    // Caractères spéciaux (bonus)
    if (preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
        $score += 10;
    }
    
    return [
        'score' => min($score, 100),
        'strength' => $score < 50 ? 'faible' : ($score < 75 ? 'moyen' : 'fort'),
        'feedback' => $feedback
    ];
}

/**
 * ==============================================
 * FONCTIONS DE FORMATAGE
 * ==============================================
 */

/**
 * Formater un nombre (K, M, B)
 */
function formatNumber($number) {
    if ($number >= 1000000000) {
        return round($number / 1000000000, 1) . 'B';
    } elseif ($number >= 1000000) {
        return round($number / 1000000, 1) . 'M';
    } elseif ($number >= 1000) {
        return round($number / 1000, 1) . 'K';
    }
    return number_format($number);
}

/**
 * Formater une durée en secondes vers MM:SS
 */
function formatDuration($seconds) {
    $minutes = floor($seconds / 60);
    $seconds = $seconds % 60;
    return sprintf('%02d:%02d', $minutes, $seconds);
}

/**
 * Formater une durée longue (heures)
 */
function formatLongDuration($seconds) {
    $hours = floor($seconds / 3600);
    $minutes = floor(($seconds % 3600) / 60);
    $seconds = $seconds % 60;
    
    if ($hours > 0) {
        return sprintf('%02d:%02d:%02d', $hours, $minutes, $seconds);
    }
    return sprintf('%02d:%02d', $minutes, $seconds);
}

/**
 * Formater la taille d'un fichier
 */
function formatFileSize($bytes) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    
    $bytes /= pow(1024, $pow);
    
    return round($bytes, 2) . ' ' . $units[$pow];
}

/**
 * Formater le temps écoulé (time ago)
 */
function timeAgo($datetime) {
    $time = time() - strtotime($datetime);
    
    if ($time < 60) return 'À l\'instant';
    if ($time < 3600) return floor($time/60) . 'm';
    if ($time < 86400) return floor($time/3600) . 'h';
    if ($time < 2592000) return floor($time/86400) . 'j';
    if ($time < 31536000) return floor($time/2592000) . ' mois';
    return floor($time/31536000) . ' an';
}

/**
 * Formater une date en français
 */
function formatDateFR($date, $format = 'long') {
    $timestamp = is_string($date) ? strtotime($date) : $date;
    
    $months = [
        1 => 'janvier', 2 => 'février', 3 => 'mars', 4 => 'avril',
        5 => 'mai', 6 => 'juin', 7 => 'juillet', 8 => 'août',
        9 => 'septembre', 10 => 'octobre', 11 => 'novembre', 12 => 'décembre'
    ];
    
    $days = [
        0 => 'dimanche', 1 => 'lundi', 2 => 'mardi', 3 => 'mercredi',
        4 => 'jeudi', 5 => 'vendredi', 6 => 'samedi'
    ];
    
    switch ($format) {
        case 'short':
            return date('d/m/Y', $timestamp);
        case 'medium':
            return date('d', $timestamp) . ' ' . $months[date('n', $timestamp)] . ' ' . date('Y', $timestamp);
        case 'long':
        default:
            return $days[date('w', $timestamp)] . ' ' . date('d', $timestamp) . ' ' . 
                   $months[date('n', $timestamp)] . ' ' . date('Y', $timestamp);
    }
}

/**
 * ==============================================
 * FONCTIONS DE GESTION DES FICHIERS
 * ==============================================
 */

/**
 * Uploader un fichier de manière sécurisée
 */
function uploadFile($file, $uploadDir, $allowedTypes = [], $maxSize = 10485760) {
    // Vérifications de base
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        return ['success' => false, 'message' => 'Aucun fichier uploadé'];
    }
    
    // Vérifier la taille
    if ($file['size'] > $maxSize) {
        return ['success' => false, 'message' => 'Fichier trop volumineux (' . formatFileSize($maxSize) . ' max)'];
    }
    
    // Vérifier le type MIME
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!empty($allowedTypes) && !in_array($mimeType, $allowedTypes)) {
        return ['success' => false, 'message' => 'Type de fichier non autorisé'];
    }
    
    // Générer un nom de fichier unique
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . '/' . $filename;
    
    // Créer le dossier si nécessaire
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Déplacer le fichier
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return [
            'success' => true,
            'filename' => $filename,
            'filepath' => $filepath,
            'size' => $file['size'],
            'mime_type' => $mimeType
        ];
    }
    
    return ['success' => false, 'message' => 'Erreur lors de l\'upload'];
}

/**
 * Redimensionner une image
 */
function resizeImage($source, $destination, $maxWidth, $maxHeight, $quality = 85) {
    // Obtenir les informations de l'image
    $imageInfo = getimagesize($source);
    if (!$imageInfo) {
        return false;
    }
    
    list($originalWidth, $originalHeight, $imageType) = $imageInfo;
    
    // Calculer les nouvelles dimensions
    $ratio = min($maxWidth / $originalWidth, $maxHeight / $originalHeight);
    $newWidth = round($originalWidth * $ratio);
    $newHeight = round($originalHeight * $ratio);
    
    // Créer l'image source
    switch ($imageType) {
        case IMAGETYPE_JPEG:
            $sourceImage = imagecreatefromjpeg($source);
            break;
        case IMAGETYPE_PNG:
            $sourceImage = imagecreatefrompng($source);
            break;
        case IMAGETYPE_GIF:
            $sourceImage = imagecreatefromgif($source);
            break;
        default:
            return false;
    }
    
    // Créer l'image de destination
    $destImage = imagecreatetruecolor($newWidth, $newHeight);
    
    // Préserver la transparence pour PNG et GIF
    if ($imageType == IMAGETYPE_PNG || $imageType == IMAGETYPE_GIF) {
        imagealphablending($destImage, false);
        imagesavealpha($destImage, true);
        $transparent = imagecolorallocatealpha($destImage, 255, 255, 255, 127);
        imagefilledrectangle($destImage, 0, 0, $newWidth, $newHeight, $transparent);
    }
    
    // Redimensionner
    imagecopyresampled($destImage, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $originalWidth, $originalHeight);
    
    // Sauvegarder
    $result = false;
    switch ($imageType) {
        case IMAGETYPE_JPEG:
            $result = imagejpeg($destImage, $destination, $quality);
            break;
        case IMAGETYPE_PNG:
            $result = imagepng($destImage, $destination);
            break;
        case IMAGETYPE_GIF:
            $result = imagegif($destImage, $destination);
            break;
    }
    
    // Nettoyer la mémoire
    imagedestroy($sourceImage);
    imagedestroy($destImage);
    
    return $result;
}

/**
 * Générer des miniatures d'images
 */
function generateThumbnails($imagePath, $sizes = []) {
    $defaultSizes = [
        'thumb' => [150, 150],
        'medium' => [300, 300],
        'large' => [800, 600]
    ];
    
    $sizes = array_merge($defaultSizes, $sizes);
    $results = [];
    
    $pathInfo = pathinfo($imagePath);
    $directory = $pathInfo['dirname'];
    $filename = $pathInfo['filename'];
    $extension = $pathInfo['extension'];
    
    foreach ($sizes as $sizeName => $dimensions) {
        $thumbnailPath = $directory . '/' . $filename . '_' . $sizeName . '.' . $extension;
        
        if (resizeImage($imagePath, $thumbnailPath, $dimensions[0], $dimensions[1])) {
            $results[$sizeName] = $thumbnailPath;
        }
    }
    
    return $results;
}

/**
 * ==============================================
 * FONCTIONS DE GESTION DES NOTIFICATIONS
 * ==============================================
 */

/**
 * Créer une notification
 */
function createNotification($db, $userId, $title, $message, $type = 'info', $link = null, $icon = 'info-circle') {
    try {
        $query = "INSERT INTO notifications (user_id, title, message, type, link, icon, created_at) 
                  VALUES (:user_id, :title, :message, :type, :link, :icon, NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':title', $title);
        $stmt->bindParam(':message', $message);
        $stmt->bindParam(':type', $type);
        $stmt->bindParam(':link', $link);
        $stmt->bindParam(':icon', $icon);
        
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Erreur création notification: " . $e->getMessage());
        return false;
    }
}

/**
 * Marquer une notification comme lue
 */
function markNotificationAsRead($db, $notificationId, $userId) {
    try {
        $query = "UPDATE notifications SET is_read = 1, read_at = NOW() 
                  WHERE id = :id AND user_id = :user_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':id', $notificationId);
        $stmt->bindParam(':user_id', $userId);
        
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Erreur marquage notification: " . $e->getMessage());
        return false;
    }
}

/**
 * Obtenir les notifications non lues d'un utilisateur
 */
function getUnreadNotifications($db, $userId, $limit = 10) {
    try {
        $query = "SELECT * FROM notifications 
                  WHERE user_id = :user_id AND is_read = 0 
                  ORDER BY created_at DESC 
                  LIMIT :limit";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Erreur récupération notifications: " . $e->getMessage());
        return [];
    }
}

/**
 * ==============================================
 * FONCTIONS DE GESTION DES EMAILS
 * ==============================================
 */

/**
 * Envoyer un email avec template
 */
function sendEmail($to, $subject, $template, $variables = []) {
    // Configuration SMTP (à adapter selon votre fournisseur)
    $config = [
        'host' => $_ENV['SMTP_HOST'] ?? 'localhost',
        'port' => $_ENV['SMTP_PORT'] ?? 587,
        'username' => $_ENV['SMTP_USERNAME'] ?? '',
        'password' => $_ENV['SMTP_PASSWORD'] ?? '',
        'encryption' => $_ENV['SMTP_ENCRYPTION'] ?? 'tls'
    ];
    
    try {
        // Charger le template
        $templatePath = 'templates/emails/' . $template . '.php';
        if (!file_exists($templatePath)) {
            throw new Exception("Template email non trouvé: " . $template);
        }
        
        // Extraire les variables pour le template
        extract($variables);
        
        // Capturer le contenu du template
        ob_start();
        include $templatePath;
        $htmlContent = ob_get_clean();
        
        // Headers
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: Young Talent <noreply@youngtalent.com>',
            'Reply-To: support@youngtalent.com',
            'X-Mailer: PHP/' . phpversion()
        ];
        
        // Envoyer l'email
        return mail($to, $subject, $htmlContent, implode("\r\n", $headers));
        
    } catch (Exception $e) {
        error_log("Erreur envoi email: " . $e->getMessage());
        return false;
    }
}

/**
 * Valider et nettoyer une adresse email
 */
function sanitizeEmail($email) {
    return filter_var(trim($email), FILTER_SANITIZE_EMAIL);
}

/**
 * ==============================================
 * FONCTIONS DE CACHE
 * ==============================================
 */

/**
 * Mettre en cache une donnée
 */
function setCache($key, $data, $expiration = 3600) {
    $cacheDir = 'cache/';
    if (!is_dir($cacheDir)) {
        mkdir($cacheDir, 0755, true);
    }
    
    $cacheFile = $cacheDir . md5($key) . '.cache';
    $cacheData = [
        'data' => $data,
        'expiration' => time() + $expiration
    ];
    
    return file_put_contents($cacheFile, serialize($cacheData)) !== false;
}

/**
 * Récupérer une donnée du cache
 */
function getCache($key) {
    $cacheFile = 'cache/' . md5($key) . '.cache';
    
    if (!file_exists($cacheFile)) {
        return null;
    }
    
    $cacheData = unserialize(file_get_contents($cacheFile));
    
    if (time() > $cacheData['expiration']) {
        unlink($cacheFile);
        return null;
    }
    
    return $cacheData['data'];
}

/**
 * Supprimer une entrée du cache
 */
function deleteCache($key) {
    $cacheFile = 'cache/' . md5($key) . '.cache';
    
    if (file_exists($cacheFile)) {
        return unlink($cacheFile);
    }
    
    return true;
}

/**
 * Vider tout le cache
 */
function clearCache() {
    $cacheDir = 'cache/';
    if (!is_dir($cacheDir)) {
        return true;
    }
    
    $files = glob($cacheDir . '*.cache');
    foreach ($files as $file) {
        unlink($file);
    }
    
    return true;
}

/**
 * ==============================================
 * FONCTIONS DE LOGGING
 * ==============================================
 */

/**
 * Logger une action utilisateur
 */
function logUserAction($db, $userId, $action, $details = null, $ipAddress = null) {
    try {
        $ipAddress = $ipAddress ?: $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        
        $query = "INSERT INTO user_logs (user_id, action, details, ip_address, created_at) 
                  VALUES (:user_id, :action, :details, :ip_address, NOW())";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':user_id', $userId);
        $stmt->bindParam(':action', $action);
        $stmt->bindParam(':details', $details);
        $stmt->bindParam(':ip_address', $ipAddress);
        
        return $stmt->execute();
    } catch (PDOException $e) {
        error_log("Erreur log utilisateur: " . $e->getMessage());
        return false;
    }
}

/**
 * Logger une erreur système
 */
function logError($message, $file = null, $line = null, $context = []) {
    $logEntry = [
        'timestamp' => date('Y-m-d H:i:s'),
        'message' => $message,
        'file' => $file,
        'line' => $line,
        'context' => $context,
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
    ];
    
    $logFile = 'logs/error_' . date('Y-m-d') . '.log';
    $logDir = dirname($logFile);
    
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    
    return file_put_contents($logFile, json_encode($logEntry) . "\n", FILE_APPEND | LOCK_EX);
}

/**
 * ==============================================
 * FONCTIONS DE VALIDATION
 * ==============================================
 */

/**
 * Valider un nom d'utilisateur
 */
function validateUsername($username) {
    $errors = [];
    
    if (empty($username)) {
        $errors[] = 'Le nom d\'utilisateur est requis';
    } elseif (strlen($username) < 3) {
        $errors[] = 'Le nom d\'utilisateur doit contenir au moins 3 caractères';
    } elseif (strlen($username) > 30) {
        $errors[] = 'Le nom d\'utilisateur ne peut pas dépasser 30 caractères';
    } elseif (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
        $errors[] = 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores';
    }
    
    return $errors;
}

/**
 * Valider un nom d'artiste
 */
function validateArtistName($artistName) {
    $errors = [];
    
    if (empty($artistName)) {
        $errors[] = 'Le nom d\'artiste est requis';
    } elseif (strlen($artistName) < 2) {
        $errors[] = 'Le nom d\'artiste doit contenir au moins 2 caractères';
    } elseif (strlen($artistName) > 50) {
        $errors[] = 'Le nom d\'artiste ne peut pas dépasser 50 caractères';
    }
    
    return $errors;
}

/**
 * Valider un fichier audio
 */
function validateAudioFile($file) {
    $errors = [];
    $allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    $maxSize = 50 * 1024 * 1024; // 50MB
    
    if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
        $errors[] = 'Aucun fichier audio sélectionné';
        return $errors;
    }
    
    // Vérifier la taille
    if ($file['size'] > $maxSize) {
        $errors[] = 'Le fichier audio est trop volumineux (50MB maximum)';
    }
    
    // Vérifier le type MIME
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        $errors[] = 'Format audio non supporté (MP3, WAV, OGG uniquement)';
    }
    
    return $errors;
}

/**
 * ==============================================
 * FONCTIONS UTILITAIRES
 * ==============================================
 */

/**
 * Générer un slug à partir d'un texte
 */
function generateSlug($text) {
    // Remplacer les caractères accentués
    $text = iconv('UTF-8', 'ASCII//TRANSLIT', $text);
    
    // Convertir en minuscules
    $text = strtolower($text);
    
    // Remplacer les caractères non alphanumériques par des tirets
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    
    // Supprimer les tirets en début et fin
    $text = trim($text, '-');
    
    return $text;
}

/**
 * Générer une couleur aléatoire
 */
function generateRandomColor() {
    return sprintf('#%06X', mt_rand(0, 0xFFFFFF));
}

/**
 * Obtenir l'adresse IP du client
 */
function getClientIP() {
    $ipKeys = ['HTTP_CLIENT_IP', 'HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR'];
    
    foreach ($ipKeys as $key) {
        if (array_key_exists($key, $_SERVER) === true) {
            foreach (explode(',', $_SERVER[$key]) as $ip) {
                $ip = trim($ip);
                
                if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) !== false) {
                    return $ip;
                }
            }
        }
    }
    
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/**
 * Vérifier si l'utilisateur est sur mobile
 */
function isMobile() {
    return preg_match('/(android|iphone|ipad|mobile)/i', $_SERVER['HTTP_USER_AGENT'] ?? '');
}

/**
 * Rediriger avec message flash
 */
function redirectWithMessage($url, $message, $type = 'success') {
    $_SESSION['flash_message'] = $message;
    $_SESSION['flash_type'] = $type;
    header('Location: ' . $url);
    exit();
}

/**
 * Obtenir un message flash
 */
function getFlashMessage() {
    if (isset($_SESSION['flash_message'])) {
        $message = [
            'message' => $_SESSION['flash_message'],
            'type' => $_SESSION['flash_type'] ?? 'info'
        ];
        
        unset($_SESSION['flash_message']);
        unset($_SESSION['flash_type']);
        
        return $message;
    }
    
    return null;
}

/**
 * Pagination
 */
function paginate($totalItems, $itemsPerPage, $currentPage, $baseUrl) {
    $totalPages = ceil($totalItems / $itemsPerPage);
    $currentPage = max(1, min($currentPage, $totalPages));
    
    $pagination = [
        'current_page' => $currentPage,
        'total_pages' => $totalPages,
        'total_items' => $totalItems,
        'items_per_page' => $itemsPerPage,
        'has_previous' => $currentPage > 1,
        'has_next' => $currentPage < $totalPages,
        'previous_page' => $currentPage - 1,
        'next_page' => $currentPage + 1,
        'pages' => []
    ];
    
    // Générer les liens de pages
    $start = max(1, $currentPage - 2);
    $end = min($totalPages, $currentPage + 2);
    
    for ($i = $start; $i <= $end; $i++) {
        $pagination['pages'][] = [
            'number' => $i,
            'url' => $baseUrl . '?page=' . $i,
            'is_current' => $i == $currentPage
        ];
    }
    
    return $pagination;
}

/**
 * ==============================================
 * FONCTIONS DE CONFIGURATION
 * ==============================================
 */

/**
 * Charger la configuration depuis un fichier
 */
function loadConfig($configFile = 'config/config.php') {
    if (file_exists($configFile)) {
        return include $configFile;
    }
    
    return [];
}

/**
 * Obtenir une valeur de configuration
 */
function getConfig($key, $default = null) {
    static $config = null;
    
    if ($config === null) {
        $config = loadConfig();
    }
    
    return $config[$key] ?? $default;
}

/**
 * Vérifier si l'environnement est en développement
 */
function isDevelopment() {
    return getConfig('environment', 'production') === 'development';
}

/**
 * ==============================================
 * FONCTIONS DE DEBUG
 * ==============================================
 */

/**
 * Dump et die (pour le debug)
 */
function dd($data) {
    echo '<pre>';
    var_dump($data);
    echo '</pre>';
    die();
}

/**
 * Debug avec formatage
 */
function debug($data, $label = null) {
    if (!isDevelopment()) {
        return;
    }
    
    echo '<div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; margin: 10px 0; border-radius: 5px;">';
    
    if ($label) {
        echo '<strong style="color: #495057;">' . htmlspecialchars($label) . ':</strong><br>';
    }
    
    echo '<pre style="margin: 5px 0 0 0; color: #212529;">';
    print_r($data);
    echo '</pre>';
    echo '</div>';
}

/**
 * Mesurer le temps d'exécution
 */
function benchmark($callback, $label = 'Benchmark') {
    $start = microtime(true);
    $result = $callback();
    $end = microtime(true);
    
    $executionTime = ($end - $start) * 1000; // en millisecondes
    
    if (isDevelopment()) {
        echo "<div style='background: #e3f2fd; padding: 10px; margin: 5px 0; border-radius: 3px;'>";
        echo "<strong>{$label}:</strong> " . number_format($executionTime, 2) . " ms";
        echo "</div>";
    }
    
    return $result;
}

// Initialisation automatique
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Générer le token CSRF automatiquement
generateCSRFToken();

// Définir le timezone
date_default_timezone_set('Europe/Paris');

// Gestion des erreurs en développement
if (isDevelopment()) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}
?>