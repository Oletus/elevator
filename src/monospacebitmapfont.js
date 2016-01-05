'use strict';

/**
 * Monospace bitmap font that uses a simple ASCII grid sprite sheet.
 * @param {Object} options Constructor options.
 * @constructor
 */
var MonospaceBitmapFont = function(options) {
    var defaults = {
        spriteSrc: 'bitmapfont-tiny.png',
        characterHeight: 6,
        characterWidth: 4,
        charactersPerRow: undefined,
        color: undefined
    };
    objectUtil.initWithDefaults(this, defaults, options);
    if (this.color !== undefined) {
        this.sprite = new Sprite(this.spriteSrc, Sprite.turnSolidColored(this.color));
    } else {
        this.sprite = new Sprite(this.spriteSrc);
    }
};

/**
 * Draw a single character.
 * @param {CanvasRenderingContext2D} ctx Context to draw to.
 * @param {string} A single-character string to draw.
 */
MonospaceBitmapFont.prototype.drawCharacter = function(ctx, character) {
    if (this.sprite.loaded) {
        if (this.charactersPerRow === undefined) {
            this.charactersPerRow = this.sprite.width / this.characterWidth;
        }
        var code = character.charCodeAt(0);
        var row = Math.floor(code / this.charactersPerRow);
        var col = code - (row * this.charactersPerRow);
        ctx.drawImage(this.sprite.img,
                      col * this.characterWidth, row * this.characterHeight,
                      this.characterWidth, this.characterHeight,
                      0, 0,
                      this.characterWidth, this.characterHeight);
    }
};

/**
 * Draw a string of text. The "textAlign" property of the canvas context affects its placement.
 * @param {CanvasRenderingContext2D} ctx Context to draw to.
 * @param {string} string String to draw.
 * @param {number} x Horizontal coordinate.
 * @param {number} y Vertical coordinate.
 */
MonospaceBitmapFont.prototype.drawText = function(ctx, string, x, y) {
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
