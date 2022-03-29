export default class SmoothedHorionztalControl {
    public msSpeed: number;
    public value: number;
    public player: Phaser.GameObjects.Sprite;

    public constructor(player: Phaser.GameObjects.Sprite, speed: number) {
        this.player = player
        this.msSpeed = speed;
        this.value = 0;
    }

    public moveLeft(delta: number) {
        if (this.value > 0) { this.reset(); }
        this.value -= this.msSpeed * delta;
        if (this.value < -1) { this.value = -1; }
        this.player.incData('time.rightDown', delta);
    }

    public moveRight(delta: number) {
        if (this.value < 0) { this.reset(); }
        this.value += this.msSpeed * delta;
        if (this.value > 1) { this.value = 1; }
    }

    public reset() {
        this.value = 0;
    }

}
