import {getCookie, setCookie, checkCookie } from "../cookieManager.js"


const baseHammerElement = document.getElementById("hammer");
const enemySpawnZone = document.getElementById("enemy-spawn-zone");
const mainTextArea = document.querySelector("main");
const highScoreUI = document.getElementById("high-score");

let hammer = null;

function MoveHammerToCursor(x, y) {
    hammer.style.top = `${y}px`;
    hammer.style.left = `${x}px`;
}

baseHammerElement.addEventListener("click", e => {
    // Change cursor \\
    document.body.style.cursor = `crosshair`;

    // Create hammer \\
    hammer = baseHammerElement.cloneNode();
    hammer.id = "hammer-dragging";

    document.body.appendChild(hammer);

    MoveHammerToCursor(e.clientX, e.clientY)
    // Hide base hammer \\
    baseHammerElement.style.opacity = "0";
    baseHammerElement.style.pointerEvents = "none";

    StartGame()
})

// Move hammer to mouse \\
document.addEventListener("mousemove", e => {
    if (!hammer) return; // Exit if user isn't dragging the hammer

    MoveHammerToCursor(e.clientX, e.clientY)
})

// High score setup \\
function addCommasToNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function UpdateHighScore(score) {
    highScoreUI.innerText = `Best: ${addCommasToNumber(score)}`;
    setCookie("hammer-game-high-score", score)
}

const highScoreExists = checkCookie("hammer-game-high-score");
let highScore = 0;

if (highScoreExists) {
    highScoreUI.style.display = "block";

    highScore = Number(getCookie("hammer-game-high-score"));

    UpdateHighScore(highScore);
} else {
    highScoreUI.style.display = "none";
}

// #### Game #### \\
function isMultiple(num, multiple) {
    let remainder = num % multiple;

    return (remainder === 0) // returns true if is a multiple
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function posInRect(rect, x, y) {
    return (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
    );
}

function GetRandomPos() {
    const spawnRect = enemySpawnZone.getBoundingClientRect();
    const mainAreaRect = mainTextArea.getBoundingClientRect();

    let spawnPosX, spawnPosY;
    let safe = false;

    // Make sure that area is safe to spawn in (not being covered by main text area)
    while (!safe) {
        const randomX = getRandomInt(spawnRect.left, spawnRect.right);
        const randomY = getRandomInt(spawnRect.top, spawnRect.bottom);

        // Use posInRect to check if the random position is inside the main area
        if (!posInRect(mainAreaRect, randomX, randomY)) {
            spawnPosX = randomX - spawnRect.left; // relative to enemySpawnZone
            spawnPosY = randomY - spawnRect.top;
            safe = true;
        }
    }

    return { x: spawnPosX, y: spawnPosY };
}

function StartGame() {
    // Game Setup \\
    console.log("started game!")

    mainTextArea.classList.add("no-select");

    function endGameOnResize() {
        EndGame(true)
    }

    window.addEventListener("resize", endGameOnResize);

    const MAXIMUM_MAX_ENEMY_BURST = 3;
    const LOSE_ENEMY_COUNT = 20;
    const ENEMY_COUNT_RED_START = 10; // Number that the enemy count will start getting red at (to indicate that the player is near the death count)

    const START_ENEMY_SPAWN_DELAY = 1700;
    const MIN_ENEMY_SPAWN_DELAY = 800;

    const ENEMY_SPAWN_DELAY_DECREASE = 20;

    const ENEMY_SPAWN_DELAY_RANDOMNESS_RANGE = 300;

    let enemySpawnDelay = START_ENEMY_SPAWN_DELAY;

    let enemies = [];
    let enemiesCount = 0;

    let maxEnemyBurstCount = 3;

    let enemiesKilled = 0;

    let enemyBurstSpawnIncreaseFactor = 2; // How many kills the player has to get before max enemies increase
    let enemySpawnIncreaseFactor = 6;

    let score = 0;

    let quadCanSpawn = false;

    // Dev Stats \\
    const killsDevStats = document.getElementById("dev-stats-kills")
    const burstDevStats = document.getElementById("dev-stats-burst")
    const burstIncreaseFactorDevStats = document.getElementById("dev-stats-burstIncreaseFactor")
    const spawnIncreaseFactorDevStats = document.getElementById("dev-stats-spawnIncreaseFactor")
    const spawnDelayDevStats = document.getElementById("dev-stats-spawnDelay")

    //eslint-disable-next-line
    function runDevStatsUpdater() {
        killsDevStats.innerText = `Kills: ${enemiesKilled}`;
        spawnDelayDevStats.innerText = `Spawn Delay: ${enemySpawnDelay}`;

        burstDevStats.innerText = `Max Burst Count: ${maxEnemyBurstCount}`;
        spawnIncreaseFactorDevStats.innerText = `Spawn Increase Factor: ${enemySpawnIncreaseFactor}`;
        burstIncreaseFactorDevStats.innerText = `Burst Increase Factor: ${enemyBurstSpawnIncreaseFactor}`;

        setTimeout(runDevStatsUpdater, 100)

    }
    //runDevStatsUpdater()

    // ### UI ### \\
    const gameUI = document.getElementById("game-ui");
    const enemyUI = document.getElementById("enemy-count");
    const scoreUI = document.getElementById("score");

    gameUI.style.display = "block";


    function UpdateUI() {
        enemyUI.innerText = enemiesCount;
        scoreUI.innerText = `Score: ${addCommasToNumber(score)}`;

        if (score > highScore) {
            UpdateHighScore(score)
            highScoreUI.style.display = "block";
        }

        if (enemiesCount >= ENEMY_COUNT_RED_START) {
            // Make red depending on enemy count \\
            // Normalize value to 0-1
            const t = (enemiesCount - ENEMY_COUNT_RED_START) / (LOSE_ENEMY_COUNT - ENEMY_COUNT_RED_START);

            // Define start and end colors
            const startColor = { r: 255, g: 255, b: 255 }; // White
            const endColor = { r: 255, g: 0, b: 0 }; // Red

            const r = Math.round(startColor.r + (endColor.r - startColor.r) * t);
            const g = Math.round(startColor.g + (endColor.g - startColor.g) * t);
            const b = Math.round(startColor.b + (endColor.b - startColor.b) * t);

            enemyUI.style.color = `rgb(${r},${g},${b})`
        }
    }
    // #### Hammer #### \\
    // Use Hammer \\
    function UseHammer(e) {
        let mouseX, mouseY;

        if (e.cancelable) e.preventDefault(); // stops mouse event if on mobile

        if (e instanceof TouchEvent) {
            mouseX = e.touches[0].clientX;
            mouseY = e.touches[0].clientY
        } else {
            mouseX = e.clientX;
            mouseY = e.clientY;
        }

        MoveHammerToCursor(mouseX, mouseY)

        hammer.classList.add("hitting");

        // Check if hitting an enemy \\
        for (const [i, enemy] of enemies.entries()) {
            if (posInRect(enemy.getBoundingClientRect(), mouseX, mouseY)) {
                // ##### Hammer has hit enemy ##### \\
                const enemyType = enemy.dataset.type;

                function KillEnemy() {
                    // Add to score \\
                    const scoreReward = Number(enemy.dataset.deathScore);

                    console.log(scoreReward);
                    score += scoreReward;
                    // ui is updated in later line

                    // Death Animation \\
                    enemy.classList.add("death")
                    setTimeout(() => {
                        enemy.remove()
                    }, 1000)

                    // Remove elsewhere \\
                    enemies.splice(i, 1);

                    enemiesCount--;
                    enemiesKilled++;
                
                    UpdateUI();
                }

                // Enemy logic \\
                switch (enemyType) {
                    case "brute":
                    case "quad": {
                        const lives = Number(enemy.dataset.lives);

                        if (lives <= 1) {
                            enemy.classList.remove("hit");
                            KillEnemy()
                        } else {
                            const newLives = lives - 1
                            enemy.dataset.lives = newLives;
                            enemy.classList.remove("hit");
                            setTimeout(() => {
                                enemy.classList.add("hit");
                            }, 0) // Queue for next frame

                            setTimeout(() => {
                                if (enemy.dataset.lives === newLives) {
                                    // Only remove hit animation if enemy hasn't been hit afterwards
                                    // Otherwise, the hit animation will cancel
                                    enemy.classList.remove("hit");
                                }

                            }, 1000)

                            // Add points per hit for quad \\
                            if (enemyType === "quad") {
                                const scoreReward = Number(enemy.dataset.deathScore);

                                score += scoreReward;
                                UpdateUI()
                            }
                        }
                        break
                    }
                    case "glass": {
                        EndGame(false, "glass");
                        break
                    }
                    default: {
                        KillEnemy()
                    }
                }

                // Add quad type if score is high enough \\
                const QUAD_SPAWN_SCORE = 15000;

                if (score > QUAD_SPAWN_SCORE && !quadCanSpawn) {
                    quadCanSpawn = true;
                    enemyTypes.push({type: "quad", chance: 6})
                }

                // Increase difficulty \\
                if (isMultiple(enemiesKilled, Math.floor(enemySpawnIncreaseFactor))) {
                    if (enemySpawnDelay > MIN_ENEMY_SPAWN_DELAY) enemySpawnDelay -= ENEMY_SPAWN_DELAY_DECREASE;
                    enemySpawnIncreaseFactor += 1.5;
                }

                if (isMultiple(maxEnemyBurstCount, Math.floor(enemyBurstSpawnIncreaseFactor))) {
                    if (maxEnemyBurstCount < MAXIMUM_MAX_ENEMY_BURST) maxEnemyBurstCount++;
                    enemyBurstSpawnIncreaseFactor += 3;
                }
            }
        }
    }

    function LiftUpHammer() {
        hammer.classList.remove("hitting");
    }

    document.addEventListener("mousedown", UseHammer)
    document.addEventListener("touchstart", UseHammer, {passive: false})

    document.addEventListener("touchend", LiftUpHammer, {passive: false})
    document.addEventListener("mouseup", LiftUpHammer)

    // ##### Enemy Spawning ####
    let enemyTypes = [
        { type: "basic", chance: 60 },
        { type: "brute", chance: 30 },
        { type: "glass", chance: 10 }
    ]
    const enemyScores = {
        "basic": 100,
        "brute": 200,
        "glass": 0,
        "quad": 250,
    }

    function SpawnEnemy(disableLogic, typeOverride) {
        const enemy = document.createElement("div");

        enemy.classList.add("enemy");
        // Get Enemy type
        let type;

        if (!typeOverride) {
            const totalChance = enemyTypes.reduce((sum, e) => sum + e.chance, 0);
            const randomPercent = Math.random() * totalChance;
            let cumulative = 0;

            for (const enemy of enemyTypes) {
                cumulative += enemy.chance;
                if (randomPercent < cumulative) {
                    type = enemy.type;
                    break;
                }
            }

        } else type = typeOverride;

        enemy.classList.add(type);

        // Set position \\
        const pos = GetRandomPos();

        enemy.style.top = `${pos.y}px`;
        enemy.style.left = `${pos.x}px`;

        enemySpawnZone.appendChild(enemy);

        enemies.push(enemy);

        if (type !== "glass") enemiesCount++;

        UpdateUI()

        // Enemy logic \\
        if (disableLogic) return; // Exit early if logic is disabled

        const deathScore = enemyScores[type];

        enemy.dataset.type = type;
        enemy.dataset.deathScore = deathScore;

        switch (type) {
            case "brute": {
                enemy.dataset.lives = 2;
                break;
            }
            case "quad": {
                enemy.dataset.lives = 4;
                break;
            }
            case "glass": {
                // Remove after 10 seconds \\
                setTimeout(() => {
                    enemy.classList.add("death")
                    setTimeout(() => {
                        enemy.remove();
                    }, 1000)
                }, 10000)
                break
            }
        }
    }

    let stopSpawning = false;

    function SpawnEnemyTimeout() {
        if (stopSpawning) return;

        if (enemiesCount < LOSE_ENEMY_COUNT - 1) {
            SpawnEnemy();

            // Enemy burst spawning \\
            // Spawn enemies in "bursts", as in a few in quick sucession if allowed
            if (getRandomInt(1, 3) === 3 && !stopSpawning) {
                console.log("burst spawn")
                for (let i = 1; i < getRandomInt(1, maxEnemyBurstCount); i++) {
                    setTimeout(() => {
                        if (enemiesCount < LOSE_ENEMY_COUNT - 1 && !stopSpawning) {
                            SpawnEnemy()
                        }
                    }, 1200 * i)
                }
            }
            setTimeout(SpawnEnemyTimeout, getRandomInt(
                enemySpawnDelay - ENEMY_SPAWN_DELAY_RANDOMNESS_RANGE,
                enemySpawnDelay
            ));
        } else {
            EndGame()
        }
    }

    SpawnEnemyTimeout()


    function EndGame(dontAnimate = false, enemyTypeAnimationOverride) {
        // Player has lost! \\
        console.log("Game over!");

        stopSpawning = true;

        // Remove events \\
        document.removeEventListener("mousedown", UseHammer)
        document.removeEventListener("touchstart", UseHammer, {passive: false})

        document.removeEventListener("touchend", LiftUpHammer, {passive: false})
        document.removeEventListener("mouseup", LiftUpHammer)

        window.removeEventListener("resize", endGameOnResize)

        function RevertToStart() {
            // Reset hammer \\
            hammer.remove();
            baseHammerElement.style.opacity = "1";
            baseHammerElement.style.pointerEvents = "all";


            // Remove enemies \\
            const enemiesToRemove = Array.from(enemySpawnZone.children);

            enemiesToRemove.forEach(enemy => enemy.classList.add("death"));

            setTimeout(() => {
                enemiesToRemove.forEach(enemy => enemy.remove());
            }, 2000);

            // Other \\
            mainTextArea.classList.remove("no-select");
            document.body.style.cursor = "auto";

            gameUI.style.display = "none";

            enemyUI.style.color = "";
        }

        // #### Animation #####
        if (!dontAnimate) {
            // Spawn a ton of enemies for death animation \\
            SpawnEnemy(true, enemyTypeAnimationOverride)

            for (let i = 0; i < 300; i++) {
                setTimeout(() => {
                    SpawnEnemy(true, enemyTypeAnimationOverride)
                }, (5 * i) + 1000)
            }

            setTimeout(RevertToStart, 5 * 300 + 1000)
        } else RevertToStart();
        
    }

}

