document.addEventListener('DOMContentLoaded', () => {
    const startScreen = document.getElementById('start-screen');
    const mainContainer = document.getElementById('main-container');
    const startButton = document.getElementById('start-button');
    const gameArea = document.getElementById('game-area');
    const player = document.getElementById('player');
    const scoreDisplay = document.getElementById('score');

    let score = 0;
    const playerSpeed = 5;
    const bulletSpeed = 10;
    const keysPressed = {};
    let playerPosition = { x: 0, y: 0 };
    let pointsInitialized = false;

    // Tela inicial: transição para o jogo
    startButton.addEventListener('click', () => {
        startScreen.style.opacity = 0;
        setTimeout(() => {
            startScreen.style.display = 'none';
            mainContainer.style.display = 'flex';
            spawnEnemies(5); // Gere 5 inimigos
            detectBulletHits(); // Inicia detecção de colisão com tiros
            movePlayer(); // Movimenta o jogador

            if (!pointsInitialized) {
                generatePoints(20); // Adiciona 20 pontos de coleta no início
                pointsInitialized = true;
            }
        }, 1000);
    });

    // Movimentação do jogador
    document.addEventListener('keydown', (e) => {
        keysPressed[e.key] = true;

        if (e.code === 'Space') {
            shootBullet();
            playLaserSound();
        }
    });

    document.addEventListener('keyup', (e) => {
        keysPressed[e.key] = false;
    });

    function movePlayer() {
        const gameAreaRect = gameArea.getBoundingClientRect();

        if (keysPressed['ArrowUp']) playerPosition.y -= playerSpeed;
        if (keysPressed['ArrowDown']) playerPosition.y += playerSpeed;
        if (keysPressed['ArrowLeft']) playerPosition.x -= playerSpeed;
        if (keysPressed['ArrowRight']) playerPosition.x += playerSpeed;

        playerPosition.x = Math.max(0, Math.min(playerPosition.x, gameArea.clientWidth - player.offsetWidth));
        playerPosition.y = Math.max(0, Math.min(playerPosition.y, gameArea.clientHeight - player.offsetHeight));

        player.style.left = `${playerPosition.x}px`;
        player.style.top = `${playerPosition.y}px`;

        checkPointCollision(); // Verifica a colisão com os pontos de coleta

        requestAnimationFrame(movePlayer);
    }

    // Função para gerar pontos de coleta
    function generatePoints(amount) {
        for (let i = 0; i < amount; i++) {
            const point = document.createElement('div');
            point.classList.add('point');

            const x = Math.random() * (gameArea.clientWidth - 15);
            const y = Math.random() * (gameArea.clientHeight - 15);

            point.style.left = `${x}px`;
            point.style.top = `${y}px`;

            gameArea.appendChild(point);
        }
    }

    // Verifica colisões entre o jogador e os pontos de coleta
    function checkPointCollision() {
        const points = document.querySelectorAll('.point');
        points.forEach((point) => {
            const pointRect = point.getBoundingClientRect();
            const playerRect = player.getBoundingClientRect();

            const pointCenterX = pointRect.left + pointRect.width / 2;
            const pointCenterY = pointRect.top + pointRect.height / 2;
            const playerCenterX = playerRect.left + playerRect.width / 2;
            const playerCenterY = playerRect.top + playerRect.height / 2;

            const distance = Math.sqrt(
                (playerCenterX - pointCenterX) ** 2 + (playerCenterY - pointCenterY) ** 2
            );

            if (distance < 15) { // Detecta colisão
                point.remove();

                score += 10; // Incrementa a pontuação
                scoreDisplay.textContent = score;

                playCollectionSound(); // Reproduz som ao coletar o ponto
            }
        });
    }

    // Função para reproduzir som da coleta
    function playCollectionSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.type = 'sine'; // Tipo de onda sonora (senoidal)
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime); // Frequência (nota Lá)

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2); // Som dura 0.2s
    }

    // Movimento dos inimigos em direção ao jogador (correção para perseguição)
    function moveEnemiesTowardPlayer() {
        const enemies = document.querySelectorAll('.enemy');
        const playerRect = player.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();

        enemies.forEach((enemy) => {
            const enemyRect = enemy.getBoundingClientRect();

            // Calcula a direção do movimento (posição do jogador menos posição do inimigo)
            const diffX = playerRect.left - playerRect.width / 2 - (enemyRect.left - enemyRect.width / 2);
            const diffY = playerRect.top - playerRect.height / 2 - (enemyRect.top - enemyRect.height / 2);
            const angle = Math.atan2(diffY, diffX); // Ângulo exato para o jogador
            const speed = 3.5; // Velocidade aumentada para perseguição implacável

            // Calcula a nova posição com base no ângulo
            let newLeft = enemyRect.left - gameAreaRect.left + Math.cos(angle) * speed;
            let newTop = enemyRect.top - gameAreaRect.top + Math.sin(angle) * speed;

            // Limita o movimento do inimigo dentro do game-area
            newLeft = Math.max(0, Math.min(newLeft, gameArea.clientWidth - enemy.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, gameArea.clientHeight - enemy.offsetHeight));

            // Atualiza as coordenadas do inimigo
            enemy.style.left = `${newLeft}px`;
            enemy.style.top = `${newTop}px`;
        });

        // Continua atualizando a posição dos inimigos
        requestAnimationFrame(moveEnemiesTowardPlayer);
    }

    // Função para gerar os inimigos
    function spawnEnemies(amount) {
        for (let i = 0; i < amount; i++) {
            const enemy = document.createElement('div');
            enemy.classList.add('enemy');

            const x = Math.random() * (gameArea.clientWidth - 50);
            const y = Math.random() * (gameArea.clientHeight - 50);

            enemy.style.left = `${x}px`;
            enemy.style.top = `${y}px`;

            gameArea.appendChild(enemy);
        }

        moveEnemiesTowardPlayer(); // Inicia perseguição implacável
    }

    // Detecção de colisões entre tiro e inimigo
    function detectBulletHits() {
        const bullets = document.querySelectorAll('.bullet');
        const enemies = document.querySelectorAll('.enemy');

        bullets.forEach((bullet) => {
            enemies.forEach((enemy) => {
                if (checkCollision(bullet, enemy)) {
                    explodeEnemyWithParticles(enemy);
                    bullet.remove();
                }
            });
        });

        requestAnimationFrame(detectBulletHits);
    }

    // Função de colisão
    function checkCollision(bullet, enemy) {
        const bulletRect = bullet.getBoundingClientRect();
        const enemyRect = enemy.getBoundingClientRect();

        return (
            bulletRect.left < enemyRect.right &&
            bulletRect.right > enemyRect.left &&
            bulletRect.top < enemyRect.bottom &&
            bulletRect.bottom > enemyRect.top
        );
    }

    // Função para tiros
    function shootBullet() {
        const bullet = document.createElement('div');
        bullet.classList.add('bullet');
        const playerRect = player.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();

        bullet.style.left = `${playerRect.left - gameAreaRect.left + playerRect.width / 2 - 3}px`;
        bullet.style.top = `${playerRect.top - gameAreaRect.top}px`;

        gameArea.appendChild(bullet);

        const bulletInterval = setInterval(() => {
            const bulletTop = parseInt(bullet.style.top, 10);

            if (bulletTop < 0) {
                bullet.remove();
                clearInterval(bulletInterval);
            } else {
                bullet.style.top = `${bulletTop - bulletSpeed}px`;
            }
        }, 20);
    }

    // Função para explosões
    function explodeEnemyWithParticles(enemy) {
        createParticles(enemy);
        playExplosionSound();
        enemy.remove();
    }

    // Partículas para explosão
    function createParticles(enemy) {
        const particleCount = 20; // Número de partículas
        const enemyRect = enemy.getBoundingClientRect();
        const gameAreaRect = gameArea.getBoundingClientRect();

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');

            // Define a posição inicial das partículas no centro do inimigo
            particle.style.left = `${enemyRect.left - gameAreaRect.left + enemyRect.width / 2}px`;
            particle.style.top = `${enemyRect.top - gameAreaRect.top + enemyRect.height / 2}px`;

            // Movimento aleatório das partículas
            const randomX = (Math.random() - 0.5) * 200; // Direção aleatória em X
            const randomY = (Math.random() - 0.5) * 200; // Direção aleatória em Y
            particle.style.setProperty('--x', `${randomX}px`);
            particle.style.setProperty('--y', `${randomY}px`);

            // Adiciona a partícula ao game-area
            gameArea.appendChild(particle);

            // Remove a partícula após 1 segundo
            setTimeout(() => particle.remove(), 1000);
        }
    }

    // Som de explosão
    function playExplosionSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Configuração do som de explosão
        oscillator.type = 'square'; // Onda quadrada para explosão
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime); // Frequência inicial
        oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5); // Frequência decrescente

        // Controle do volume
        gainNode.gain.setValueAtTime(1, audioContext.currentTime); // Volume inicial
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5); // Reduz volume gradualmente

        // Conecta o som ao destino (alto-falante)
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Inicia o som e programa sua parada
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5); // Para após 0.5 segundos
    }

    // Função para som de disparo (laser)
    function playLaserSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        // Configuração do som do laser
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // Frequência inicial (alta)
        oscillator.frequency.exponentialRampToValueAtTime(440, audioContext.currentTime + 0.2); // Frequência decrescente

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime); // Volume inicial
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.2); // Reduz volume gradualmente

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Inicia o som e programa sua parada
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2); // Som dura 0.2 segundos
    }
});
//teste de perseguição