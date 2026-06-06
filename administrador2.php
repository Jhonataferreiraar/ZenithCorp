<!DOCTYPE html>
<html lang="pt-BR">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.17.0/xlsx.full.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="favicon-32x32.png" rel="icon" onerror="this.href='massagem-frontend/favicon-32x32.png';">
    <link href="favicon-32x32.png" rel="shortcut icon" onerror="this.href='massagem-frontend/favicon-32x32.png';">
    <title>Administrador - Massagens</title>
    <link rel="stylesheet" href="style.css" />
</head>

<body>

    <?php
    // Garante que o HTML seja carregado antes dos scripts
    ob_start();
    include('administrador.html');
    $html = ob_get_clean();
    echo $html;
    ?>

    <script src="script.js"></script>
	
	<!-- Ativar o console pelo F12 -->
	<script disable-devtool-auto src="https://cdn.jsdelivr.net/npm/disable-devtool"></script> 

</body>
</html>
