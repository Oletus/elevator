var ElevatorTiles = [
    'oooooooo',
    'o      o',
    'd      o',
    'd      o',
    'd      o',
    'd      o',
    'd      o',
    'oooooooo'
];

var Elevator = function(options) {
    var defaults = {
        floorNumber: 0, // Floor number rises upwards
        x: 0,
        level: null
    };
    // Player intent for moving
    this.moveUp = 0;
    this.moveDown = 0;
    this.currentMovementSpeed = 0;

    objectUtil.initWithDefaults(this, defaults, options);
    this.occupants = [];
    this.maxTotalOccupantWidth = 6;
    this.tilemap = new TileMap({initTile: TileMap.initFromData(ElevatorTiles), height: ElevatorTiles.length, width: ElevatorTiles[0].length });
    this.doorOpenTimer = 0;
    this.doorOpen = false;
    this.comboText = null;
    this.targetFloor = this.floorNumber;
};

Elevator.sprite = new Sprite('lift.png');
Elevator.shaftSprite = new Sprite('shaft.png');
Elevator.counterweightSprite = new Sprite('counterweight.png');
Elevator.wireSprite = new Sprite('wire.png');
Elevator.doorSprite = new Sprite('door_closed.png');
Elevator.doorOpenSprite = new Sprite('door_open1.png');
Elevator.doorOpen2Sprite = new Sprite('door_open2.png');

Elevator.prototype.removeOccupant = function(toRemove) {
    if (this.occupants.indexOf(toRemove) >= 0) {
        this.occupants.splice(this.occupants.indexOf(toRemove), 1);
    }
};

Elevator.prototype.getTotalUsedSpace = function() {
    return Level.getTotalUsedSpace(this.occupants);
};

Elevator.prototype.getTotalWeight = function() {
    return Level.getTotalWeight(this.occupants);
};

Elevator.prototype.hasSpace = function(space) {
    return this.getTotalUsedSpace() + space <= this.maxTotalOccupantWidth;
};

Elevator.prototype.hasOccupants = function(matchFunc) {
    for (var i = 0; i < this.occupants.length; ++i) {
        if (matchFunc(this.occupants[i])) {
            return true;
        }
    }
    return false;
};

Elevator.prototype.upPress = function() {
    this.moveUp = 1;
};

Elevator.prototype.downPress = function() {
    this.moveDown = -1;
};

Elevator.prototype.upRelease = function() {
    this.moveUp = 0;
};

Elevator.prototype.downRelease = function() {
    this.moveDown = 0;
};

Elevator.prototype.update = function(deltaTime) {
    var moveIntent = this.moveUp + this.moveDown;
    if (this.getTotalWeight() > 3) {
        var slowDown = Math.min((this.getTotalWeight() - 2) * 0.2, 0.8);
        moveIntent = Math.min(moveIntent, 1.0 - slowDown);
    }
    if (this.getTotalWeight() < -3) {
        var slowDown = Math.min((Math.abs(this.getTotalWeight()) - 2) * 0.2, 0.8);
        moveIntent = Math.max(moveIntent, -(1.0 - slowDown));
    }
    var appliedIntent = this.doorOpen ? 0 : moveIntent;
    var snappiness = Math.abs(this.floorNumber - Math.round(this.floorNumber));
    if (moveIntent === 0) {
        if (this.targetFloor === undefined) {
            this.targetFloor = Math.round(this.floorNumber + this.currentMovementSpeed * 0.15);
        }
        var distanceFromTarget = Math.abs(this.floorNumber - this.targetFloor);
        this.currentMovementSpeed *= mathUtil.clamp(0, 0.99, 0.8 + distanceFromTarget * 0.3);
        if (distanceFromTarget < 0.2) {
            var c = mathUtil.clamp(0, 0.1, 0.2 - distanceFromTarget);
            this.floorNumber = this.floorNumber * (1.0 - c) + this.targetFloor * c;
        }
        if (snappiness < 0.01) {
            this.doorOpenTimer += deltaTime;
        }
    } else {
        this.level.resetCombo();
        this.targetFloor = undefined;
        this.currentMovementSpeed = this.currentMovementSpeed * 0.9 + (appliedIntent * this.level.elevatorMoveSpeed) * 0.1;
    }
    if (snappiness > 0.01 || moveIntent !== 0) {
        this.doorOpenTimer -= deltaTime;
    }
    this.doorOpenTimer = mathUtil.clamp(0, this.level.elevatorDoorOpenTime, this.doorOpenTimer);
    this.doorOpen = this.doorOpenTimer > this.level.elevatorDoorOpenTime * 0.5;
    this.floorNumber += this.currentMovementSpeed * deltaTime;
    this.floorNumber = mathUtil.clamp(0, this.level.numFloors - 1, this.floorNumber);
    var fromRight = this.maxTotalOccupantWidth - this.getTotalUsedSpace();
    var usedSpace = 0;
    var scaryOccupants = false;
    for (var i = 0; i < this.occupants.length; ++i) {
        var occupant = this.occupants[i];
        occupant.elevatorTargetX = this.x + (this.maxTotalOccupantWidth + 1 - fromRight - occupant.width * 0.5) * 6;
        fromRight += occupant.width;
        usedSpace += occupant.width;
        if (occupant.scary) {
            scaryOccupants = true;
        }
    }
    if (scaryOccupants) {
        for (var i = 0; i < this.occupants.length; ++i) {
            if (!this.occupants[i].immuneToScary) {
                changeState(this.occupants[i], BaseCharacter.State.ESCAPING);
            }
        }
    }
    var floor = this.level.floors[Math.round(this.floorNumber)];
    for (var i = 0; i < floor.occupants.length; ++i) {
        var floorOccupant = floor.occupants[i];
        if (this.doorOpen && usedSpace + floorOccupant.width <= this.maxTotalOccupantWidth && (!scaryOccupants || floorOccupant.immuneToScary)) {
            usedSpace += floorOccupant.width;
            floorOccupant.elevatorTargetX = this.x + (1 +  floorOccupant.width * 0.5) * 6;
        } else {
            floorOccupant.elevatorTargetX = undefined;
        }
    }
};

Elevator.prototype.renderBg = function(ctx) {
    ctx.save();
    ctx.translate(this.x, 0);
    
    ctx.save();
    Elevator.shaftSprite.draw(ctx, 0, 0);
    ctx.restore();

    ctx.save();
    var counterweightY = this.level.getFloorTopY(this.level.floors.length - this.floorNumber - 1.5);
    ctx.translate(2, counterweightY);

    ctx.translate(0, - this.getBuckleY());
    Elevator.counterweightSprite.draw(ctx, 0, 0);
    Elevator.wireSprite.draw(ctx, 0, -312);
    Elevator.wireSprite.draw(ctx, 19, -312);
    ctx.restore();

    ctx.restore();
};

Elevator.prototype.getBuckleY = function() {
    if (this.getTotalWeight() > 3) {
        return 1;
    }
    if (this.getTotalWeight() < -3) {
        return -1;
    }
    return 0;
};

Elevator.prototype.renderFg = function(ctx) {
    ctx.save();
    ctx.translate(this.x, 0);
    var drawY = this.level.getFloorTopY(this.floorNumber);
    ctx.translate(0, drawY);
    ctx.fillStyle = 'red';
    ctx.save();
    ctx.translate(0, -12 + this.getBuckleY());

    Elevator.wireSprite.draw(ctx, 6, -320);
    Elevator.wireSprite.draw(ctx, 36, -320);
    Elevator.sprite.draw(ctx, 0, 0);
    
    ctx.textAlign = 'center';
    whiteBitmapFont.drawText(ctx, 'SCORE: ' + this.level.score, 4 * 6, 0);
    
    if ( this.comboText !== null ) {
        whiteBitmapFont.drawText(ctx, this.comboText, 4 * 6, -1 * 6);   
    }
    
    if (!this.doorOpen) {
        this.doorVisual = 1.0;
    } else {
        this.doorVisual = 1.0 - (this.doorOpenTimer - this.level.elevatorDoorOpenTime * 0.5) / (this.level.elevatorDoorOpenTime * 0.5);
    }
    if (this.doorVisual === 0) {
        Elevator.doorOpen2Sprite.draw(ctx, 1, 21);
    } else {
        Elevator.doorOpenSprite.draw(ctx, 1, 21);
    }
    ctx.globalAlpha = this.doorVisual;
    Elevator.doorSprite.draw(ctx, 1, 21);
    ctx.restore();
    ctx.restore();
};