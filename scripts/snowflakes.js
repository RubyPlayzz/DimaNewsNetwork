const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");

const SNOWFLAKE_AREA_Y = 150;
const SNOWFLAKE_SIZE = 40;
// Canvas Setup \\
canvas.style.position = "absolute";
canvas.style = "position: absolute; top: 0; left: 0; pointer-events: none; z-index: -1; width: 100vw; height: 100vh;"
canvas.height = window.innerHeight;
canvas.width = window.innerWidth;
context.imageSmoothingEnabled = false;

document.body.appendChild(canvas);

// Snowflakes \\
const snowflakes = [];
const snowflakeImgPath = "/assets/site-assets/snowflake.png";
const snowflakeImg = document.createElement("img");
// document.body.appendChild(snowflakeImg);

snowflakeImg.src = snowflakeImgPath;

function GetRand(min, max) {
    const minCeiled = min;
    const maxFloored = max;
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

class SnowFlake {
    constructor() {
        this.reset();
        this.y = Math.random() * SNOWFLAKE_AREA_Y
        snowflakes.push(this);
    }

    reset() {
        this.x = Math.random() * canvas.width;
        this.y = -SNOWFLAKE_SIZE;
        this.rotation = Math.random() * 360;
        this.speed = GetRand(40, 60);
        this.rotationSpeed = GetRand(10, 20);
        this.resetY = GetRand(SNOWFLAKE_AREA_Y - 60, SNOWFLAKE_AREA_Y + 20);
        this.startAlpha = Math.abs(this.x - canvas.width / 2) / (canvas.width / 2);
        this.alpha = this.startAlpha;

        this.rotationSpeed *= (Math.random() > 0.5 ? -1 : 1) // Randomise snowflake direction
    }

    update(dt) {
        this.y += this.speed * dt;
        this.rotation += this.rotationSpeed * dt;

        const distanceToReset = this.resetY - this.y;
        this.alpha = Math.max(0, Math.min(this.startAlpha, distanceToReset / 30));

        if (this.rotation === 360) this.rotation = 0;
        if (this.y >= this.resetY) this.reset();
    }
}

let lastTime = 0;

function snowflakeLoop(currentTime) {
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Get delta time \\
    currentTime = currentTime / 1000;
    
    const deltaTime = Math.min(currentTime - lastTime, 0.1);
    lastTime = currentTime;

    // Render snowflakes \\
    snowflakes.forEach((snowflake) => {
        // context.drawImage(snowflakeImg, snowflake.x, snowflake.y, 40, 40);
        context.save();
        context.globalAlpha = snowflake.alpha
        
        context.translate(snowflake.x + SNOWFLAKE_SIZE / 2, snowflake.y + SNOWFLAKE_SIZE / 2);
        context.rotate(snowflake.rotation * Math.PI / 180);
        context.drawImage(snowflakeImg, -SNOWFLAKE_SIZE / 2, -SNOWFLAKE_SIZE / 2, SNOWFLAKE_SIZE, SNOWFLAKE_SIZE);
        
        context.restore();

        snowflake.update(deltaTime);
    });

    requestAnimationFrame(snowflakeLoop)
}

// Create initial snowflakes \\
function CreateSnowflakes() {
    snowflakes.length = 0; // Clears array

    for (let i = 0; i < window.innerWidth / 20; i++) {
        new SnowFlake()
    }
}

CreateSnowflakes();

window.addEventListener("resize", () => {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;
    
    if (canvas.width !== newWidth) {
        canvas.width = newWidth;
        CreateSnowflakes();
    };

    canvas.width = newWidth;
    canvas.height = newHeight;
});
requestAnimationFrame(snowflakeLoop)