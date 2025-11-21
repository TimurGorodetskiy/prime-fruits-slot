import { Container, Graphics, Sprite, Texture } from "pixi.js";
import gsap from "gsap";

export class Reel extends Container {
    private symbols: Sprite[] = [];
    private symbolTextures: Texture[];
    private blurredTextures: Texture[];
    private symbolHeight: number;
    private isSpinning: boolean = false;
    private spinTweens: gsap.core.Tween[] = [];
    private symbolTextureIndices: Map<Sprite, number> = new Map();

    constructor(
        textures: Texture[],
        blurredTextures: Texture[],
        width: number,
        height: number,
        x: number
    ) {
        super();

        this.symbolTextures = textures;
        this.blurredTextures = blurredTextures;
        this.x = x;
        this.y = 20;


        const maskObject = new Graphics().rect(0, 0, width, height).fill(0xff0000);

        this.addChild(maskObject);
        this.mask = maskObject;


        this.symbolHeight = height / 3;


        for (let i = 0; i < 3; i++) {
            const randomIndex = Math.floor(Math.random() * this.symbolTextures.length);
            const sprite = new Sprite(this.symbolTextures[randomIndex]);

            sprite.width = width;
            sprite.height = this.symbolHeight;
            sprite.y = i * this.symbolHeight;

            this.symbols.push(sprite);
            this.symbolTextureIndices.set(sprite, randomIndex);
            this.addChild(sprite);
        }
    }


    private getRandomTextureIndex(): number {
        return Math.floor(Math.random() * this.symbolTextures.length);
    }


    public spin(): void {
        if (this.isSpinning) return;

        this.isSpinning = true;
        this.spinTweens = [];


        this.symbols.forEach((symbol) => {
            const textureIndex = this.symbolTextureIndices.get(symbol) || 0;

            symbol.texture = this.blurredTextures[textureIndex];
        });

        const totalHeight = this.symbolHeight * this.symbols.length;


        this.symbols.forEach((symbol) => {
            let previousY = symbol.y;

            const tween = gsap.to(symbol, {
                y: `+=${10000}`,
                duration: 3,
                ease: "none",
                repeat: -1,
                modifiers: {
                    y: (y: string) => {
                        let newY = parseFloat(y) % totalHeight;

                        if (newY < 0) {
                            newY += totalHeight;
                        }

                        if (previousY > newY) {

                            const randomIndex = this.getRandomTextureIndex();

                            this.symbolTextureIndices.set(symbol, randomIndex);
                            symbol.texture = this.blurredTextures[randomIndex];
                        }

                        previousY = newY;

                        return `${newY}`;
                    },
                },
            });

            this.spinTweens.push(tween);
        });
    }

    public stop(delay: number, onComplete?: () => void): void {
        if (!this.isSpinning) {
            if (onComplete) {
                onComplete();
            }

            return;
        }


        setTimeout(() => {

            this.spinTweens.forEach((tween) => tween.kill());
            this.spinTweens = [];



            this.symbols.forEach((symbol, index) => {
                symbol.y = index * this.symbolHeight;


                const randomIndex = this.getRandomTextureIndex();

                this.symbolTextureIndices.set(symbol, randomIndex);


                symbol.texture = this.symbolTextures[randomIndex];


                gsap.killTweensOf(symbol);
            });

            this.isSpinning = false;

            if (onComplete) {
                onComplete();
            }
        }, delay * 1000);
    }

    public destroy(options?: boolean): void {
        this.spinTweens.forEach((tween) => tween.kill());
        this.spinTweens = [];
        super.destroy(options);
    }
}