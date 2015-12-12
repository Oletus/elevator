


var Character = function(options) {
    var defaults = {
        floor: 0, // Floor number rises upwards
        x: 0,
        level: null,
        goalFloor: 0
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this.legsSprite = new AnimatedSpriteInstance(Character.legsAnimation);
};

Character.legsAnimation = new AnimatedSprite({
        'idle': [{src: 'legsidle.png', duration: 0}],
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
    ctx.restore();
};

Character.prototype.update = function(deltaTime) {
    
};