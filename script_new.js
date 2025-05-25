// Oyun değişkenleri
let canvas, ctx;
let scoreElement, speedElement, moneyElement;
let gameOverScreen, startScreen, shopScreen;
let finalScoreElement, restartBtn, startBtn, shopBtn, closeShopBtn;
let carsGrid, currentCarDisplay;

// Oyun durumu
let gameState = 'start';
let previousGameState = 'start'; // Dükkan açılmadan önceki durum
let score = 0;
let money = 100;
let gameSpeed = 2;
let keys = {};
let currentCarIndex = 0;

// Araba türleri
const carTypes = [
    { name: "Klasik Araba", color: "#ff6b6b", speed: 5, price: 0, icon: "🚗", owned: true },
    { name: "Spor Araba", color: "#4ecdc4", speed: 7, price: 200, icon: "🏎️", owned: false },
    { name: "Süper Araba", color: "#ffe66d", speed: 9, price: 500, icon: "🏁", owned: false },
    { name: "Formula 1", color: "#ff6b9d", speed: 12, price: 1000, icon: "🏎️", owned: false },
    { name: "Elektrikli Araba", color: "#95e1d3", speed: 8, price: 300, icon: "⚡", owned: false },
    { name: "Klasik Muscle", color: "#ff8b94", speed: 10, price: 750, icon: "💪", owned: false }
];

// Araba nesnesi
const car = {
    x: 0,
    y: 0,
    width: 50,
    height: 80,
    get speed() { return carTypes[currentCarIndex].speed; },
    get color() { return carTypes[currentCarIndex].color; }
};

// Engeller ve yol
let obstacles = [];
let obstacleTimer = 0;
let roadLines = [];

// DOM yüklendiğinde çalışır
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM yüklendi, oyun başlatılıyor...');
    initGame();
});

function initGame() {
    // DOM elementlerini al
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    scoreElement = document.getElementById('score');
    speedElement = document.getElementById('speed');
    moneyElement = document.getElementById('money');
    gameOverScreen = document.getElementById('gameOver');
    startScreen = document.getElementById('startScreen');
    shopScreen = document.getElementById('shopScreen');
    finalScoreElement = document.getElementById('finalScore');
    restartBtn = document.getElementById('restartBtn');
    startBtn = document.getElementById('startBtn');
    shopBtn = document.getElementById('shopBtn');
    closeShopBtn = document.getElementById('closeShopBtn');
    carsGrid = document.getElementById('carsGrid');
    currentCarDisplay = document.getElementById('currentCarDisplay');

    // Event listeners
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    shopBtn.addEventListener('click', () => {
        // Sadece oyun oynanırken dükkanı aç
        if (gameState === 'playing') {
            openShop();
        }
    });
    closeShopBtn.addEventListener('click', closeShop);    // İlk durumu ayarla
    resetGame();
    updateMoney();
    drawInitialState();
    shopBtn.disabled = true; // Oyun başlamadan dükkan kapalı
    
    console.log('Oyun başarıyla başlatıldı!');
}

function drawInitialState() {
    drawRoad();
    drawCar();
}

function startGame() {
    console.log('Oyun başlatılıyor...');
    gameState = 'playing';
    startScreen.classList.add('hidden');
    shopBtn.disabled = false; // Dükkan butonunu aktif et
    resetGame();
    gameLoop();
}

function restartGame() {
    gameState = 'playing';
    gameOverScreen.classList.add('hidden');
    shopBtn.disabled = false; // Dükkan butonunu aktif et
    resetGame();
    gameLoop();
}

function resetGame() {
    score = 0;
    gameSpeed = 2;
    car.x = canvas.width / 2 - 25;
    car.y = canvas.height - 100;
    obstacles = [];
    obstacleTimer = 0;
    roadLines = [];
    
    // Yol çizgilerini oluştur
    for (let i = 0; i < canvas.height; i += 60) {
        roadLines.push({
            x: canvas.width / 2 - 2,
            y: i,
            width: 4,
            height: 30
        });
    }
    
    updateScore();
    updateSpeed();
}

function drawCar() {
    const currentCar = carTypes[currentCarIndex];
    
    switch(currentCarIndex) {
        case 0: // Klasik Araba
            drawClassicCar();
            break;
        case 1: // Spor Araba
            drawSportsCar();
            break;
        case 2: // Süper Araba
            drawSuperCar();
            break;
        case 3: // Formula 1
            drawFormulaCar();
            break;
        case 4: // Elektrikli Araba
            drawElectricCar();
            break;
        case 5: // Klasik Muscle
            drawMuscleCar();
            break;
        default:
            drawClassicCar();
    }
}

function drawClassicCar() {
    // Klasik araba - dikdörtgen şekil
    ctx.fillStyle = car.color;
    ctx.fillRect(car.x, car.y, car.width, car.height);
    
    // Cam kısımları
    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(car.x + 5, car.y + 10, 40, 20);
    ctx.fillRect(car.x + 5, car.y + 50, 40, 20);
    
    // Tekerlekler
    ctx.fillStyle = '#000';
    ctx.fillRect(car.x - 5, car.y + 10, 8, 15);
    ctx.fillRect(car.x + car.width - 3, car.y + 10, 8, 15);
    ctx.fillRect(car.x - 5, car.y + car.height - 25, 8, 15);
    ctx.fillRect(car.x + car.width - 3, car.y + car.height - 25, 8, 15);
    
    // Farlar
    ctx.fillStyle = '#ffff99';
    ctx.fillRect(car.x + 10, car.y, 10, 5);
    ctx.fillRect(car.x + 30, car.y, 10, 5);
}

function drawSportsCar() {
    // Spor araba - aerodinamik şekil
    ctx.fillStyle = car.color;
    
    // Ana gövde
    ctx.fillRect(car.x + 5, car.y + 5, car.width - 10, car.height - 10);
    
    // Ön tampon (sivri)
    ctx.beginPath();
    ctx.moveTo(car.x + 5, car.y + 5);
    ctx.lineTo(car.x + car.width - 5, car.y + 5);
    ctx.lineTo(car.x + car.width - 10, car.y);
    ctx.lineTo(car.x + 10, car.y);
    ctx.closePath();
    ctx.fill();
    
    // Arka spoiler
    ctx.fillRect(car.x + 15, car.y + car.height - 5, 20, 3);
    
    // Cam kısımları (daha küçük)
    ctx.fillStyle = '#000080';
    ctx.fillRect(car.x + 10, car.y + 15, 30, 15);
    ctx.fillRect(car.x + 10, car.y + 50, 30, 15);
    
    // Sporcu tekerlekler (daha geniş)
    ctx.fillStyle = '#222';
    ctx.fillRect(car.x - 3, car.y + 12, 10, 18);
    ctx.fillRect(car.x + car.width - 7, car.y + 12, 10, 18);
    ctx.fillRect(car.x - 3, car.y + car.height - 30, 10, 18);
    ctx.fillRect(car.x + car.width - 7, car.y + car.height - 30, 10, 18);
    
    // LED farlar
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(car.x + 12, car.y + 2, 6, 3);
    ctx.fillRect(car.x + 32, car.y + 2, 6, 3);
}

function drawSuperCar() {
    // Süper araba - çok düşük ve geniş
    ctx.fillStyle = car.color;
    
    // Ana gövde (daha düşük)
    ctx.fillRect(car.x, car.y + 10, car.width, car.height - 20);
    
    // Çok sivri ön
    ctx.beginPath();
    ctx.moveTo(car.x, car.y + 10);
    ctx.lineTo(car.x + car.width, car.y + 10);
    ctx.lineTo(car.x + car.width - 15, car.y);
    ctx.lineTo(car.x + 15, car.y);
    ctx.closePath();
    ctx.fill();
    
    // Büyük arka spoiler
    ctx.fillRect(car.x + 10, car.y + car.height - 8, 30, 5);
    ctx.fillRect(car.x + 15, car.y + car.height - 15, 20, 3);
    
    // Çok koyu cam
    ctx.fillStyle = '#000';
    ctx.fillRect(car.x + 12, car.y + 18, 26, 12);
    ctx.fillRect(car.x + 12, car.y + 45, 26, 12);
    
    // Yarış tekerlekleri
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(car.x - 2, car.y + 15, 8, 20);
    ctx.fillRect(car.x + car.width - 6, car.y + 15, 8, 20);
    ctx.fillRect(car.x - 2, car.y + car.height - 35, 8, 20);
    ctx.fillRect(car.x + car.width - 6, car.y + car.height - 35, 8, 20);
    
    // Xenon farlar
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(car.x + 15, car.y + 2, 8, 4);
    ctx.fillRect(car.x + 27, car.y + 2, 8, 4);
}

function drawFormulaCar() {
    // Formula 1 - çok özel tasarım
    ctx.fillStyle = car.color;
    
    // Ana gövde (çok ince)
    ctx.fillRect(car.x + 10, car.y + 15, 30, 50);
    
    // Kanat (ön)
    ctx.fillRect(car.x, car.y, car.width, 8);
    
    // Kanat (arka) 
    ctx.fillRect(car.x + 5, car.y + car.height - 10, 40, 8);
    ctx.fillRect(car.x + 15, car.y + car.height - 18, 20, 5);
    
    // Kokpit
    ctx.fillStyle = '#000';
    ctx.fillRect(car.x + 15, car.y + 20, 20, 40);
    
    // Halo (güvenlik çubuğu)
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(car.x + 22, car.y + 18, 6, 3);
    
    // F1 tekerlekleri (çok geniş)
    ctx.fillStyle = '#000';
    ctx.fillRect(car.x - 8, car.y + 8, 15, 25);
    ctx.fillRect(car.x + car.width - 7, car.y + 8, 15, 25);
    ctx.fillRect(car.x - 8, car.y + car.height - 33, 15, 25);
    ctx.fillRect(car.x + car.width - 7, car.y + car.height - 33, 15, 25);
    
    // Tekerlek jantları
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(car.x - 5, car.y + 12, 9, 17);
    ctx.fillRect(car.x + car.width - 4, car.y + 12, 9, 17);
    ctx.fillRect(car.x - 5, car.y + car.height - 29, 9, 17);
    ctx.fillRect(car.x + car.width - 4, car.y + car.height - 29, 9, 17);
}

function drawElectricCar() {
    // Elektrikli araba - modern ve düz tasarım
    ctx.fillStyle = car.color;
    
    // Ana gövde (yumuşak köşeler simülasyonu)
    ctx.fillRect(car.x + 2, car.y, car.width - 4, car.height);
    ctx.fillRect(car.x, car.y + 5, car.width, car.height - 10);
    
    // Elektrikli arabalarda büyük cam yüzeyler
    ctx.fillStyle = '#E0E0E0';
    ctx.fillRect(car.x + 8, car.y + 8, 34, 25);
    ctx.fillRect(car.x + 8, car.y + 47, 34, 25);
    
    // Elektrikli şarj portu
    ctx.fillStyle = '#00ff00';
    ctx.fillRect(car.x + 45, car.y + 30, 3, 8);
    
    // Şık tekerlekler
    ctx.fillStyle = '#2F4F4F';
    ctx.fillRect(car.x - 4, car.y + 12, 10, 16);
    ctx.fillRect(car.x + car.width - 6, car.y + 12, 10, 16);
    ctx.fillRect(car.x - 4, car.y + car.height - 28, 10, 16);
    ctx.fillRect(car.x + car.width - 6, car.y + car.height - 28, 10, 16);
    
    // LED strip farlar
    ctx.fillStyle = '#00ccff';
    ctx.fillRect(car.x + 5, car.y + 2, 40, 2);
    
    // Tesla benzeri logo yeri
    ctx.fillStyle = '#fff';
    ctx.fillRect(car.x + 22, car.y + 35, 6, 10);
}

function drawMuscleCar() {
    // Muscle car - güçlü ve kare tasarım
    ctx.fillStyle = car.color;
    
    // Ana gövde (daha büyük)
    ctx.fillRect(car.x - 2, car.y, car.width + 4, car.height);
    
    // Kaput üstü hava girişi
    ctx.fillStyle = '#000';
    ctx.fillRect(car.x + 15, car.y + 5, 20, 8);
    ctx.fillRect(car.x + 20, car.y + 2, 10, 5);
    
    // Büyük cam yüzeyler
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(car.x + 5, car.y + 15, 40, 18);
    ctx.fillRect(car.x + 5, car.y + 47, 40, 18);
    
    // Yan çizgiler (racing stripe)
    ctx.fillStyle = '#fff';
    ctx.fillRect(car.x + 22, car.y, 6, car.height);
    
    // Büyük tekerlekler
    ctx.fillStyle = '#000';
    ctx.fillRect(car.x - 6, car.y + 10, 12, 20);
    ctx.fillRect(car.x + car.width - 6, car.y + 10, 12, 20);
    ctx.fillRect(car.x - 6, car.y + car.height - 30, 12, 20);
    ctx.fillRect(car.x + car.width - 6, car.y + car.height - 30, 12, 20);
    
    // Krom jantlar
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(car.x - 3, car.y + 14, 6, 12);
    ctx.fillRect(car.x + car.width - 3, car.y + 14, 6, 12);
    ctx.fillRect(car.x - 3, car.y + car.height - 26, 6, 12);
    ctx.fillRect(car.x + car.width - 3, car.y + car.height - 26, 6, 12);
    
    // Büyük farlar
    ctx.fillStyle = '#ffff99';
    ctx.fillRect(car.x + 8, car.y, 12, 6);
    ctx.fillRect(car.x + 30, car.y, 12, 6);
    
    // Egzoz boruları
    ctx.fillStyle = '#C0C0C0';
    ctx.fillRect(car.x + 10, car.y + car.height - 3, 4, 3);
    ctx.fillRect(car.x + 36, car.y + car.height - 3, 4, 3);
}

function createObstacle() {
    const lanes = [150, 250, 350, 450, 550];
    const lane = lanes[Math.floor(Math.random() * lanes.length)];
    const colors = ['#e74c3c', '#9b59b6', '#3498db', '#e67e22', '#1abc9c'];
    const carType = Math.floor(Math.random() * 6); // 0-5 arası araba tipi
    
    obstacles.push({
        x: lane,
        y: -80,
        width: 50,
        height: 80,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: carType
    });
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        drawObstacleCar(obstacle);
    });
}

function drawObstacleCar(obstacle) {
    const originalCarX = car.x;
    const originalCarY = car.y;
    const originalColor = car.color;
    
    // Geçici olarak obstacle'ın pozisyonunu ve rengini kullan
    car.x = obstacle.x;
    car.y = obstacle.y;
    
    switch(obstacle.type) {
        case 0:
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(car.x, car.y, car.width, car.height);
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(car.x + 5, car.y + 10, 40, 20);
            ctx.fillRect(car.x + 5, car.y + 50, 40, 20);
            ctx.fillStyle = '#000';
            ctx.fillRect(car.x - 5, car.y + 10, 8, 15);
            ctx.fillRect(car.x + car.width - 3, car.y + 10, 8, 15);
            ctx.fillRect(car.x - 5, car.y + car.height - 25, 8, 15);
            ctx.fillRect(car.x + car.width - 3, car.y + car.height - 25, 8, 15);
            ctx.fillStyle = '#ffff99';
            ctx.fillRect(car.x + 10, car.y, 10, 5);
            ctx.fillRect(car.x + 30, car.y, 10, 5);
            break;
        case 1:
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(car.x + 5, car.y + 5, car.width - 10, car.height - 10);
            ctx.beginPath();
            ctx.moveTo(car.x + 5, car.y + 5);
            ctx.lineTo(car.x + car.width - 5, car.y + 5);
            ctx.lineTo(car.x + car.width - 10, car.y);
            ctx.lineTo(car.x + 10, car.y);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(car.x + 15, car.y + car.height - 5, 20, 3);
            ctx.fillStyle = '#000080';
            ctx.fillRect(car.x + 10, car.y + 15, 30, 15);
            ctx.fillRect(car.x + 10, car.y + 50, 30, 15);
            ctx.fillStyle = '#222';
            ctx.fillRect(car.x - 3, car.y + 12, 10, 18);
            ctx.fillRect(car.x + car.width - 7, car.y + 12, 10, 18);
            ctx.fillRect(car.x - 3, car.y + car.height - 30, 10, 18);
            ctx.fillRect(car.x + car.width - 7, car.y + car.height - 30, 10, 18);
            break;
        case 2:
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(car.x, car.y + 10, car.width, car.height - 20);
            ctx.beginPath();
            ctx.moveTo(car.x, car.y + 10);
            ctx.lineTo(car.x + car.width, car.y + 10);
            ctx.lineTo(car.x + car.width - 15, car.y);
            ctx.lineTo(car.x + 15, car.y);
            ctx.closePath();
            ctx.fill();
            ctx.fillRect(car.x + 10, car.y + car.height - 8, 30, 5);
            ctx.fillStyle = '#000';
            ctx.fillRect(car.x + 12, car.y + 18, 26, 12);
            ctx.fillRect(car.x + 12, car.y + 45, 26, 12);
            ctx.fillStyle = '#FF4500';
            ctx.fillRect(car.x - 2, car.y + 15, 8, 20);
            ctx.fillRect(car.x + car.width - 6, car.y + 15, 8, 20);
            ctx.fillRect(car.x - 2, car.y + car.height - 35, 8, 20);
            ctx.fillRect(car.x + car.width - 6, car.y + car.height - 35, 8, 20);
            break;
        case 3:
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(car.x + 10, car.y + 15, 30, 50);
            ctx.fillRect(car.x, car.y, car.width, 8);
            ctx.fillRect(car.x + 5, car.y + car.height - 10, 40, 8);
            ctx.fillStyle = '#000';
            ctx.fillRect(car.x + 15, car.y + 20, 20, 40);
            ctx.fillRect(car.x - 8, car.y + 8, 15, 25);
            ctx.fillRect(car.x + car.width - 7, car.y + 8, 15, 25);
            ctx.fillRect(car.x - 8, car.y + car.height - 33, 15, 25);
            ctx.fillRect(car.x + car.width - 7, car.y + car.height - 33, 15, 25);
            break;
        case 4:
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(car.x + 2, car.y, car.width - 4, car.height);
            ctx.fillRect(car.x, car.y + 5, car.width, car.height - 10);
            ctx.fillStyle = '#E0E0E0';
            ctx.fillRect(car.x + 8, car.y + 8, 34, 25);
            ctx.fillRect(car.x + 8, car.y + 47, 34, 25);
            ctx.fillStyle = '#2F4F4F';
            ctx.fillRect(car.x - 4, car.y + 12, 10, 16);
            ctx.fillRect(car.x + car.width - 6, car.y + 12, 10, 16);
            ctx.fillRect(car.x - 4, car.y + car.height - 28, 10, 16);
            ctx.fillRect(car.x + car.width - 6, car.y + car.height - 28, 10, 16);
            break;
        case 5:
            ctx.fillStyle = obstacle.color;
            ctx.fillRect(car.x - 2, car.y, car.width + 4, car.height);
            ctx.fillStyle = '#000';
            ctx.fillRect(car.x + 15, car.y + 5, 20, 8);
            ctx.fillStyle = '#4169E1';
            ctx.fillRect(car.x + 5, car.y + 15, 40, 18);
            ctx.fillRect(car.x + 5, car.y + 47, 40, 18);
            ctx.fillStyle = '#000';
            ctx.fillRect(car.x - 6, car.y + 10, 12, 20);
            ctx.fillRect(car.x + car.width - 6, car.y + 10, 12, 20);
            ctx.fillRect(car.x - 6, car.y + car.height - 30, 12, 20);
            ctx.fillRect(car.x + car.width - 6, car.y + car.height - 30, 12, 20);
            break;
    }
    
    // Orijinal değerleri geri yükle
    car.x = originalCarX;
    car.y = originalCarY;
}

function drawRoad() {
    // Yol arka planı
    ctx.fillStyle = '#34495e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Yol kenarları
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, 100, canvas.height);
    ctx.fillRect(canvas.width - 100, 0, 100, canvas.height);
    
    // Yol çizgileri
    ctx.fillStyle = '#f39c12';
    roadLines.forEach(line => {
        ctx.fillRect(line.x, line.y, line.width, line.height);
    });
    
    // Şerit çizgileri
    ctx.fillStyle = '#bdc3c7';
    for (let i = 200; i < canvas.width - 100; i += 100) {
        roadLines.forEach(line => {
            ctx.fillRect(i, line.y, 2, line.height);
        });
    }
}

function checkCollision() {
    for (let obstacle of obstacles) {
        if (car.x < obstacle.x + obstacle.width &&
            car.x + car.width > obstacle.x &&
            car.y < obstacle.y + obstacle.height &&
            car.y + car.height > obstacle.y) {
            return true;
        }
    }
    return false;
}

function update() {
    if (gameState !== 'playing') return;
    
    // Araba kontrolü
    if (keys['ArrowLeft'] && car.x > 120) {
        car.x -= car.speed;
    }
    if (keys['ArrowRight'] && car.x < canvas.width - 120 - car.width) {
        car.x += car.speed;
    }
    if (keys['ArrowUp'] && gameSpeed < 8) {
        gameSpeed += 0.1;
    }
    if (keys['ArrowDown'] && gameSpeed > 1) {
        gameSpeed -= 0.1;
    }
    
    // Yol çizgilerini hareket ettir
    roadLines.forEach(line => {
        line.y += gameSpeed * 2;
        if (line.y > canvas.height) {
            line.y = -30;
        }
    });
    
    // Engelleri hareket ettir
    obstacles.forEach((obstacle, index) => {
        obstacle.y += gameSpeed;
        
        if (obstacle.y > canvas.height) {
            obstacles.splice(index, 1);
            score += 10;
            money += 5;
            updateScore();
            updateMoney();
            
            if (score % 100 === 0) {
                gameSpeed += 0.5;
            }
        }
    });
    
    // Yeni engel oluştur
    obstacleTimer++;
    if (obstacleTimer > 60 - (gameSpeed * 5)) {
        createObstacle();
        obstacleTimer = 0;
    }
      // Çarpışma kontrolü
    if (checkCollision()) {
        gameState = 'gameOver';
        shopBtn.disabled = true; // Dükkan butonunu deaktif et
        finalScoreElement.textContent = score;
        gameOverScreen.classList.remove('hidden');
    }
    
    updateSpeed();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoad();
    drawObstacles();
    drawCar();
}

function updateScore() {
    scoreElement.textContent = score;
}

function updateSpeed() {
    speedElement.textContent = Math.round(gameSpeed * 20);
}

function updateMoney() {
    moneyElement.textContent = money;
}

function gameLoop() {
    if (gameState === 'playing') {
        update();
        draw();
        requestAnimationFrame(gameLoop);
    }
}

// Dükkan fonksiyonları
function openShop() {
    previousGameState = gameState; // Mevcut durumu kaydet
    gameState = 'shop';
    shopScreen.classList.remove('hidden');
    updateShop();
}

function closeShop() {
    gameState = previousGameState; // Önceki duruma geri dön
    shopScreen.classList.add('hidden');
    
    // Canvas'ı güncelle
    if (gameState === 'playing') {
        draw();
        gameLoop(); // Oyun döngüsünü tekrar başlat
    } else {
        drawInitialState();
    }
}

function updateShop() {
    const currentCar = carTypes[currentCarIndex];
    currentCarDisplay.innerHTML = `
        <div class="car-preview" style="background-color: ${currentCar.color};">
            ${currentCar.icon}
        </div>
        <div class="car-name">${currentCar.name}</div>
        <div class="car-stats">
            <span>Hız: ${currentCar.speed}</span>
        </div>
    `;
    
    carsGrid.innerHTML = '';
    carTypes.forEach((carType, index) => {
        const carCard = document.createElement('div');
        carCard.className = 'car-card';
        
        if (carType.owned) carCard.classList.add('owned');
        if (index === currentCarIndex) carCard.classList.add('current');
        
        const buttonHtml = carType.owned 
            ? (index === currentCarIndex 
                ? '<button class="select-btn" disabled>Seçili</button>'
                : `<button class="select-btn" onclick="selectCar(${index})">Seç</button>`)
            : `<button class="buy-btn" onclick="buyCar(${index})" ${money < carType.price ? 'disabled' : ''}>
                ${money >= carType.price ? 'Satın Al' : 'Yetersiz Para'}
               </button>`;
        
        carCard.innerHTML = `
            <div class="car-preview" style="background-color: ${carType.color};">
                ${carType.icon}
            </div>
            <div class="car-name">${carType.name}</div>
            <div class="car-stats">
                <span>Hız: ${carType.speed}</span>
                <span>${carType.owned ? '✅ Sahip' : '🔒 Kilitli'}</span>
            </div>
            <div class="car-price">${carType.price === 0 ? 'Ücretsiz' : carType.price + ' 💰'}</div>
            ${buttonHtml}
        `;
        
        carsGrid.appendChild(carCard);
    });
}

// Global fonksiyonlar
window.buyCar = function(index) {
    const carType = carTypes[index];
    if (money >= carType.price && !carType.owned) {
        money -= carType.price;
        carType.owned = true;
        currentCarIndex = index; // Satın alınan arabayı otomatik seç
        updateMoney();
        updateShop();
        updateSpeed(); // Hız göstergesini güncelle
        
        // Canvas'ı güncelle
        if (gameState === 'playing') {
            draw();
        } else {
            drawInitialState();
        }
    }
}

window.selectCar = function(index) {
    if (carTypes[index].owned) {
        currentCarIndex = index;
        updateShop();
        updateSpeed(); // Hız göstergesini güncelle
        
        // Eğer oyun oynanıyorsa canvas'ı güncelle
        if (gameState === 'playing') {
            draw();
        } else {
            // Oyun oynanmıyorsa başlangıç durumunu çiz
            drawInitialState();
        }
    }
}
