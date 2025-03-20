import { birdImg, pipeTopImg, pipeBottomImg, bgImg, groundImg, seededRandom, formatTime } from './assets.js';
import { displayTop5, displayLeaderboard, startLeaderboardCountdown, updatePlayerScore, showScreen } from './ui.js';
import { generateInitialPipes, updatePipes, checkCollisions, drawGame } from './physics.js';

// Connect to the socket.io server
const socket = io();

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

// Game state variables
let username = '';
let isGameActive = false;
let score = 0;
let pipes = [];
let lastPipeX = 0;
let seedRandom;
let countdownInterval;
const pipeWidth = 50;
const pipeGap = 150;
const pipeSpeed = 2;

// Initialize the game
function init() {
    // Event listeners
    startButton.addEventListener('click', handleStartGame);
    document.addEventListener('keydown', handleKeyDown);
    
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
    if (state.status === 'playing') {
        seedRandom = seededRandom(state.seed);
        const initialPipes = generateInitialPipes(canvas, seedRandom);
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
function handleGameUpdate(gameState) {
    if (!isGameActive) return;
    
    // Update timer
    timerElement.textContent = formatTime(gameState.gameState.timeRemaining);
    
    // Update pipes and check for score increment
    const pipeUpdate = updatePipes(pipes, canvas, pipeWidth, pipeSpeed, seedRandom);
    pipes = pipeUpdate.pipes;
    
    // If score increased, update it
    if (pipeUpdate.scoreIncrement > 0 && gameState.players[socket.id] && gameState.players[socket.id].alive) {
        score += pipeUpdate.scoreIncrement;
        updatePlayerScore(playerScoreElement, score);
        socket.emit('update_score', score);
    }
    
    // Show top 5 scores
    displayTop5(gameState.players, scoresListElement);
    
    // Draw the game
    drawGame(
        ctx, 
        gameState.players, 
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
    if (gameState.players[socket.id] && gameState.players[socket.id].alive) {
        const hasCollision = checkCollisions(
            gameState.players[socket.id], 
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
    
    // Generate new pipes
    const initialPipes = generateInitialPipes(canvas, seedRandom);
    pipes = initialPipes.pipes;
    lastPipeX = initialPipes.lastPipeX;
    
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