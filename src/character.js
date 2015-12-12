


var Character = function(options) {
    var defaults = {
        floor: 0, // Floor number rises upwards
        x: 0,
        level: null,
        elevator: null,
        goalFloor: 0,
        characterType: 'customer',
        width: 2
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this.legsSprite = new AnimatedSpriteInstance(Character.legsAnimation);
    this.bodySprite = Character.bodySprites[this.characterType];
    this.bobbleTime = 0;
};

Character.bodySprites = {
    'customer': new Sprite('body-customer.png')
};

Character.legsAnimation = new AnimatedSprite({
        'idle': [{src: 'legs-idle.png', duration: 0}],
},
{
    durationMultiplier: 1000 / 60,
    defaultDuration: 5
});

Character.prototype.render = function(ctx) {
    ctx.save();
    var drawY = this.level.getFloorFloorY(this.floor);
    ctx.translate(this.x, drawY);
    var scale = 1 / 20;
    var flip = 1;
    this.legsSprite.drawRotatedNonUniform(ctx, 0, -1, 0, scale * flip, scale);
    this.bodySprite.drawRotatedNonUniform(ctx, 0, -2 + Math.sin(this.bobbleTime * 15) * 0.1, 0, scale * flip, scale);
    ctx.restore();
};

Character.prototype.update = function(deltaTime) {
    var doorThresholdX = this.level.getFloorWidth();
    var wallXRight = doorThresholdX - 1;
    var wallXLeft = 0;
    if (this.elevator) {
        this.floor = this.elevator.floor;
        if (!this.elevator.doorOpen) {
            wallXLeft = doorThresholdX + 1;
        }
        wallXRight = doorThresholdX + 7;
    } else {
        if (this.level.floors[this.floor].doorOpen) {
            wallXRight = doorThresholdX + 7;
        }
    }
    if (Math.round(this.floor) == this.goalFloor) {
        this.moveX = -1;
    } else {
        this.moveX = 1;
    }
    var oldX = this.x;
    this.x += this.moveX * 4 * deltaTime;
    if (this.x > wallXRight - this.width * 0.5) {
        this.x = wallXRight - this.width * 0.5;
    }
    if (this.x < wallXLeft + this.width * 0.5) {
        this.x = wallXLeft + this.width * 0.5;
    }
    if (this.x > doorThresholdX) {
        this.elevator = this.level.elevator;
    }
    if (this.x < doorThresholdX) {
        this.elevator = null;
        this.floor = Math.round(this.floor);
    }
    if (this.x != oldX) {
        this.legsSprite.update(deltaTime);
        this.bobbleTime += deltaTime;
    }
};
