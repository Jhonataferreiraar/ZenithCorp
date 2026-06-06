<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
    <link href="favicon-32x32.png" rel="icon" onerror="this.href='massagem-frontend/favicon-32x32.png';">
    <link href="favicon-32x32.png" rel="shortcut icon" onerror="this.href='massagem-frontend/favicon-32x32.png';">
    <title>Agendamento de Massagem</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <link rel="stylesheet" href="style.css">
</head>

<body>
<?php
include('agendador.html');
?>


       <footer style="
    background: linear-gradient(135deg, rgba(15, 31, 51, 0.85), rgba(21, 44, 74, 0.75));
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    color: white;
    text-align: center;
    padding: 18px 24px;
    margin: 40px auto 0;
    font-size: 13px;
    border-top: 2px solid rgba(200, 117, 51, 0.5);
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    width: 100%;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
    letter-spacing: 0.3px;">
        <p style="margin: 0; display: flex; align-items: center; justify-content: center; gap: 8px;">
            <i class="fa-solid fa-spa" style="color: #C87533; font-size: 16px;"></i>
            <span style="color: #e2e8f0; font-weight: 500;">Zenith Corp.</span>
            <span style="color: rgba(255,255,255,0.35);">|</span>
            <span style="color: #94a3b8;">&copy; 2026 Todos os direitos reservados</span>
        </p>
    </footer>

    <script>
        setInterval(() => {
            window.location.reload();
        }, 130000); // 130.000 milissegundos = 130 segundos
    </script> 

	<!-- Ativar o console pelo F12 -->
	<script disable-devtool-auto src="https://cdn.jsdelivr.net/npm/disable-devtool"></script> 
	
    <script src="script.js"></script>

</body>

</html>
