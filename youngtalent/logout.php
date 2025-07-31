<?php
session_start();
include 'database.php';
include 'auth.php';

// Effectuer la déconnexion
$result = $auth->logout();

// Rediriger vers la page d'accueil avec un message
header('Location: index.php?logged_out=1');
exit();
?>