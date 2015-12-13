
var BaseCharacter = function() {
};

BaseCharacter.create = function(options) {
    var charData = GameData.characters[options.id];
    for (var key in charData) {
        if (!options.hasOwnProperty(key) && charData.hasOwnProperty(key)) {
            options[key] = charData[key];
        }
    }
    return new charData.characterConstructor(options);
};

BaseCharacter.State = {
    INITIALIZING: 0,
    APPROACHING: 1,
    RUSHING: 2,
    NORMAL: 3,
    ESCAPING: 4,
    DOING_ACTION: 5
};

BaseCharacter.legsAnimation = new AnimatedSprite({
        'idle': [{src: 'legs-idle.png', duration: 0}],
},
{
    durationMultiplier: 1000 / 60,
    defaultDuration: 5
});

BaseCharacter.iconAnimation = new AnimatedSprite({
        'escaping': [{src: 'icon-escaping.png', duration: 0}],
},
{
    durationMultiplier: 1000 / 60,
    defaultDuration: 5
});

BaseCharacter.loadSprites = function() {
    for (var key in GameData.characters) {
        if (GameData.characters.hasOwnProperty(key)) {
            if (GameData.characters[key].characterConstructor.bodySprites === undefined) {
                GameData.characters[key].characterConstructor.bodySprites = {};
            }
            GameData.characters[key].characterConstructor.bodySprites[key] = new Sprite('body-' + key + '.png');
        }
    }
};

BaseCharacter.prototype.initBase = function(options) {
    var defaults = {
        floorNumber: 0, // Floor number rises upwards
        x: 0,
        level: null,
        elevator: null,
        goalFloor: 0,
        id: 'customer',
        width: 2,
        weight: 1,
        maxQueueTime : 10,
        minTip : 1,
        maxTip : 10,
        moveSpeedMultiplier: 1,
        immuneToScary: false,
        scary: false,
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this.legsSprite = new AnimatedSpriteInstance(BaseCharacter.legsAnimation);
    this.bobbleTime = 0;

    var charData = GameData.characters[this.id];
    var shuffledFloors = arrayUtil.shuffle(this.level.floors);
    for (var i = 0; i < shuffledFloors.length;) {
        if (shuffledFloors[i].floorNumber === this.floorNumber) {
            shuffledFloors.splice(i, 1);
            continue;
        }
        var possible = false;
        for (var b = 0; b < charData.destinations.length; b++) {
            if (charData.destinations[b].id === shuffledFloors[i].id) {
                possible = true;
            }
        }
        if (!possible) {
            shuffledFloors.splice(i, 1);
            continue;
        }
        ++i;
    }
    var minPossibleFloorNumber = shuffledFloors[0].floorNumber;
    var maxPossibleFloorNumber = shuffledFloors[0].floorNumber;
    for (var i = 0; i < shuffledFloors.length; ++i) {
        if (shuffledFloors[i].floorNumber < minPossibleFloorNumber) {
            minPossibleFloorNumber = shuffledFloors[i].floorNumber;
        }
        if (shuffledFloors[i].floorNumber > maxPossibleFloorNumber) {
            maxPossibleFloorNumber = shuffledFloors[i].floorNumber;
        }
    }
    var preferGoingDown = (this.weight / this.width) > 1;
    if (preferGoingDown) {
        if (minPossibleFloorNumber > this.floorNumber) {
            this.goalFloor = minPossibleFloorNumber;
        } else {
            for (var i = 0; i < shuffledFloors.length; ++i) {
                if (shuffledFloors[i].floorNumber <= this.floorNumber + 1) {
                    this.goalFloor = shuffledFloors[i].floorNumber;
                    break;
                }
            }
        }
    } else {
        this.goalFloor = shuffledFloors[0].floorNumber;
    }
    this.queueTime = 0;
    this.facingRight = true;
    this.toggleIconTime = 0;
    this.dy = 0;
    this.movedX = 0; // delta of x on last frame
    this.state = BaseCharacter.State.NORMAL;
    this.stateTime = 0;
    this.alwaysBobble = false;
    this.iconSprite = new AnimatedSpriteInstance(BaseCharacter.iconAnimation);
};

BaseCharacter.prototype.render = function(ctx) {
    ctx.save();
    var drawY = this.level.getFloorFloorY(this.floorNumber);
    ctx.translate(this.x, drawY);
    this.renderBody(ctx);

    ctx.translate(0, -4);
    ctx.scale(1 / 6, 1 / 6);
    ctx.textAlign = 'center';

    var drewIcon = false;
    if (!drewIcon && this.state === BaseCharacter.State.ESCAPING) {
        if (mathUtil.fmod(this.toggleIconTime * 3, 1) > 0.5) {
            this.iconSprite.drawRotated(ctx, 0, 0, 0);
            drewIcon = true;
        }
    }
    if (!drewIcon && this.queueTime >= this.maxQueueTime && !this.elevator && this.floorNumber !== this.goalFloor) {
        if (this.toggleIconTime >= 0.87) {
            whiteBitmapFont.drawText(ctx, 'HURRY', 0, 0);
            drewIcon = true;
        }
    }
    if (!drewIcon && (this.floorNumber !== this.goalFloor || this.elevator)) {
        whiteBitmapFont.drawText(ctx, '' + (this.goalFloor + 1), 0, 0);
    }
    ctx.restore();
};

/**
 * ctx has its current transform set centered on the floor at the x center of the character.
 */
BaseCharacter.prototype.renderBody = function(ctx) {
    var scale = 1 / 6;
    var flip = this.facingRight ? 1 : -1;
    this.legsSprite.drawRotatedNonUniform(ctx, 0, -1, 0, scale * flip, scale);
    this.bodySprite.drawRotatedNonUniform(ctx, 0, -2 + Math.floor(Math.sin(this.bobbleTime * 15) * 1) / 6, 0, scale * flip, scale);
};

BaseCharacter.coinSprite = new AnimatedSprite({
    'fly': [{src: 'coin1.png'},
            {src: 'coin2.png'},
            {src: 'coin3.png'},
            {src: 'coin2.png'},
            ],
},
{
    durationMultiplier: 1000 / 60,
    defaultDuration: 5
});

BaseCharacter.coinAnimation = new AnimatedSpriteInstance(BaseCharacter.coinSprite);

BaseCharacter.tipParticleAppearance = Particle.spriteAppearance(BaseCharacter.coinAnimation, 1 / 6);

BaseCharacter.tipParticleEmitter = new ParticleEmitter({
    appearance: BaseCharacter.tipParticleAppearance,
    size: 1,
    minLifetime: 4,
    maxLifetime: 4,
    minVelocity: 10,
    maxVelocity: 15,
    direction: -90,
    directionSpread: 40,
    sizeFunc: function(t) { return 1; },
    opacityFunc: function(t) { return 1; }
});

BaseCharacter.prototype.spawnTip = function() {
    var tip = this.getTip() * this.level.comboCount;
    for (var i = 0; i < tip; ++i) {
        this.level.particles.addParticle(BaseCharacter.tipParticleEmitter.emitParticle({
            x: this.x,
            y: this.level.getFloorFloorY(this.floorNumber) - 4
        }));
    }
};

BaseCharacter.prototype.getTip = function() {
    var relativeTime = mathUtil.clamp(0, 1, 1 - this.queueTime / this.maxQueueTime);
    var tip = this.minTip + Math.round(relativeTime * (this.maxTip - this.minTip));
    return tip;
};

BaseCharacter.prototype.update = function(deltaTime) {
    this.stateTime += deltaTime;
    this.iconSprite.update(deltaTime);

    var doorThresholdX = this.level.getFloorWidth();
    var oldX = this.x;
    
    // Determine target x
    var targetX = undefined;
    var wantOut = (Math.round(this.floorNumber) === this.goalFloor) || this.state === BaseCharacter.State.ESCAPING;
    if (this.state === BaseCharacter.State.DOING_ACTION) {
        targetX = this.x;
    } else if (wantOut && (!this.elevator || this.elevator.doorOpen)) {
        targetX = -10;
    } else if (this.elevatorTargetX !== undefined) {
        targetX = this.elevatorTargetX;
    } else if (this.state === BaseCharacter.State.RUSHING && this.level.elevator.hasSpace(this.width)) {
        targetX = doorThresholdX + 5;
    } else if (this.floorTargetX !== undefined) {
        targetX = this.floorTargetX;
    } else {
        targetX = doorThresholdX - 1 - this.width * 0.5;
    }
    
    // Determine wall positions
    var wallXRight = 0;
    var wallXLeft = -5;
    if (this.elevator) { // Character is in elevator
        this.floorNumber = this.elevator.floorNumber;
        if (this.elevator.doorVisual > 0 && this.state !== BaseCharacter.State.RUSHING) {
            wallXLeft = doorThresholdX + this.elevator.doorVisual;
        }
        wallXRight = doorThresholdX + 7;
    } else {
        if (this.state === BaseCharacter.State.RUSHING) {
            wallXRight = doorThresholdX + 8;
        } else if (this.level.floors[this.floorNumber].doorVisual === 0 &&
            this.level.elevator.hasSpace(this.width))
        {
            wallXRight = doorThresholdX + 7;
        } else {
            wallXRight = doorThresholdX - this.level.floors[this.floorNumber].doorVisual;
        }
    }
    
    // Move the character
    if (this.falling) {
        this.x += this.movedX *= 0.98 + 0.01 * deltaTime;
        if (this.x - this.width * 0.5 > doorThresholdX) {
            this.dy -= deltaTime * 4;
            this.floorNumber += this.dy * deltaTime;
        }
    } else {
        propertyToValue(this, 'x', targetX, this.level.characterMoveSpeed * this.moveSpeedMultiplier * deltaTime);
    }

    // Collide with walls
    if (this.x > wallXRight - this.width * 0.5) {
        this.x = wallXRight - this.width * 0.5;
    }
    if (this.x < wallXLeft + this.width * 0.5) {
        this.x = wallXLeft + this.width * 0.5;
    }
    
    // Change status based on when crossing elevator threshold
    if (this.x > doorThresholdX) {
        if (!this.falling && this.elevator === null) {
            if (this.floorNumber > -0.1) {
                this.level.floors[Math.round(this.floorNumber)].removeOccupant(this);
            }
            if (Math.abs(this.level.elevator.floorNumber - this.floorNumber) < 0.1) {
                this.elevator = this.level.elevator;
                this.elevator.occupants.push(this);
            } else {
                this.falling = true;
            }
        }
    }
    if (this.x < doorThresholdX && this.elevator !== null) {
        this.elevator.removeOccupant(this);
        this.elevator = null;
        this.floorNumber = Math.round(this.floorNumber);
        if (this.floorNumber === this.goalFloor) {
            this.level.reachedGoal(this);
        }
    }
    
    // Update animation
    this.movedX = this.x - oldX;
    var bobble = this.alwaysBobble;
    if (Math.abs(this.movedX) > this.level.characterMoveSpeed * this.moveSpeedMultiplier * deltaTime * 0.4 + 0.001) {
        this.legsSprite.update(deltaTime);
        bobble = true;
        this.facingRight = (this.x > oldX);
    } else if (!this.elevator) {
        if (this.queueTime < this.maxQueueTime) {
            this.queueTime += deltaTime;
            
            if ( this.queueTime >= this.maxQueueTime ) {
                this.queueTime = this.maxQueueTime;
            }
        }
    }
    this.toggleIconTime += deltaTime * 0.25;
    if ( this.toggleIconTime >= 1 ) {
        this.toggleIconTime = 0;
    }
    if (bobble) {
        this.bobbleTime += deltaTime;
    }
    
    // Check if the character has left the level
    if (this.x + this.width < -1 && this.floorNumber === this.goalFloor) {
        this.dead = true;
    }
    if (this.floorNumber < -1) {
        this.dead = true;
    }
};


var Character = function(options) {
    this.initBase(options);
    this.bodySprite = Character.bodySprites[this.id];
};

Character.prototype = new BaseCharacter();


var Horse = function(options) {
    options.width = 4;
    this.initBase(options);
    this.bodySprite = Horse.bodySprites[this.id];
};

Horse.prototype = new BaseCharacter();

/**
 * ctx has its current transform set centered on the floor at the x center of the character.
 */
Horse.prototype.renderBody = function(ctx) {
    var scale = 1 / 6;
    var flip = this.facingRight ? 1 : -1;
    this.legsSprite.drawRotatedNonUniform(ctx, 1, -1, 0, scale * flip, scale);
    this.legsSprite.drawRotatedNonUniform(ctx, -1, -1, 0, scale * flip, scale);
    this.bodySprite.drawRotatedNonUniform(ctx, 0, -2 + Math.floor(Math.sin(this.bobbleTime * 15) * 1) / 6, 0, scale * flip, scale);
};


var Runner = function(options) {
    this.initBase(options);
    this.bodySprite = Runner.bodySprites[this.id];
    this.state = BaseCharacter.State.INITIALIZING;
};

Runner.prototype = new BaseCharacter();

Runner.runningSprite = new Sprite('body-runner-running.png');

/**
 * ctx has its current transform set centered on the floor at the x center of the character.
 */
Runner.prototype.update = function(deltaTime) {
    BaseCharacter.prototype.update.call(this, deltaTime);
    var doorThresholdX = this.level.getFloorWidth();
    if (this.state === BaseCharacter.State.INITIALIZING) {
        this.level.floors[Math.round(this.floorNumber)].removeOccupant(this);
        changeState(this, BaseCharacter.State.APPROACHING);
        this.moveSpeedMultiplier = 1.0;
    } else if (this.state === BaseCharacter.State.APPROACHING) {
        if (this.x > 3) {
            changeState(this, BaseCharacter.State.WAITING);
            this.moveSpeedMultiplier = 0.0;
        }
    } else if (this.state === BaseCharacter.State.WAITING) {
        if (this.level.elevator.hasSpace(this.width)) {
            if (this.stateTime > 1) {
                changeState(this, BaseCharacter.State.RUSHING);
                this.moveSpeedMultiplier = 0.5;
            }
        } else {
            this.stateTime = 0;
        }
    } else if (this.state === BaseCharacter.State.RUSHING) {
        this.moveSpeedMultiplier += deltaTime * 2.0;
        if (this.elevator && this.x >= doorThresholdX + 2 || this.floorNumber === this.goalFloor) {
            changeState(this, BaseCharacter.State.NORMAL);
            this.moveSpeedMultiplier = 1.5;
        }
    }
};

/**
 * ctx has its current transform set centered on the floor at the x center of the character.
 */
Runner.prototype.renderBody = function(ctx) {
    if (this.state === BaseCharacter.State.RUSHING) {
        var scale = 1 / 6;
        var flip = this.facingRight ? 1 : -1;
        this.legsSprite.drawRotatedNonUniform(ctx, 0, -1, 0, scale * flip, scale);
        Runner.runningSprite.drawRotatedNonUniform(ctx, 0, -2 + Math.floor(Math.sin(this.bobbleTime * 15) * 1) / 6, 0, scale * flip, scale);
    } else {
        BaseCharacter.prototype.renderBody.call(this, ctx);
    }
};


var Ghost = function(options) {
    this.initBase(options);
    this.bodySprite = Ghost.bodySprites[this.id];
    this.alwaysBobble = true;
    this.stateTime = 0;
    this.scary = false;
};

//Ghost.scarySound = new Audio('ghost-shriek');

Ghost.prototype = new BaseCharacter();

Ghost.scaringSprite = new Sprite('body-ghost-scaring.png');

/**
 * ctx has its current transform set centered on the floor at the x center of the character.
 */
Ghost.prototype.renderBody = function(ctx) {
    var scale = 1 / 6;
    var flip = this.facingRight ? 1 : -1;
    if (this.scary) {
        Ghost.scaringSprite.drawRotatedNonUniform(ctx, 0, -2 + Math.floor(Math.sin(this.bobbleTime * 2) * 2) / 6, 0, scale * flip, scale);
    } else {
        this.bodySprite.drawRotatedNonUniform(ctx, 0, -2 + Math.floor(Math.sin(this.bobbleTime * 2) * 2) / 6, 0, scale * flip, scale);
    }
};

Ghost.prototype.update = function(deltaTime) {
    BaseCharacter.prototype.update.call(this, deltaTime);
    if (this.elevator && this.elevator.doorOpen &&
        Math.round(this.floorNumber) !== this.goalFloor &&
        Math.abs(this.x - this.elevatorTargetX) < 0.05 &&
        this.elevator.hasOccupants(function(occupant) { return !occupant.immuneToScary && Math.abs(occupant.x - occupant.elevatorTargetX) < 0.05; }))
    {
        if (this.state !== BaseCharacter.State.DOING_ACTION) {
            changeState(this, BaseCharacter.State.DOING_ACTION);
        }
        var wasScary = this.scary;
        this.scary = (Math.sin(this.stateTime * 1.5) > 0) && this.elevator;
        if (!wasScary && this.scary) {
            //Ghost.scarySound.play();
        }
    } else {
        if (this.state === BaseCharacter.State.DOING_ACTION && this.stateTime > 1) {
            changeState(this, BaseCharacter.State.NORMAL);
            this.scary = false;
        }
    }
};
