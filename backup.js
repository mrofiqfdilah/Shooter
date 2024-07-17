document.addEventListener('DOMContentLoaded', () => {
    const instructionButton = document.querySelector('.instruk');
    const instructionBox = document.getElementById('instructionBox');
    const closeInstructionButton = document.querySelector('.close');

    instructionButton.addEventListener('click', () => {
        instructionBox.style.display = 'block';
        gameContainer.style.transform = 'translateX(-50%)';
    });

    closeInstructionButton.addEventListener('click', () => {
        instructionBox.style.display = 'none';
        gameContainer.style.transform = 'translateX(0)';
    });
});

function canvas() {
    const username = document.getElementById("username").value;
    const level = document.getElementById("level").value;
    const selectedGun = document.querySelector('.gun-checkbox:checked');
    const selectedTarget = document.querySelector('.target-checkbox:checked');

    if (!username) {
        alert('Please enter a username.');
        return;
    }

    if (level === 'Select Level') {
        alert('Please select a level.');
        return;
    }

    if (!selectedGun) {
        alert('Please select one gun.');
        return;
    }

    if (!selectedTarget) {
        alert('Please select one target.');
        return;
    }

    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");

    canvas.width = 1000;
    canvas.height = 600;

    var backgroundImage = new Image();
    backgroundImage.src = 'Sprites/background.jpg';
    var gunImg = new Image();
    gunImg.src = `Sprites/${selectedGun.value}.png`;
    var targetImg = new Image();
    targetImg.src = `Sprites/${selectedTarget.value}.png`;
    var boomImg = new Image();
    boomImg.src = 'Sprites/boom.png';

    // Preload images
    Promise.all([loadImage(backgroundImage), loadImage(gunImg), loadImage(targetImg), loadImage(boomImg)]).then(() => {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        let score = 0;
        let gameTime;
        let isPaused = false;
        let targets = [];
        let timerInterval;
        let countdownInterval;

        // Pause overlay setup
        const pauseOverlay = document.createElement('div');
        pauseOverlay.style.position = 'absolute';
        pauseOverlay.style.top = 0;
        pauseOverlay.style.left = 0;
        pauseOverlay.style.width = '100%';
        pauseOverlay.style.height = '100%';
        pauseOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        pauseOverlay.style.color = 'white';
        pauseOverlay.style.fontSize = '30px';
        pauseOverlay.style.display = 'flex';
        pauseOverlay.style.justifyContent = 'center';
        pauseOverlay.style.alignItems = 'center';
        pauseOverlay.style.display = 'none';
        pauseOverlay.innerText = 'Game Is Paused, press ESC to Resume';
        document.body.appendChild(pauseOverlay);

        if (level === 'easy') {
            gameTime = 30;
        } else if (level === 'medium') {
            gameTime = 20;
        } else if (level === 'hard') {
            gameTime = 15;
        }

        const pointer = document.getElementById("pointer");
        pointer.style.display = 'block';
        pointer.style.position = 'absolute';
        pointer.style.cursor = 'none';

        function drawTarget(x, y) {
            ctx.drawImage(targetImg, x, y, 100, 100);
        }

        function generateRandomPosition() {
            const x = Math.random() * (canvas.width - 50);
            const y = Math.random() * (canvas.height - 50);
            return { x, y };
        }

        function addRandomTarget() {
            if (!isPaused) {
                const position = generateRandomPosition();
                drawTarget(position.x, position.y);
                targets.push(position);
            }
        }

        // Generate and draw three random targets initially
        for (let i = 0; i < 3; i++) {
            addRandomTarget();
        }

        setInterval(addRandomTarget, 3000);

        const countdownElement = document.getElementById('countdown');
        countdownElement.style.display = 'block';

        let countdown = 3;

        countdownInterval = setInterval(() => {
            countdownElement.textContent = countdown;
            countdown--;

            if (countdown < 0) {
                clearInterval(countdownInterval);
                countdownElement.style.display = 'none';

                const timerElement = document.getElementById('timer');
                timerElement.style.display = 'block';

                timerInterval = setInterval(() => {
                    if (!isPaused) {
                        gameTime--;
                        timerElement.textContent = `Time left: ${gameTime}s`;

                        if (gameTime <= 0) {
                            clearInterval(timerInterval);
                            showGameOverPopup(username, score);
                        }
                    }
                }, 1000);

                document.addEventListener('mousemove', (e) => {
                    if (!isPaused) {
                        const rect = canvas.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;

                        // Update pointer position
                        pointer.style.left = `${x}px`;
                        pointer.style.top = `${y}px`;

                        // Clear and redraw canvas
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                        targets.forEach((target) => drawTarget(target.x, target.y));

                        const gunWidth = gunImg.width * 0.7;
                        const gunHeight = gunImg.height * 0.7;
                        const gunX = x - gunWidth / 2 + 300;
                        const gunY = y - gunHeight / 2 + 200;

                        ctx.drawImage(gunImg, gunX, gunY, gunWidth, gunHeight);

                        // Draw transparent box for information
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.fillRect(0, 0, canvas.width, 50);

                        // Draw username, score, and time
                        ctx.font = 'bold 20px Arial';
                        ctx.fillStyle = 'white';
                        ctx.fillText(`Username : ${username}`, 40, 30);
                        ctx.fillText(`Score : ${score}`, canvas.width / 2 - 50, 30);
                        ctx.fillText(`Time : ${gameTime}`, canvas.width - 150, 30);
                    }
                });

                canvas.style.cursor = 'none';

                document.addEventListener('click', (e) => {
                    if (!isPaused) {
                        const rect = canvas.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        let hit = false;

                        for (let i = 0; i < targets.length; i++) {
                            const targetX = targets[i].x;
                            const targetY = targets[i].y;
                            if (x >= targetX && x <= targetX + 50 && y >= targetY && y <= targetY + 50) {
                                hit = true;
                                ctx.drawImage(boomImg, targetX, targetY, 100, 100);
                                setTimeout(() => {
                                    ctx.clearRect(targetX, targetY, 100, 100);
                                    targets.splice(i, 1);
                                    score += 10;
                                }, 200);
                                break;
                            }
                        }

                        if (!hit) {
                            score -= 5;
                        }

                        // Update score display
                        ctx.clearRect(0, 0, canvas.width, 50);
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.fillRect(0, 0, canvas.width, 50);
                        ctx.font = 'bold 20px Arial';
                        ctx.fillStyle = 'white';
                        ctx.fillText(`Username : ${username}`, 40, 30);
                        ctx.fillText(`Score : ${score}`, canvas.width / 2 - 50, 30);
                        ctx.fillText(`Time : ${gameTime}`, canvas.width - 150, 30);

                        if (gameTime <= 0) {
                            clearInterval(timerInterval);
                            showGameOverPopup(username, score);
                        }
                    }
                });
            }
        }, 1000);

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                isPaused = !isPaused;
                pauseOverlay.style.display = isPaused ? 'flex' : 'none';
            }
        });
    });

    canvas.style.display = 'block';
    document.getElementById("gameContainer").style.display = 'none';
    document.getElementById("timer").style.display = 'none';
    document.getElementById("history").style.display = 'block';
}

function loadImage(image) {
    return new Promise((resolve) => {
        image.onload = resolve;
    });
}

function showGameOverPopup(username, score) {
    const gameOverPopup = document.createElement('div');
    gameOverPopup.classList.add('popup-container');

    gameOverPopup.innerHTML = `
        <div class="popup-inner">
            <h1 class="popup-title">Game Over !</h1>
            <p class="popup-text">Username: <span>${username}</span></p>
            <p class="popup-text">Score: <span>${score}</span></p>
            <div class="popup-buttons">
                <button id="restartButton" class="popup-button restart">Restart Game</button>
                <button id="saveButton" class="popup-button save">Save Match</button>
            </div>
        </div>
    `;

    document.body.appendChild(gameOverPopup);

    document.getElementById('restartButton').addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('saveButton').addEventListener('click', () => {
        saveScore(username, score);
        gameOverPopup.style.display = 'none';
    });
    
}

function saveScore(username, score) {
    console.log("Saving score for", username, score);
    let leaderboard = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.push({ username, score });
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard));
    alert('Score saved successfully!');
    console.log("Leaderboard after save:", leaderboard);
    window.location.href = "index.html";
}



// Display leaderboard
const historyElement = document.getElementById('history');
const leaderboardData = JSON.parse(localStorage.getItem('leaderboard')) || [];

// Clear existing leaderboard content
historyElement.innerHTML = '';

// Add column header
const columnHeader = document.createElement('div');
columnHeader.classList.add('column-header');
columnHeader.innerHTML = '<h1>LEADERBOARD</h1><select class="sort"> <option value="">Sort by score</option> <option value="">Sort by name</option> <option value="">Sort by time</option> </select>';
columnHeader.style.textAlign = "center";
historyElement.appendChild(columnHeader);

// Add leaderboard entries
leaderboardData.forEach(entry => {
    const entryElement = document.createElement('div');
    entryElement.classList.add('leaderboard-entry');
    entryElement.innerHTML = `
        <div class="entry-content">
            <p class="enusername">${entry.username}</p>
            <p class="enscore">Score: ${entry.score}</p>
        </div>
        <button class="detail-button">Detail</button>
    `;
    historyElement.appendChild(entryElement);
});
