<?php
// Paramètres de connexion
$host = 'localhost';
$dbname = 'youngtalent';
$user = 'root'; // ⚠️ À modifier selon ton serveur
$password = ''; // ⚠️ À modifier selon ton serveur

// Options PDO recommandées
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,  // Exceptions en cas d'erreur SQL
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, // Résultats en tableau associatif
    PDO::ATTR_EMULATE_PREPARES => false, // Sécurité des requêtes préparées
];

try {
    // Connexion
    $db = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $user, $password, $options);
} catch (PDOException $e) {
    // Affichage et arrêt en cas d’erreur
    die("Erreur de connexion à la base de données : " . $e->getMessage());
}
?>
