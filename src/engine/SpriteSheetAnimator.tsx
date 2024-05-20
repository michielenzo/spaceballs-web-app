export class SpriteSheetAnimator {

    sheet: HTMLImageElement
    spriteWidth: number = 0
    spriteHeight: number = 0
    numberOfSprites: number = 0

    tickRate: number = 1
    currentTicks: number = 0
    currentSpriteIndex: number = 0


    constructor(sheet: HTMLImageElement, spriteWidth: number, spriteHeight: number, numberOfSprites: number) {
        this.sheet = sheet
        this.spriteWidth = spriteWidth
        this.spriteHeight = spriteHeight
        this.numberOfSprites = numberOfSprites
    }

    setTickRate(rate: number): void {
        this.tickRate = rate
    }

    tick(): void {
        this.currentTicks++
        if(this.currentTicks >= this.tickRate){
            this.currentTicks = 0
            this.currentSpriteIndex++
            if(this.currentSpriteIndex > this.numberOfSprites-1) this.currentSpriteIndex = 0
        }
    }

    drawFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number): void {
        let frameX = this.spriteWidth * this.currentSpriteIndex
        let frameY = 0
        ctx.drawImage(this.sheet, frameX,frameY,this.spriteWidth, this.spriteHeight, x, y, width, height)
    }
}