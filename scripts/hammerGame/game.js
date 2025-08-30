const baseHammerElement = document.getElementById("hammer");
const enemySpawnZone = document.getElementById("enemy-spawn-zone");
const mainTextArea = document.querySelector("main");

let hammer = null;

function MoveHammerToCursor(e) {
    hammer.style.top = `${e.clientY}px`;
    hammer.style.left = `${e.clientX}px`;
}

baseHammerElement.addEventListener("click", e => {
    // Change cursor \\
    document.body.style.cursor = `crosshair`;

    // Create hammer \\
    hammer = baseHammerElement.cloneNode();
    hammer.id = "hammer-dragging";

    document.body.appendChild(hammer);

    MoveHammerToCursor(e)
    // Hide base hammer \\
    baseHammerElement.style.opacity = "0";
    baseHammerElement.style.pointerEvents = "none";

    StartGame()
})

// Move hammer to mouse \\
document.addEventListener("mousemove", e => {
    if (!hammer) return; // Exit if user isn't dragging the hammer

    MoveHammerToCursor(e)
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

    return {x: spawnPosX, y: spawnPosY};
}

function StartGame() {
    // Game Setup \\
    console.log("started game!")

    mainTextArea.classList.add("no-select");

    const MAXIMUM_MAX_ENEMY_BURST = 5;
    const LOSE_ENEMY_COUNT = 30;
    
    const START_ENEMY_SPAWN_DELAY = 2000;
    const MIN_ENEMY_SPAWN_DELAY = 600;

    const ENEMY_SPAWN_DELAY_RANDOMNESS_RANGE = 300;

    let enemySpawnDelay = START_ENEMY_SPAWN_DELAY;

    let enemies = [];
    let enemiesCount = 0;

    let maxEnemyBurstCount = 3;

    let enemiesKilled = 0;

    // ### UI ### \\
    const gameUI = document.getElementById("game-ui");
    const enemyUI = document.getElementById("enemy-count");

    gameUI.style.display = "block";

    enemyUI.innerText = enemiesCount;
    // #### Hammer #### \\
    // Use Hammer \\
    function UseHammer(e) {
                hammer.classList.add("hitting");

        // Check if hitting an enemy \\
        for (const [i, enemy] of enemies.entries()) {
            if (posInRect(enemy.getBoundingClientRect(), e.clientX, e.clientY)) {
                // Hammer has hit enemy \\
                enemy.remove();
                enemies.splice(i, 1);

                enemiesCount--;
                enemyUI.innerText = enemiesCount;

                enemiesKilled++;

                // Increase difficulty \\
                if (isMultiple(enemiesKilled, 4)) {
                    if (enemySpawnDelay > MIN_ENEMY_SPAWN_DELAY) enemySpawnDelay -= 100;
                }

                if (isMultiple(maxEnemyBurstCount, 6)) {
                    if (maxEnemyBurstCount < MAXIMUM_MAX_ENEMY_BURST) maxEnemyBurstCount++;
                }
            }
        }
    }

    function LiftUpHammer() {
        hammer.classList.remove("hitting");
    }

    document.addEventListener("mousedown", UseHammer)
    document.addEventListener("mouseup", LiftUpHammer)

    // ##### Enemy Spawning ####
    function SpawnEnemy(type) {
        const enemy = document.createElement("div");

        enemy.classList.add("enemy");
        enemy.classList.add(type);

        // Set position \\
        const pos = GetRandomPos();

        enemy.style.top = `${pos.y}px`;
        enemy.style.left = `${pos.x}px`;

        enemySpawnZone.appendChild(enemy);

        enemies.push(enemy);

        enemiesCount++;
        enemyUI.innerText = enemiesCount;
    }

    function SpawnEnemyTimeout() {
        if (enemiesCount < LOSE_ENEMY_COUNT - 1) {
            SpawnEnemy("basic");

            // Enemy burst spawning \\
            // Spawn enemies in "bursts", as in a few in quick sucession if allowed
            if (getRandomInt(1, 3) === 3) {
                console.log("burst spawn")
                for (let i = 1; i < getRandomInt(1, maxEnemyBurstCount); i++) {
                    setTimeout(() => {
                        if (enemiesCount < LOSE_ENEMY_COUNT - 1) {
                            SpawnEnemy("basic")
                        }
                    }, getRandomInt(800 * i, 1500 * i))
                }
            }
            setTimeout(SpawnEnemyTimeout, getRandomInt(
                enemySpawnDelay - ENEMY_SPAWN_DELAY_RANDOMNESS_RANGE,
                enemySpawnDelay
            ));
        } else {
            // Player has lost! \\
            console.log("Game over!");

            // Revert to start \\
            // Reset hammer \\
            hammer.remove();
            baseHammerElement.style.opacity = "1";
            baseHammerElement.style.pointerEvents = "all";

            // Remove events \\
            document.removeEventListener("mousedown", UseHammer);
            document.removeEventListener("mouseup", LiftUpHammer);

            // Remove enemies \\
            Array.from(enemySpawnZone.children).forEach(enemy => {
                enemy.remove()
            })

            // Other \\
            mainTextArea.classList.remove("no-select");
            document.body.style.cursor = "auto";

            gameUI.style.display = "none";
        }

    }

    SpawnEnemyTimeout()


}

