
var FloorTiles = [
    'xxxxxxxxxxxxxxxxxxxxxxh        h',
    '                      h        h',
    '                      d        h',
    '                      d        h',
    '                      d        h',
    '                      d        h',
    '                      d        h',
    'xxxxxxxxxxxxxxxxxxxxxxh        h',
    'xxxxxxxxxxxxxxxxxxxxxxh        h'
];

var Floor = function(options) {
    var defaults = {
        floor: 0, // Floor number rises upwards
        name: 'Products',
        elevator: null,
        level: null
        canSpawn : true
    };
    objectUtil.initWithDefaults(this, defaults, options);
    this.tilemap = new TileMap({initTile: TileMap.initFromData(FloorTiles), height: FloorTiles.length, width: FloorTiles[0].length });
};

Floor.height = FloorTiles.length - 1;

Floor.prototype.render = function(ctx) {
    ctx.save();
    var drawY = this.level.getFloorTopY(this.floor);
    ctx.translate(0, drawY);
    ctx.fillStyle = '#222';
    this.tilemap.render(ctx, function(tile) { return tile === 'x'; }, 0.05, 0.05);
    ctx.fillStyle = '#888';
    this.tilemap.render(ctx, function(tile) { return tile === 'h'; }, 0.05, 0.05);
    ctx.globalAlpha = this.doorVisual;
    ctx.fillStyle = '#da4';
    this.tilemap.render(ctx, function(tile) { return tile === 'd'; }, 0.05, 0.05);
    
    ctx.globalAlpha = 1;
    ctx.translate(21, 3);
    ctx.scale(0.1, 0.1);
    ctx.fillStyle = 'black';
    var originalFont = ctx.font;
    ctx.textAlign = "right";
    ctx.font = "12px sans-serif";
    ctx.fillText(this.name, 0, 0);
    ctx.font = originalFont;
    
    ctx.restore();
};

Floor.prototype.update = function(deltaTime) {
    if (Math.round(this.elevator.floor) == this.floor) {
        this.doorOpen = this.elevator.doorOpen;
        this.doorVisual = this.elevator.doorVisual;
    }
};
