

var BitmapFont = function() {
    this.sprite = new Sprite('bitmapfont.png');
    this.charactersPerRow = 32;
    this.characterHeight = 6;
    this.characterWidth = 4;
};

BitmapFont.prototype.drawCharacter = function(ctx, character) {
    var code = character.charCodeAt(0);
    var row = Math.floor(code / this.charactersPerRow);
    var col = code - (row * this.charactersPerRow);
    if (this.sprite.loaded) {
        ctx.drawImage(this.sprite.img,
                      col * this.characterWidth, row * this.characterHeight,
                      this.characterWidth, this.characterHeight,
                      0, 0,
                      this.characterWidth, this.characterHeight);
    }
};

BitmapFont.prototype.drawText = function(ctx, string, x, y) {
    ctx.save();
    ctx.translate(x, y);
    var drawnWidth = string.length * this.characterWidth;
    if (ctx.textAlign == 'center') {
        ctx.translate(-Math.floor(drawnWidth * 0.5), 0);
    } else if (ctx.textAlign == 'right') {
        ctx.translate(-Math.floor(drawnWidth), 0);
    }
    for (var i = 0; i < string.length; ++i) {
        this.drawCharacter(ctx, string[i]);
        ctx.translate(this.characterWidth, 0);
    }
    ctx.restore();
};
