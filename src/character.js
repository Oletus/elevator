
var BaseCharacter = function() {
};

BaseCharacter.legsAnimation = new AnimatedSprite({
        'idle': [{src: 'legs-idle.png', duration: 0}],
},
{
    durationMultiplier: 1000 / 60,
    defaultDuration: 5
});

BaseCharacter.prototype.initBase = function(options) {
    var defaults = {
        floorNumber: 0, // Floor number rises upwards
        x: 0,
        level: null,
        elevator: null,
        goalFloor: 0,
        id: 'customer',
        width: 2
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this.legsSprite = new AnimatedSpriteInstance(BaseCharacter.legsAnimation);
    this.bobbleTime = 0;

    var possibleDestinations = GameData.characters[this.id].destinations;
    var shuffledFloors = arrayUtil.shuffle(this.level.floors);
    
    for ( var i = 0; i < shuffledFloors.length; i++ ) {
        if ( shuffledFloors[i].floorNumber === this.floorNumber ) {
            continue;
        }
            
        for ( var b = 0; b < possibleDestinations.length; b++ ) {
            if ( possibleDestinations[b].id === shuffledFloors[i].id ) {
                this.goalFloor = shuffledFloors[i].floorNumber;
            }
        }
    }
    this.queueTime = 0;
    this.facingRight = true;
};

BaseCharacter.prototype.render = function(ctx) {
    ctx.save();
    var drawY = this.level.getFloorFloorY(this.floorNumber);
    ctx.translate(this.x, drawY);
    this.renderBody(ctx);
    if (this.floorNumber !== this.goalFloor || this.elevator) {
        ctx.translate(0, -4);
        ctx.scale(1 / 6, 1 / 6);
        ctx.textAlign = 'center';
        whiteBitmapFont.drawText(ctx, '' + (this.goalFloor + 1), 0, 0);
    }
    ctx.restore();
};

BaseCharacter.prototype.spawnTip = function() {
    return 0;
};

BaseCharacter.prototype.getTip = function() {
    var tip = 0;
    if (this.queueTime < 10) {
        tip = Math.ceil(10 - this.queueTime);
    }
    return tip;
};

BaseCharacter.prototype.update = function(deltaTime) {
    var doorThresholdX = this.level.getFloorWidth();
    var wallXRight = doorThresholdX - 1;
    var wallXLeft = -5;
    if (this.elevator) {
        this.floorNumber = this.elevator.floorNumber;
        if (!this.elevator.doorOpen) {
            wallXLeft = doorThresholdX + 1;
        }
        wallXRight = doorThresholdX + 7;
    } else {
        if (this.level.floors[this.floorNumber].doorOpen && this.level.elevator.hasSpace(this.width)) {
            wallXRight = doorThresholdX + 7;
            this.floorTargetX = undefined;
        }
    }
    if (Math.round(this.floorNumber) == this.goalFloor && (!this.elevator || this.elevator.doorOpen)) {
        this.moveX = -1;
        this.elevatorTargetX = undefined;
    } else {
        this.moveX = 1;
    }
    var oldX = this.x;
    if (this.elevatorTargetX !== undefined) {
        propertyToValue(this, 'x', this.elevatorTargetX, this.level.characterMoveSpeed * deltaTime);
    } else if (this.floorTargetX !== undefined) {
        propertyToValue(this, 'x', this.floorTargetX, this.level.characterMoveSpeed * deltaTime);
    } else {
        this.x += this.moveX * this.level.characterMoveSpeed * deltaTime;
    }
    if (this.x > wallXRight - this.width * 0.5) {
        this.x = wallXRight - this.width * 0.5;
    }
    if (this.x < wallXLeft + this.width * 0.5) {
        this.x = wallXLeft + this.width * 0.5;
    }
    if (this.x > doorThresholdX && this.elevator === null) {
        this.level.floors[this.floorNumber].removeOccupant(this);
        this.elevator = this.level.elevator;
        this.elevator.occupants.push(this);
        this.floorTargetX = undefined;
    }
    if (this.x < doorThresholdX && this.elevator !== null) {
        this.elevator.removeOccupant(this);
        this.elevator = null;
        this.floorNumber = Math.round(this.floorNumber);
        this.elevatorTargetX = undefined;
        if (this.floorNumber === this.goalFloor) {
            this.level.reachedGoal(this);
        }
    }
    if (this.x !== oldX) {
        this.legsSprite.update(deltaTime);
        this.bobbleTime += deltaTime;
        this.facingRight = this.x - oldX > 0;
    } else if (!this.elevator) {
        this.queueTime += deltaTime;
    }
    if (this.x + this.width < -1 && this.floorNumber === this.goalFloor) {
        this.dead = true;
    }
};


var Character = function(options) {
    this.initBase(options);
    this.bodySprite = Character.bodySprites[this.id];
};

Character.prototype = new BaseCharacter();

Character.bodySprites = {
    'customer': new Sprite('body-customer.png')
};

/**
 * ctx has its current transform set centered on the floor at the x center of the character.
 */
Character.prototype.renderBody = function(ctx) {
    var scale = 1 / 6;
    var flip = this.facingRight ? 1 : -1;
    this.legsSprite.drawRotatedNonUniform(ctx, 0, -1, 0, scale * flip, scale);
    this.bodySprite.drawRotatedNonUniform(ctx, 0, -2 + Math.sin(this.bobbleTime * 15) * 0.1, 0, scale * flip, scale);
};
