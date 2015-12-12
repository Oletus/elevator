'use strict';

/**
 * Loading bar.
 * @param {Array.<Object>=} objectsToPoll Objects that contain loadedFraction()
 * function that returns 1 when the object is fully loaded.
 * @constructor
 */
var LoadingBar = function(objectsToPoll) {
    if (objectsToPoll === undefined) {
        objectsToPoll = [];
        if (typeof Sprite !== 'undefined') {
            objectsToPoll.push(Sprite);
        }
        if (typeof Audio !== 'undefined') {
            objectsToPoll.push(Audio);
        }
    }
    this.objectsToPoll = objectsToPoll;
    this.loadedFraction = 0;
    this.allLoaded = false;
    this.sinceLoaded = 0;
    this.sinceStarted = 0;
};

/**
 * @param {number} deltaTime Time passed from the last frame.
 * @return {boolean} True when fully loaded.
 */
LoadingBar.prototype.update = function(deltaTime) {
    this.sinceStarted += deltaTime;
    if (this.allLoaded) {
        this.sinceLoaded += deltaTime;
        return this.allLoaded;
    }
    this.loadedFraction = 0;
    this.allLoaded = true;
    for (var i = 0; i < this.objectsToPoll.length; ++i) {
        // 'loadedFraction' function name specified as string to support Closure compiler.
        var loadedFraction = this.objectsToPoll[i]['loadedFraction']();
        if (loadedFraction < 1) {
            this.allLoaded = false;
        }
        this.loadedFraction += Math.min(loadedFraction, 1.0) / this.objectsToPoll.length;
    }
    return this.allLoaded;
};

/**
 * @return {boolean} True when fully loaded.
 */
LoadingBar.prototype.finished = function() {
    return this.allLoaded;
};

/**
 * Draw the loading bar.
 * @param {CanvasRenderingContext2D} ctx Context to draw the loading bar to.
 */
LoadingBar.prototype.render = function(ctx) {
    if (this.sinceLoaded < 1.0) {
        ctx.save();
        ctx.globalAlpha = Math.min(1.0, (1.0 - this.sinceLoaded) * 1.5);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.translate(ctx.canvas.width * 0.5, ctx.canvas.height * 0.5);
        ctx.fillStyle = '#fff';
        ctx.fillRect(-100, -25, 200, 50);
        ctx.fillStyle = '#000';
        ctx.fillRect(-95, -20, 190, 40);
        ctx.fillStyle = '#fff';
        // Fake some loading animation even if loading doesn't really take any time.
        ctx.fillRect(-90, -15, 180 * Math.min(this.loadedFraction, this.sinceStarted * 4), 30);
        ctx.restore();
    }
};
