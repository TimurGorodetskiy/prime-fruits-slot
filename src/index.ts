import "./style.css";
import { Application, Assets, Container, Sprite, Texture } from "pixi.js";
import { Reel } from "./components/reel";

const gameWidth = 2340;
const gameHeight = 1080;
const REEL_COUNT = 5;
const REEL_WIDTH = 220;
const REEL_HEIGHT = 810;
const MIN_SPIN_DURATION = 3000;

type GameState = "IDLE" | "SPINNING" | "STOPPING";

let gameState: GameState = "IDLE";
let background: Sprite;
let backgroundContainer: Container;
let gameContainer: Container;
const reels: Reel[] = [];
let button: Sprite;
let startButtonTexture: Texture;
let stopButtonTexture: Texture;
let symbolTextures: Texture[];

(async () => {
    const app = new Application();

    await new Promise((resolve) => {
        window.addEventListener("load", resolve);
    });

    await app.init({
        backgroundColor: "purple",
        width: gameWidth,
        height: gameHeight,
    });

    document.body.append(app.canvas);

    backgroundContainer = new Container();
    app.stage.addChild(backgroundContainer);

    gameContainer = new Container();
    app.stage.addChild(gameContainer);

    background = new Sprite(await Assets.load("assets/bg_landscape.png"));
    backgroundContainer.addChild(background);

    const logo = new Sprite(await Assets.load("assets/logo.png"));

    logo.x = (gameWidth - logo.width) / 2;
    logo.y = 50;
    gameContainer.addChild(logo);

    const reelFrame = new Sprite(await Assets.load("assets/reel_frame.png"));
    const frameX = (gameWidth - reelFrame.width) / 2;
    const frameY = 150;

    reelFrame.x = frameX;
    reelFrame.y = frameY;
    gameContainer.addChild(reelFrame);

    const symbolPaths: string[] = [
        "assets/symbols/H1.png",
        "assets/symbols/H2.png",
        "assets/symbols/H3.png",
        "assets/symbols/L1.png",
        "assets/symbols/L2.png",
        "assets/symbols/L3.png",
        "assets/symbols/L4.png",
        "assets/symbols/Scatter.png",
    ];

    const blurredSymbolPaths: string[] = [
        "assets/symbols/H1_blur.png",
        "assets/symbols/H2_blur.png",
        "assets/symbols/H3_blur.png",
        "assets/symbols/L1_blur.png",
        "assets/symbols/L2_blur.png",
        "assets/symbols/L3_blur.png",
        "assets/symbols/L4_blur.png",
        "assets/symbols/Scatter_blur.png",
    ];

    const loadedSymbols = await Assets.load(symbolPaths);
    const loadedBlurredSymbols = await Assets.load(blurredSymbolPaths);

    symbolTextures = Object.values(loadedSymbols) as Texture[];
    const blurredTextures = Object.values(loadedBlurredSymbols) as Texture[];

    const startX = frameX + 20;
    const spacing = 300;

    for (let i = 0; i < REEL_COUNT; i++) {
        const reel = new Reel(symbolTextures, blurredTextures, REEL_WIDTH, REEL_HEIGHT, startX + i * spacing);

        reel.y = frameY;
        gameContainer.addChild(reel);
        reels.push(reel);
    }

    startButtonTexture = await Assets.load("assets/ui/start_spin.png");
    stopButtonTexture = await Assets.load("assets/ui/stop_spin.png");

    button = new Sprite(startButtonTexture);
    button.x = reelFrame.x + reelFrame.width + 50;
    button.y = reelFrame.y + (reelFrame.height - button.height) / 2;
    button.interactive = true;
    button.cursor = "pointer";
    button.on("pointerdown", handleButtonClick);
    gameContainer.addChild(button);

    setupResize(app);
})();

function setupResize(app: Application) {
    function resize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        background.width = windowWidth;
        background.height = windowHeight;

        const scaleX = windowWidth / gameWidth;
        const scaleY = windowHeight / gameHeight;
        const scale = Math.min(scaleX, scaleY);

        gameContainer.scale.set(scale);

        gameContainer.position.set((windowWidth - gameWidth * scale) / 2, (windowHeight - gameHeight * scale) / 2);

        app.renderer.resize(windowWidth, windowHeight);
    }

    resize();
    window.addEventListener("resize", resize);
}

function handleButtonClick() {
    if (gameState === "IDLE") {
        startSpin();
    } else if (gameState === "SPINNING") {
        attemptFastStop();
    }
}

function startSpin() {
    gameState = "SPINNING";
    button.texture = stopButtonTexture;
    reels.forEach((reel) => reel.spin());

    setTimeout(() => {
        if (gameState === "SPINNING") {
            stopReels(true);
        }
    }, MIN_SPIN_DURATION);
}

function attemptFastStop() {
    stopReels(false);
}

function stopReels(cascade: boolean = false) {
    if (gameState === "STOPPING") {
        return;
    }

    gameState = "STOPPING";

    let stoppedCount = 0;

    reels.forEach((reel, index) => {
        const delay = cascade ? index * 0.2 : 0;

        reel.stop(delay, () => {
            stoppedCount++;

            if (stoppedCount === reels.length) {
                onAllReelsStopped();
            }
        });
    });
}

function onAllReelsStopped() {
    gameState = "IDLE";
    button.texture = startButtonTexture;
}
