import { birdImg, pipeTopImg, pipeBottomImg, bgImg, groundImg, formatTime } from './assets.js';
import { displayTop5, displayLeaderboard, startLeaderboardCountdown, updatePlayerScore, showRestartButton, hideRestartButton } from './ui.js';
import { generateInitialPipes, updatePipes, checkCollisions, drawGame, seededRandom } from './physics.js';

// Connect to the socket.io server
const socket = io({
  secure: true,
  rejectUnauthorized: false
});

// Get DOM elements
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const leaderboardScreen = document.getElementById('leaderboard-screen');
const usernameInput = document.getElementById('username-input');
const startButton = document.getElementById('start-button');
const playerNameElement = document.getElementById('player-name');
const playerScoreElement = document.getElementById('player-score');
const scoresListElement = document.getElementById('scores-list');
const timerElement = document.getElementById('timer');
const fullLeaderboardElement = document.getElementById('full-leaderboard');
const countdownTimerElement = document.getElementById('countdown-timer');

// Create restart button
const restartButton = document.createElement('button');
restartButton.id = 'restart-button';
restartButton.textContent = 'Rejouer';
restartButton.className = 'restart-button';
restartButton.style.display = 'none';
document.getElementById('game-screen').appendChild(restartButton);

// Game state variables
let username = '';
let isGameActive = false;
let score = 0;
let pipes = [];
let lastPipeX = 0;
let seedRandom;
let lastWorldOffset = 0;
let countdownInterval;
let gameState = {
    roundSeed: 0,
    worldOffset: 0
};
const pipeWidth = 50;
const pipeGap = 150;

// Initialize the game
function init() {
    // Event listeners
    startButton.addEventListener('click', handleStartGame);
    document.addEventListener('keydown', handleKeyDown);
    restartButton.addEventListener('click', handleRestart);
    
    // Socket event listeners
    setupSocketListeners();
    
    // Animation loop
    gameLoop();
}

// Handle game start button click
function handleStartGame() {
    username = usernameInput.value.trim();
    if (username.length < 2) {
        alert('Veuillez entrer un pseudo d\'au moins 2 caractères');
        return;
    }
    
    // Send the username to the server
    socket.emit('join_game', username);
    
    // Update UI
    playerNameElement.textContent = username;
    loginScreen.style.display = 'none';
    gameScreen.style.display = 'block';
    isGameActive = true;
}

// Handle key presses
function handleKeyDown(e) {
    if (e.code === 'Space' && isGameActive) {
        socket.emit('jump');
    }
}

// Handle restart button click
function handleRestart() {
    socket.emit('restart');
    hideRestartButton(restartButton);
}

// Setup all socket event listeners
function setupSocketListeners() {
    // Initial game state when joining
    socket.on('game_state', handleGameState);
    
    // Game starts
    socket.on('game_start', handleGameStart);
    
    // Game updates (60fps)
    socket.on('update', handleGameUpdate);
    
    // Show leaderboard at end of round
    socket.on('show_leaderboard', handleShowLeaderboard);
    
    // New round begins
    socket.on('new_round', handleNewRound);
}

// Handle initial game state
function handleGameState(state) {
    gameState.roundSeed = state.seed;
    gameState.worldOffset = state.worldOffset;
    lastWorldOffset = state.worldOffset;
    
    if (state.status === 'playing') {
        seedRandom = seededRandom(state.seed);
        const initialPipes = generateInitialPipes(canvas, seedRandom, state.worldOffset);
        pipes = initialPipes.pipes;
        lastPipeX = initialPipes.lastPipeX;
        
        leaderboardScreen.style.display = 'none';
        gameScreen.style.display = 'block';
    } else if (state.status === 'leaderboard') {
        timerElement.textContent = formatTime(state.timeRemaining);
    }
}

// Handle game start
function handleGameStart() {
    leaderboardScreen.style.display = 'none';
    gameScreen.style.display = 'block';
}

// Handle regular game updates
function handleGameUpdate(data) {
    if (!isGameActive) return;
    
    // Update game state
    gameState.worldOffset = data.gameState.worldOffset;
    
    // Update timer
    timerElement.textContent = formatTime(data.gameState.timeRemaining);
    
    // Update pipes based on world movement
    const pipeUpdate = updatePipes(pipes, canvas, pipeWidth, gameState.worldOffset, lastWorldOffset, seedRandom);
    pipes = pipeUpdate.pipes;
    lastWorldOffset = gameState.worldOffset;
    
    // Update score display from server data
    if (data.players[socket.id]) {
        score = data.players[socket.id].score;
        updatePlayerScore(playerScoreElement, score);
        
        // Show restart button if player died
        if (!data.players[socket.id].alive) {
            showRestartButton(restartButton);
        } else {
            hideRestartButton(restartButton);
        }
    }
    
    // Show top 5 scores
    displayTop5(data.players, scoresListElement);
    
    // Draw the game
    drawGame(
        ctx, 
        data.players, 
        pipes, 
        canvas, 
        birdImg, 
        pipeTopImg, 
        pipeBottomImg, 
        bgImg, 
        groundImg, 
        pipeWidth, 
        pipeGap
    );
    
    // Check for collisions
    if (data.players[socket.id] && data.players[socket.id].alive) {
        const hasCollision = checkCollisions(
            data.players[socket.id], 
            pipes, 
            canvas, 
            pipeWidth, 
            pipeGap
        );
        
        if (hasCollision) {
            socket.emit('dead');
        }
    }
}

// Handle showing the leaderboard at the end of a round
function handleShowLeaderboard(leaderboard) {
    displayLeaderboard(leaderboard, fullLeaderboardElement);
    gameScreen.style.display = 'none';
    leaderboardScreen.style.display = 'flex';
    
    // Clear any existing countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
    }
    
    // Start the countdown for next round
    countdownInterval = startLeaderboardCountdown(countdownTimerElement, 20);
}

// Handle start of a new round
function handleNewRound(data) {
    // Reset game state
    score = 0;
    updatePlayerScore(playerScoreElement, score);
    seedRandom = seededRandom(data.seed);
    gameState.roundSeed = data.seed;
    gameState.worldOffset = 0;
    lastWorldOffset = 0;
    
    // Generate new pipes
    const initialPipes = generateInitialPipes(canvas, seedRandom, 0);
    pipes = initialPipes.pipes;
    lastPipeX = initialPipes.lastPipeX;
    
    // Hide restart button if visible
    hideRestartButton(restartButton);
    
    // Show game screen
    leaderboardScreen.style.display = 'none';
    gameScreen.style.display = 'block';
}

// Main game loop
function gameLoop() {
    requestAnimationFrame(gameLoop);
}

// Start the game when page loads
window.addEventListener('load', init);