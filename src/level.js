
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
        floor: 0, // Floor number rises upwards
        x: 0,
        level: null
    };
    // Player intent for moving
    this.moveUp = 0;
    this.moveDown = 0;
    this.currentMovementSpeed = 0;

    objectUtil.initWithDefaults(this, defaults, options);
    this.slots = [null, null, null];
    this.tilemap = new TileMap({initTile: TileMap.initFromData(ElevatorTiles), height: ElevatorTiles.length, width: ElevatorTiles[0].length });
    this.doorOpenTimer = 0;
    this.doorOpen = false;
};

Elevator.prototype.getUniqueOccupants = function() {
    var occupants = [];
    for (var i = 0; i < this.slots.length; ++i) {
        if (this.slots[i] !== null && occupants.indexOf(this.slots[i]) < 0) {
            occupants.push(this.slots[i]);
        }
    }
    return occupants;
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
    var appliedIntent = this.doorOpen ? 0 : moveIntent;
    this.currentMovementSpeed = this.currentMovementSpeed * 0.9 + (appliedIntent * 2) * 0.1;
    var snappiness = Math.abs(this.floor - Math.round(this.floor));
    if (moveIntent === 0) {
        if (snappiness < 0.15) {
            this.floor = this.floor * 0.9 + Math.round(this.floor) * 0.1;
        }
        if (snappiness < 0.01) {
            this.doorOpenTimer += deltaTime;
        }
    }
    if (snappiness > 0.01 || moveIntent != 0) {
        this.doorOpenTimer -= deltaTime;
    }
    this.doorOpenTimer = mathUtil.clamp(0, 0.5, this.doorOpenTimer);
    this.doorOpen = this.doorOpenTimer > 0.25;
    this.floor += this.currentMovementSpeed * deltaTime;
    this.floor = mathUtil.clamp(0, this.level.numFloors - 1, this.floor);
};

Elevator.prototype.render = function(ctx) {
    ctx.save();
    var drawY = this.level.getFloorTopY(this.floor);
    ctx.translate(this.x, drawY);
    ctx.fillStyle = 'red';
    this.tilemap.render(ctx, function(tile) { return tile === 'o'; }, 0.05, 0.05);
    if (!this.doorOpen) {
        this.doorVisual = 1.0;
    } else {
        this.doorVisual = 1.0 - (this.doorOpenTimer - 0.25) * 4.0;
    }
    ctx.globalAlpha = this.doorVisual;
    ctx.fillStyle = '#da4';
    this.tilemap.render(ctx, function(tile) { return tile === 'd'; }, 0.05, 0.05);
    ctx.restore();
};

var Level = function() {
    this.numFloors = 6;

    this.elevator = new Elevator({x: this.getFloorWidth(), level: this});
    this.floors = [];
    
    var shuffledFloorNames = arrayUtil.shuffle(floorNames);
    
    for (var i = 0; i < this.numFloors; ++i) {
        var floor = new Floor({floor: i, elevator: this.elevator, level: this, name: shuffledFloorNames[i]});
        this.floors.push(floor);
    }
    this.characters = [];
    this.spawnCharacter();
};

Level.prototype.spawnCharacter = function() {
    var character = new Character({x: 1, floor: Math.floor(Math.random() * this.numFloors), level: this});
    this.characters.push(character);
};

Level.prototype.getFloorTopY = function(floor) {
    return (this.numFloors - floor - 1) * Floor.height;
};

Level.prototype.getFloorFloorY = function(floor) {
    return (this.numFloors - floor - 1) * Floor.height + Floor.height - 1;
};

Level.prototype.getFloorWidth = function() {
    return 23;
};

Level.prototype.render = function(ctx) {
    ctx.save();
    ctx.translate(ctx.canvas.width * 0.5, ctx.canvas.height * 0.5);
    ctx.scale(15, 15);
    ctx.translate(-this.floors[0].tilemap.width * 0.5, -this.numFloors * Floor.height * 0.5);

    for (var i = 0; i < this.floors.length; ++i) {
        this.floors[i].render(ctx);
    }
    this.elevator.render(ctx);
    for (var i = 0; i < this.characters.length; ++i) {
        this.characters[i].render(ctx);
    }
    ctx.restore();
};

Level.prototype.update = function(deltaTime) {
    for (var i = 0; i < this.floors.length; ++i) {
        this.floors[i].update(deltaTime);
    }
    this.elevator.update(deltaTime);
    for (var i = 0; i < this.characters.length; ++i) {
        this.characters[i].update(deltaTime);
    }
};

Level.prototype.upPress = function(playerNumber) {
    this.elevator.upPress();
};

Level.prototype.downPress = function(playerNumber) {
    this.elevator.downPress();
};

Level.prototype.upRelease = function(playerNumber) {
    this.elevator.upRelease();
};

Level.prototype.downRelease = function(playerNumber) {
    this.elevator.downRelease();
};
