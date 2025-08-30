const baseHammerElement = document.getElementById("hammer");
const enemySpawnZone = document.getElementById("enemy-spawn-zone");
const mainTextArea = document.querySelector("main");

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


    const MAXIMUM_MAX_ENEMY_BURST = 3;
    const LOSE_ENEMY_COUNT = 30;

    const START_ENEMY_SPAWN_DELAY = 1700;
    const MIN_ENEMY_SPAWN_DELAY = 1000;

    const ENEMY_SPAWN_DELAY_DECREASE = 80;

    const ENEMY_SPAWN_DELAY_RANDOMNESS_RANGE = 300;

    let enemySpawnDelay = START_ENEMY_SPAWN_DELAY;

    let enemies = [];
    let enemiesCount = 0;

    let maxEnemyBurstCount = 3;

    let enemiesKilled = 0;

    let enemyBurstSpawnIncreaseFactor = 2; // How many kills the player has to get before max enemies increase
    let enemySpawnIncreaseFactor = 6;

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

    gameUI.style.display = "block";


    function UpdateEnemyUI() {
        enemyUI.innerText = enemiesCount;

        if (enemiesCount >= 20) {
            // Make red depending on enemy count \\
            // Normalize value to 0-1
            const t = (enemiesCount - 20) / (LOSE_ENEMY_COUNT - 20);

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
                    // Death Animation \\
                    enemy.classList.add("death")
                    setTimeout(() => {
                        enemy.remove()
                    }, 1000)

                    // Remove elsewhere \\
                    enemies.splice(i, 1);

                    enemiesCount--;
                    UpdateEnemyUI();

                    enemiesKilled++;
                }

                // Enemy logic \\
                switch (enemyType) {
                    case "brute": {
                        const lives = Number(enemy.dataset.lives);

                        if (lives <= 1) {
                            enemy.classList.remove("hit");
                            KillEnemy()
                        } else {
                            enemy.dataset.lives = lives - 1;
                            enemy.classList.add("hit");
                            setTimeout(() => {
                                enemy.classList.remove("hit");
                            }, 1000)
                        }
                        break
                    }
                    case "glass": {
                        EndGame("glass");
                        break
                    }
                    default: {
                        KillEnemy()
                    }
                }

                // Increase difficulty \\
                if (isMultiple(enemiesKilled, Math.floor(enemySpawnIncreaseFactor))) {
                    if (enemySpawnDelay > MIN_ENEMY_SPAWN_DELAY) enemySpawnDelay -= ENEMY_SPAWN_DELAY_DECREASE;
                    enemySpawnIncreaseFactor += 0.5;
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
    document.addEventListener("touchstart", UseHammer)

    document.addEventListener("touchend", UseHammer)
    document.addEventListener("mouseup", LiftUpHammer)

    // ##### Enemy Spawning ####
    const enemyTypes = [
        { type: "basic", chance: 60 },
        { type: "brute", chance: 30 },
        { type: "glass", chance: 10 }
    ]

    function SpawnEnemy(disableLogic, typeOverride) {
        const enemy = document.createElement("div");

        enemy.classList.add("enemy");
        // Get Enemy type
        let type;

        if (!typeOverride) {
            const randomPercent = Math.random() * 100;
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

        UpdateEnemyUI()

        // Enemy logic \\
        if (disableLogic) return; // Exit early if logic is disabled

        enemy.dataset.type = type;

        switch (type) {
            case "brute": {
                enemy.dataset.lives = 2;
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


    function EndGame(enemyTypeAnimationOverride) {
        // Player has lost! \\
        console.log("Game over!");

        stopSpawning = true;

        // Remove events \\
        document.removeEventListener("mousedown", UseHammer)
        document.removeEventListener("touchstart", UseHammer)

        document.removeEventListener("touchend", UseHammer)
        document.removeEventListener("mouseup", LiftUpHammer)



        // Spawn a ton of enemies for death animation \\
        SpawnEnemy(true, enemyTypeAnimationOverride)

        for (let i = 0; i < 300; i++) {
            setTimeout(() => {
                SpawnEnemy(true, enemyTypeAnimationOverride)
            }, (5 * i) + 1000)
        }

        setTimeout(() => {
            // Revert to start \\
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
        }, 5 * 300 + 1100)
    }

}

