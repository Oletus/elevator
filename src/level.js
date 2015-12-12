
var LevelTiles = [
    'xxxxxxxxxxxxxxxxxh     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    'xxxxxxxxxxxxxxxxxh     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    'xxxxxxxxxxxxxxxxxh     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    'xxxxxxxxxxxxxxxxxh     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    'xxxxxxxxxxxxxxxxxh     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    'xxxxxxxxxxxxxxxxxh     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    'xxxxxxxxxxxxxxxxxh     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    '                 h     h',
    'xxxxxxxxxxxxxxxxxh     h',
];

var ElevatorTiles = [
    'ooooo',
    'o   o',
    'o   o',
    'o   o',
    'o   o',
    'o   o',
    'ooooo'
];

var Floor = function(options) {
    var defaults = {
        floor: 0, // Floor number rises upwards
        name: 'Products'
    };
    objectUtil.initWithDefaults(this, defaults, options);
};

Floor.height = 6;

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
    this.currentMovementSpeed = this.currentMovementSpeed * 0.9 + (moveIntent * 2) * 0.1;
    if (moveIntent === 0 && Math.abs(this.floor - Math.round(this.floor)) < 0.15) {
        this.floor = this.floor * 0.9 + Math.round(this.floor) * 0.1;
    }
    this.floor += this.currentMovementSpeed * deltaTime;
    this.floor = mathUtil.clamp(0, this.level.numFloors - 1, this.floor);
};

Elevator.prototype.render = function(ctx, numFloors) {
    ctx.save();
    var drawY = (numFloors - this.floor - 1) * Floor.height;
    ctx.translate(this.x, drawY);
    ctx.fillStyle = 'red';
    this.tilemap.render(ctx, function(tile) { return tile === 'o'; }, 0.05, 0.05);
    ctx.restore();
};

var Level = function() {
    this.tilemap = new TileMap({initTile: TileMap.initFromData(LevelTiles), height: LevelTiles.length, width: LevelTiles[0].length });
    this.numFloors = Math.floor(this.tilemap.height / Floor.height);
    this.elevator = new Elevator({x: 18, level: this});
};

Level.prototype.render = function(ctx) {
    ctx.save();
    ctx.translate(ctx.canvas.width * 0.5, ctx.canvas.height * 0.5);
    ctx.scale(15, 15);
    ctx.translate(-this.tilemap.width * 0.5, -this.tilemap.height * 0.5);
    ctx.fillStyle = 'white';
    this.tilemap.render(ctx, function(tile) { return tile === 'x'; }, 0.05, 0.05);
    ctx.fillStyle = '#888';
    this.tilemap.render(ctx, function(tile) { return tile === 'h'; }, 0.05, 0.05);

    this.elevator.render(ctx, this.numFloors);
    ctx.restore();
};

Level.prototype.update = function(deltaTime) {
    this.elevator.update(deltaTime);
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
