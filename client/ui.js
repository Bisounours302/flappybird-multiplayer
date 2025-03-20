// UI-related functions for the game

// Display the top 5 players by score
function displayTop5(players, scoresListElement) {
    const sortedPlayers = Object.values(players)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
    
    let html = '';
    sortedPlayers.forEach((player, index) => {
        html += `<div class="score-item">
            <span>${index + 1}. ${player.username}</span>
            <span>${player.score}</span>
        </div>`;
    });
    
    scoresListElement.innerHTML = html;
}

// Display the complete leaderboard
function displayLeaderboard(leaderboard, fullLeaderboardElement) {
    let html = '';
    leaderboard.forEach((player, index) => {
        html += `<div class="leaderboard-item">
            <span>${index + 1}. ${player.username}</span>
            <span>${player.score}</span>
        </div>`;
    });
    
    fullLeaderboardElement.innerHTML = html;
}

// Start leaderboard countdown
function startLeaderboardCountdown(countdownElement, seconds) {
    countdownElement.textContent = seconds;
    
    const countdownInterval = setInterval(() => {
        seconds--;
        countdownElement.textContent = seconds;
        if (seconds <= 0) {
            clearInterval(countdownInterval);
        }
    }, 1000);
    
    return countdownInterval;
}

// Update player's displayed score
function updatePlayerScore(scoreElement, score) {
    scoreElement.textContent = `Score: ${score}`;
}

// Toggle screens visibility
function showScreen(screenToShow, screensToHide) {
    screenToShow.style.display = screenToShow === 'game-screen' ? 'block' : 'flex';
    
    screensToHide.forEach(screen => {
        screen.style.display = 'none';
    });
}

export { 
    displayTop5, 
    displayLeaderboard, 
    startLeaderboardCountdown, 
    updatePlayerScore,
    showScreen
};
