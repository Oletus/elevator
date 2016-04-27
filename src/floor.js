"use strict";

var Floor = function(options) {
    var defaults = {
        id: '',
        floorNumber: 0, // Floor number rises upwards
        name: 'Products',
        elevator: null,
        level: null,
        occupants: [],
        spawnIds : [
            {id: "customer", chance: 5},
            {id: "horse", chance: 1},
            {id: "heavy", chance: 2},
            {id: "runner", chance: 1}
        ],
        excludeAsDestination : false
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this.alarm = 0;
    this.stateTime = 0;
    this.state = Floor.State.APPEARING;
    this.doorVisual = 1.0;
    this.doorOpen = false;
};

Floor.prototype.removeOccupant = function(toRemove) {
    if (this.occupants.indexOf(toRemove) >= 0) {
        this.occupants.splice(this.occupants.indexOf(toRemove), 1);
    }
};

Floor.State = {
    APPEARING: 0,
    IDLE: 1,
    RENOVATING: 2,
    RENOVATED: 3
};

Floor.height = 8;

Floor.fgSprites = {};
Floor.bgSprites = {};
Floor.alarmSprite = new GJS.Sprite('floor-alarm.png');
Floor.renovationSprite = new GJS.Sprite('floor-renovation.png');
Floor.renovatingSound = new GJS.Audio('renovating');

Floor.loadSprites = function() {
    for (var i = 0; i < GameData.floors.length; ++i) {
        var floor = GameData.floors[i];
        Floor.bgSprites[floor.id] = new GJS.Sprite('floor-' + floor.id + '-bg.png', undefined, 'floor_gfx.png');
        Floor.fgSprites[floor.id] = new GJS.Sprite('floor-' + floor.id + '-fg.png', undefined, 'floor-fg.png');
    }
};

Floor.loadSprites();

Floor.prototype.renderBg = function(ctx) {
    ctx.save();
    var drawY = this.level.getFloorTopY(this.floorNumber);
    ctx.translate(0, drawY);
    ctx.save();
    ctx.translate(0, 6);
    Floor.bgSprites[this.id].draw(ctx, 0, -9);
    ctx.restore();
    
    ctx.save();
    ctx.translate(22 * 6, -2 * 6);
    if (this.doorVisual === 0) {
        Elevator.doorOpen2Sprite.draw(ctx, -1, 21);
    } else {
        Elevator.doorOpenSprite.draw(ctx, -1, 21);
    }
    ctx.globalAlpha = this.doorVisual;
    Elevator.doorSprite.draw(ctx, -1, 21);
    ctx.restore();
    
    ctx.globalAlpha = 1;
    ctx.translate(21.5 * 6, 0);
    ctx.fillStyle = 'black';
    ctx.textAlign = "right";
    var floorTextNumber = (this.floorNumber >= 10 ) ? (this.floorNumber + 1).toString() : '0' + (this.floorNumber + 1);
    blackBitmapFont.drawText(ctx, this.name.toUpperCase() + ' ' + floorTextNumber, 0, 0);

    ctx.restore();
};

Floor.prototype.renderFg = function(ctx) {
    ctx.save();
    var drawY = this.level.getFloorTopY(this.floorNumber);
    ctx.translate(0, drawY - 3);
    Floor.fgSprites[this.id].draw(ctx, 0, 0);
    var alarmAlpha = this.alarm * Math.max(Math.sin(this.level.time * 3.5) * 0.8 + 0.2, 0);
    if (alarmAlpha > 0.01) {
        ctx.globalAlpha = alarmAlpha;
        Floor.alarmSprite.draw(ctx, 0, 0);
    }
    if (this.state === Floor.State.RENOVATING || this.state === Floor.State.APPEARING || this.state === Floor.State.RENOVATED) {
        var alpha = this.state === Floor.State.RENOVATING ? this.stateTime : 1.0 - this.stateTime;
        if (this.state === Floor.State.RENOVATED) {
            alpha = 1.0;
        }
        ctx.globalAlpha = mathUtil.clamp(0, 1, alpha);
        Floor.renovationSprite.draw(ctx, 0, 0);
    }
    ctx.restore();
}

Floor.prototype.spawnCharacter = function(characterId) {
    if (characterId === undefined) {
        var that = this;
        var canSpawn = function(id) {
            if (GameData.characters[id].constructorLimit !== undefined) {
                var count = arrayUtil.count(that.level.characters, function(c) {
                    return (c instanceof GameData.characters[id].characterConstructor);
                });
                if (count >= GameData.characters[id].constructorLimit) {
                    return false;
                }
            }
            if (GameData.characters[id].idLimit !== undefined) {
                var count = arrayUtil.count(that.level.characters, function(c) {
                    return (c.id === id);
                });
                if (count >= GameData.characters[id].idLimit) {
                    return false;
                }
            }
            return true;
        }
        
        var totalChance = 0;
        for ( var i = 0; i < this.spawnIds.length; i++ ) {
            if (canSpawn(this.spawnIds[i].id)) {
                totalChance += this.spawnIds[i].chance;
            }
        }
        var roll = Math.random() * totalChance;
        var cumulativeChance = 0;
        
        for ( var i = 0; i < this.spawnIds.length; i++ ) {
            if (canSpawn(this.spawnIds[i].id)) {
                cumulativeChance += this.spawnIds[i].chance;
                if ( roll <= cumulativeChance ) {
                    characterId = this.spawnIds[i].id;
                    break;
                }
            }
        }
    }
    
    var character = BaseCharacter.create({x: 1, floorNumber: this.floorNumber, level: this.level, id: characterId});
    
    this.occupants.push(character);
    return character;
};

Floor.prototype.canOpenDoor = function() {
    return (this.state === Floor.State.IDLE);
};

Floor.prototype.update = function(deltaTime) {
    this.stateTime += deltaTime;

    if (this.state === Floor.State.RENOVATING) {
        if (this.stateTime > 1) {
            Floor.renovatingSound.play();
            this.state = Floor.State.RENOVATED;
        }
    } else if (this.state === Floor.State.APPEARING) {
        if (this.stateTime > 1) {
            this.state = Floor.State.IDLE;
        }
    }

    if (this.canOpenDoor() && Math.round(this.elevator.floorNumber) == this.floorNumber) {
        this.doorOpen = this.elevator.doorOpen;
        propertyToValue(this, 'doorVisual', this.elevator.doorVisual, deltaTime * 2 / this.level.elevatorDoorOpenTime);
    } else {
        this.doorOpen = false;
        propertyToValue(this, 'doorVisual', 1, deltaTime * 2);
    }

    var usedSpace = 0;
    for (var i = 0; i < this.occupants.length;) {
        var occupant = this.occupants[i];
        if (occupant.takesSpaceInLine) {
            occupant.floorTargetX = this.level.getFloorWidth() - (1 + usedSpace + occupant.width * 0.5) * TILE_WIDTH;
            usedSpace += occupant.width;
        }
        if (occupant.dead) {
            this.occupants.splice(i, 1);
        } else {
            ++i;
        }
    }
    if (this.occupants.length > 0) {
        var lastDude = this.occupants[this.occupants.length - 1];
        if (usedSpace >= this.level.getFloorCapacity() && Math.abs(lastDude.x - lastDude.floorTargetX) < 1) {
            if (this.level.state !== Level.State.FAIL) {
                this.level.goToState(Level.State.FAIL);
                Game.music.stop();
                Game.gameOverSound.play();
            }
        }
    }

    if (usedSpace >= this.level.getFloorCapacity() - 6) {
        propertyToValue(this, 'alarm', 1, deltaTime);
    } else {
        propertyToZero(this, 'alarm', deltaTime);
    }
};

Floor.prototype.renovate = function() {
    if (this.state !== Floor.State.RENOVATING) {
        changeState(this, Floor.State.RENOVATING);
    }
};
