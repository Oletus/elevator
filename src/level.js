
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
        y: 0, // Floor number rises upwards
        name: 'Products'
    };
    objectUtil.initWithDefaults(this, defaults, options);
};

Floor.height = 6;

var Elevator = function(options) {
    var defaults = {
        y: 0, // Floor number rises upwards
        x: 0
    };
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

Elevator.prototype.render = function(ctx, numFloors) {
    ctx.save();
    var drawY = (numFloors - this.y - 1) * Floor.height;
    ctx.translate(this.x, drawY);
    ctx.fillStyle = 'red';
    this.tilemap.render(ctx, function(tile) { return tile === 'o'; }, 0.05, 0.05);
    ctx.restore();
};

var Level = function() {
    this.tilemap = new TileMap({initTile: TileMap.initFromData(LevelTiles), height: LevelTiles.length, width: LevelTiles[0].length });
    this.numFloors = Math.floor(this.tilemap.height / Floor.height);
    this.elevator = new Elevator({x: 18});
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
    
};