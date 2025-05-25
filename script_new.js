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

// Jiroskop kontrolleri
let gyroSupported = false;
let gyroPermission = false;
let gyroData = { beta: 0, gamma: 0 }; // beta: ön-arka, gamma: sağ-sol
let calibrationOffset = { beta: 0, gamma: 0 };
let useGyro = false;
let touchControls = false;

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

// Mobil cihaz algılama
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0);
}

// Jiroskop izni isteme
async function requestGyroPermission() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        // iOS 13+ için izin isteme
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                gyroPermission = true;
                return true;
            }
        } catch (error) {
            console.log('Jiroskop izni reddedildi:', error);
        }
    } else if (window.DeviceOrientationEvent) {
        // Android ve eski iOS için
        gyroPermission = true;
        return true;
    }
    return false;
}

// Jiroskop desteğini kontrol etme
function checkGyroSupport() {
    gyroSupported = window.DeviceOrientationEvent !== undefined;
    return gyroSupported;
}

// Jiroskop event listener'ları
function setupGyroControls() {
    if (!gyroSupported || !gyroPermission) return;
    
    window.addEventListener('deviceorientation', handleGyroData);
    console.log('Jiroskop kontrolleri aktif edildi');
}

// Jiroskop verilerini işleme
function handleGyroData(event) {
    if (!useGyro || gameState !== 'playing') return;
    
    gyroData.beta = event.beta || 0;   // ön-arka eğim (-180 ile 180 arası)
    gyroData.gamma = event.gamma || 0; // sağ-sol eğim (-90 ile 90 arası)
    
    // Kalibrasyon offset'ini uygula
    const adjustedGamma = gyroData.gamma - calibrationOffset.gamma;
    
    // Eğim değerini araba hareketine dönüştür (-15 ile +15 derece arası optimal)
    const sensitivity = 2.5;
    const maxTilt = 15;
    
    if (Math.abs(adjustedGamma) > 2) { // Dead zone - küçük titreşimleri yok say
        const normalizedTilt = Math.max(-maxTilt, Math.min(maxTilt, adjustedGamma));
        const movement = (normalizedTilt / maxTilt) * sensitivity;
        
        // Arabayı hareket ettir (yol kenarları 100px + 20px margin)
        car.x += movement;
        car.x = Math.max(120, Math.min(canvas.width - car.width - 120, car.x));
    }
}

// Jiroskop kalibrasyonu
function calibrateGyro() {
    if (gyroData.gamma !== undefined) {
        calibrationOffset.gamma = gyroData.gamma;
        calibrationOffset.beta = gyroData.beta;
        console.log('Jiroskop kalibre edildi:', calibrationOffset);
        showMessage('Jiroskop kalibre edildi!');
    }
}

// Touch kontrolleri
function setupTouchControls() {
    if (!isMobileDevice()) return;
    
    touchControls = true;
    
    // Touch start
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        
        // Ekranın sol yarısına dokunma = sola git
        // Ekranın sağ yarısına dokunma = sağa git
        if (touchX < canvas.width / 2) {
            keys['ArrowLeft'] = true;
        } else {
            keys['ArrowRight'] = true;
        }
    });
    
    // Touch end
    canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        keys['ArrowLeft'] = false;
        keys['ArrowRight'] = false;
    });
    
    // Touch move
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        
        // Continuous movement based on touch position
        const centerX = canvas.width / 2;
        const maxDistance = canvas.width / 2;
        const distance = touchX - centerX;
        const normalizedDistance = Math.max(-1, Math.min(1, distance / maxDistance));
        
        // Arabayı dokunulan pozisyona doğru hareket ettir
        const targetX = touchX - car.width / 2;
        const currentX = car.x;
        const diff = targetX - currentX;
          if (Math.abs(diff) > 5) {
            car.x += diff * 0.1; // Smooth movement
            car.x = Math.max(120, Math.min(canvas.width - car.width - 120, car.x));
        }
    });
    
    console.log('Touch kontrolleri aktif edildi');
}

// Mesaj gösterme fonksiyonu
function showMessage(text) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = text;
    messageDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 10px;
        z-index: 1000;
        font-size: 16px;
    `;
    
    document.body.appendChild(messageDiv);
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 2000);
}

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

    // Canvas boyutlarını ayarla
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mobil cihaz kontrolü ve kurulum
    if (isMobileDevice()) {
        console.log('Mobil cihaz algılandı');
        setupTouchControls();
        
        // Jiroskop desteğini kontrol et
        if (checkGyroSupport()) {
            console.log('Jiroskop desteği mevcut');
            // Jiroskop butonunu ekle
            addGyroControls();
        }
    }

    // Event listeners
    document.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });

    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    shopBtn.addEventListener('click', () => {
        // Sadece oyun oynanırken dükkanı aç
        if (gameState === 'playing') {
            openShop();
        }
    });
    closeShopBtn.addEventListener('click', closeShop);

    // İlk durumu ayarla
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
    
    // Yol çizgilerini oluştur
    resetRoadLines();
    
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
    // 800px genişlik için şerit pozisyonları (yol kenarları 100px)
    const lanes = [150, 250, 350, 450, 550, 650];
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
    
    // Yol kenarları (100px her yanında)
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, 100, canvas.height);
    ctx.fillRect(canvas.width - 100, 0, 100, canvas.height);
    
    // Orta yol çizgisi
    ctx.fillStyle = '#f39c12';
    roadLines.forEach(line => {
        ctx.fillRect(line.x, line.y, line.width, line.height);
    });
    
    // Şerit çizgileri (100px aralıklarla)
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
    
    // Araba kontrolü (yol kenarları 100px)
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

// Canvas boyutlarını responsive yapmak
function resizeCanvas() {
    // Canvas boyutlarını sabit tut - responsive bozulmasını önle
    canvas.width = 800;
    canvas.height = 600;
    
    // Araba pozisyonunu yeniden ayarla
    car.x = (canvas.width - car.width) / 2;
    car.y = canvas.height - car.height - 50;
    
    // Yol çizgilerini yeniden oluştur
    resetRoadLines();
}

// Yol çizgilerini yeniden oluşturma fonksiyonu
function resetRoadLines() {
    roadLines = [];
    for (let i = 0; i < canvas.height; i += 60) {
        roadLines.push({
            x: canvas.width / 2 - 2,
            y: i,
            width: 4,
            height: 30
        });
    }
}

// Jiroskop kontrol butonlarını ekle
function addGyroControls() {
    const controlsDiv = document.createElement('div');
    controlsDiv.id = 'gyroControls';
    controlsDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 10px;
        z-index: 1000;
        flex-wrap: wrap;
        justify-content: center;
    `;
    
    // Jiroskop aktif/pasif butonu
    const gyroToggleBtn = document.createElement('button');
    gyroToggleBtn.textContent = 'Jiroskop Kapalı';
    gyroToggleBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: 2px solid rgba(255, 255, 255, 0.3);
        color: white;
        padding: 8px 12px;
        border-radius: 25px;
        font-size: 12px;
        cursor: pointer;
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
    `;
    
    gyroToggleBtn.addEventListener('click', async () => {
        if (!useGyro) {
            // Jiroskop izni isteme
            const permissionGranted = await requestGyroPermission();
            if (permissionGranted) {
                useGyro = true;
                setupGyroControls();
                gyroToggleBtn.textContent = 'Jiroskop Açık';
                gyroToggleBtn.style.background = 'rgba(76, 175, 80, 0.3)';
                showMessage('Jiroskop kontrolleri aktif! Telefonunuzu eğerek yönlendirin.');
            } else {
                showMessage('Jiroskop izni gerekli!');
            }
        } else {
            useGyro = false;
            gyroToggleBtn.textContent = 'Jiroskop Kapalı';
            gyroToggleBtn.style.background = 'rgba(255, 255, 255, 0.2)';
            showMessage('Jiroskop kontrolleri kapatıldı.');
        }
    });
    
    // Kalibrasyon butonu
    const calibrateBtn = document.createElement('button');
    calibrateBtn.textContent = 'Kalibre Et';
    calibrateBtn.style.cssText = gyroToggleBtn.style.cssText;
    calibrateBtn.addEventListener('click', () => {
        if (useGyro) {
            calibrateGyro();
        } else {
            showMessage('Önce jiroskopu aktif edin!');
        }
    });
    
    controlsDiv.appendChild(gyroToggleBtn);
    controlsDiv.appendChild(calibrateBtn);
    document.body.appendChild(controlsDiv);
}
