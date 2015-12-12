'use strict';

/**
 * Helpers for doing platforming physics, including tile classes and a function to evaluate movement with collisions.
 * Using the platforming physics classes requires TileMap.
 */
var PlatformingPhysics = {};
 
/**
 * A platforming tile.
 * @constructor
 */
var PlatformingTile = function() {
};

/**
 * @return {number} floor height inside sloping tile.
 */
PlatformingTile.prototype.getFloorRelativeHeight = function(xInTile) {
    return 0.0;
};

/**
 * Set the position of the tile.
 */
PlatformingTile.prototype.setPos = function(x, y) {
    this._x = x;
    this._y = y;
};

/**
 * @return {number} maximum floor height inside sloping tile.
 */
PlatformingTile.prototype.getMaxFloorRelativeHeight = function() {
    return Math.max(this.getFloorRelativeHeight(0), this.getFloorRelativeHeight(1));
};

/**
 * @return {boolean} True if the tile is a wall for movement towards any direction.
 */
PlatformingTile.prototype.isWall = function() {
    return false;
};

/**
 * @return {boolean} True if the tile is a wall for upwards movement (negative y).
 */
PlatformingTile.prototype.isWallUp = function() {
    return false;
};

/**
 * @return {boolean} True if the tile is sloped for objects moving above it.
 */
PlatformingTile.prototype.isFloorSlope = function() {
    return false;
};


/**
 * A tile with a sloped floor.
 * @constructor
 */
var SlopedFloorTile = function(floorLeft, floorRight) {
    this._floorLeft = floorLeft;
    this._floorRight = floorRight;
    this._maxFloor = Math.max(floorLeft, floorRight);
    this._minFloor = Math.min(floorLeft, floorRight);
};

SlopedFloorTile.prototype = new PlatformingTile();

/**
 * @return {number} floor height inside sloping tile. Must be monotonically increasing or decreasing inside the tile.
 */
SlopedFloorTile.prototype.getFloorRelativeHeight = function(xInTile) {
    return mathUtil.clamp(this._minFloor, this._maxFloor, mathUtil.mix(this._floorLeft, this._floorRight, xInTile));
};

/**
 * @return {boolean} True if the tile is sloped for objects moving above it.
 */
SlopedFloorTile.prototype.isFloorSlope = function() {
    return true;
};

/**
 * Render the sloped tile on a canvas.
 * @param {CanvasRenderingContext2D} ctx 2D rendering context to use for drawing.
 */
SlopedFloorTile.prototype.render = function(ctx) {
    ctx.beginPath();
    ctx.moveTo(this._x, this._y + 1);
    for (var x = 0; x <= 1; x += 0.25) {
        var h = mathUtil.clamp(0, 1, this.getFloorRelativeHeight(x));
        ctx.lineTo(this._x + x, this._y + 1 - h);
    }
    ctx.lineTo(this._x + 1, this._y + 1);
    ctx.fill();
};

/**
 * A tile that's a wall.
 * @constructor
 * @param {boolean} wallUp True if the wall affects upwards movement (negative y).
 */
var WallTile = function(wallUp) {
    if (wallUp === undefined) {
        wallUp = true;
    }
    this._wallUp = wallUp;
};

WallTile.prototype = new PlatformingTile();

/**
 * @return {boolean} True if the tile is a wall for movement towards any direction.
 */
WallTile.prototype.isWall = function() {
    return true;
};

/**
 * @return {boolean} True if the tile is a wall for upwards movement (negative y).
 */
WallTile.prototype.isWallUp = function() {
    return this._wallUp;
};


/**
 * Get a tile map initializer based on an array of character codes representing tiles.
 * @param {Array} data Tile letter codes in an array in row-major form. Example:
 *         ['xxx.      /xxx ',
 *          '  xx^^^^^^xx   '],
 *     Character codes are:
 *         x: wall.
 *         ^: can be jumped through from below, not passable from above.
 *         .: 45 degree slope rising towards left.
 *         /: 45 degree slope rising towards right.
 *         l: low 26 degree slope rising towards left.
 *         L: high 26 degree slope rising towards left.
 *         r: low 26 degree slope rising towards right.
 *         R: high 26 degree slope rising towards right.
 *          : empty space.
 *
 * @param {boolean?} flippedX Set to true to flip the data in the x direction.
 * @return {function} Function that will initialize a TileMap with PlatformingTiles.
 */
PlatformingPhysics.initFromData = function(data, flippedX) {
    if (flippedX === undefined) {
        flippedX = false;
    }
    var transformedData = [];
    for (var i = 0; i < data.length; ++i) {
        var row = data[i];
        var transformedRow = [];
        for (var j = 0; j < row.length; ++j) {
            var tile = null;
            if (row[j] == 'x') {
                tile = new WallTile(true);
            } else if (row[j] == '^') {
                tile = new WallTile(false);
            } else if ((row[j] == '/' && !flippedX) || (row[j] == '.' && flippedX)) {
                tile = new SlopedFloorTile(0, 1);
            } else if ((row[j] == '.' && !flippedX) || (row[j] == '/' && flippedX)) {
                tile = new SlopedFloorTile(1, 0);
            } else if ((row[j] == 'L' && !flippedX) || (row[j] == 'R' && flippedX)) {
                tile = new SlopedFloorTile(1, 0.5);
            } else if ((row[j] == 'R' && !flippedX) || (row[j] == 'L' && flippedX)) {
                tile = new SlopedFloorTile(0.5, 1);
            } else if ((row[j] == 'l' && !flippedX) || (row[j] == 'r' && flippedX)) {
                tile = new SlopedFloorTile(0.5, 0);
            } else if ((row[j] == 'r' && !flippedX) || (row[j] == 'l' && flippedX)) {
                tile = new SlopedFloorTile(0, 0.5);
            } else  {
                tile = new PlatformingTile();
            }
            var x = j;
            if (flippedX) {
                x = row.length - j - 1;
            }
            tile.setPos(x, i);
            transformedRow.push(tile);
        }
        transformedData.push(transformedRow);
    }
    return TileMap.initFromData(transformedData, flippedX);
};


/**
 * Move an object along one axis, reacting to collisions.
 * @param {Object} movingObj Object that moves. Needs to have the following properties in the world coordinate system:
 *   x, y, dx, dy, getRect()
 * Properties to react to y collisions:
 *   touchGround(), touchCeiling()
 * @param {number} deltaTime Time step to use to move the object.
 * @param {string} dim Either 'x' or 'y' to move the object horizontally or vertically.
 * @param {Array?} colliders List of objects to collide against. The moved object is automatically excluded in case it
 * is in this array. Colliders must report coordinates relative to the world. The colliders can be one of two types:
 * A) Objects with a getRect() function returning the object's collision boundaries in the world.
 * B) TileMap objects built with PlatformingTile tiles.
 * @param {boolean} stayOnGround True if the character should try to follow the ground when going down on a slope.
 */
PlatformingPhysics.moveAndCollide = function(movingObj, deltaTime, dim, colliders, stayOnGround) {
    var maxStepUp = 0.1;
    var isWall = function(tile) {
        return tile.isWall();
    };
    var isWallUp = function(tile) {
        return tile.isWallUp();
    };
    var isFloorSlope = function(tile) {
        return tile.isFloorSlope();
    };
    var done = false;
    var delta = 0;
    if (dim == 'x') {
        delta = movingObj.dx * deltaTime;
    } else {
        delta = movingObj.dy * deltaTime;
    }
    var lastDelta = delta;
    while (!done) {
        var rect = movingObj.getRect();
        done = true;
        if (dim == 'x') {
            var rectRightHalfWidth = rect.right - movingObj.x;
            var rectLeftHalfWidth = movingObj.x - rect.left;
            var rectBottomHalfHeight = rect.bottom - movingObj.y;

            if (Math.abs(delta) > 0) {
                movingObj.x += delta;
                var xColliders = [];
                if (colliders !== undefined) {
                    for (var i = 0; i < colliders.length; ++i) {
                        if (colliders[i] === movingObj) {
                            continue;
                        }
                        var collider = colliders[i].getRect();
                        if (rect.top < collider.bottom && collider.top < rect.bottom) {
                            if (colliders[i] instanceof TileMap) {
                                xColliders.push(colliders[i]);
                            } else {
                                xColliders.push(collider);
                            }
                        }
                    }
                }
                var slopeFloorY = movingObj.y + rectBottomHalfHeight + TileMap.epsilon * 2;
                if (delta > 0) {
                    var wallX = movingObj.x + rectRightHalfWidth + TileMap.epsilon * 2;
                    var slopeEndX = wallX;
                    for (var i = 0; i < xColliders.length; ++i) {
                        if (xColliders[i] instanceof TileMap) {
                            var fromWorldToTileMap = new Vec2(-xColliders[i].worldPos.x, -xColliders[i].worldPos.y);
                            var relativeRect = new Rect(rect.left, rect.right, rect.top, rect.bottom);
                            relativeRect.translate(fromWorldToTileMap);
                            var wallTileX = xColliders[i].nearestTileRightFromRect(relativeRect, isWallUp, Math.abs(delta));
                            if (wallTileX != -1 && wallX > wallTileX + xColliders[i].worldPos.x) {
                                wallX = wallTileX + xColliders[i].worldPos.x;
                            }
                            var slopeTiles = xColliders[i].getNearestTilesRightFromRect(relativeRect, isFloorSlope, Math.abs(delta));
                            if (slopeTiles.length != 0) {
                                var possibleWallX = slopeTiles[0]._x + xColliders[i].worldPos.x;
                                for (var j = 0; j < slopeTiles.length; ++j) {
                                    var slopeTile = slopeTiles[j];
                                    var slopeBaseY = slopeTile._y + 1 + xColliders[i].worldPos.y;
                                    var slopeIsEffectivelyWall = (slopeBaseY - slopeTile.getFloorRelativeHeight(0) < rect.bottom - maxStepUp);
                                    if (wallX > possibleWallX && slopeIsEffectivelyWall) {
                                        wallX = possibleWallX;
                                    }
                                    if (!slopeIsEffectivelyWall) {
                                        slopeEndX = slopeTile._x + 1 + xColliders[i].worldPos.x;
                                        var relativeX = movingObj.x - (slopeEndX - 1);
                                        var slopeYRight = slopeBaseY -
                                            slopeTile.getFloorRelativeHeight(relativeX + rectRightHalfWidth);
                                        if (slopeFloorY > slopeYRight) {
                                            slopeFloorY = slopeYRight;
                                        }
                                    }
                                }
                            }
                        } else {
                            if (xColliders[i].right > rect.left && wallX > xColliders[i].left) {
                                wallX = xColliders[i].left;
                            }
                        }
                    }
                    if (movingObj.x > slopeEndX - rectRightHalfWidth + TileMap.epsilon * 2) {
                        var afterOriginalMove = movingObj.x;
                        movingObj.x = slopeEndX - rectRightHalfWidth + TileMap.epsilon * 2;
                        delta = afterOriginalMove - movingObj.x;
                        // Finish this iteration on the tile boundary and continue movement on the next slope tile.
                        if (delta > TileMap.epsilon * 2 && delta < lastDelta) {
                            done = false;
                            lastDelta = delta;
                        }
                    }
                    if (movingObj.y > slopeFloorY - rectBottomHalfHeight - TileMap.epsilon) {
                        movingObj.y = slopeFloorY - rectBottomHalfHeight - TileMap.epsilon;
                    }
                    // Apply walls only when movement is done. When moving along a slope, the code may have placed
                    // the object right beyond the tile boundary for the next iteration so that movement wouldn't
                    // be stuck in a case like below:
                    //         /
                    //  obj-> /x
                    if (movingObj.x > wallX - rectRightHalfWidth - TileMap.epsilon && done) {
                        movingObj.x = wallX - rectRightHalfWidth - TileMap.epsilon;
                    }
                } else {
                    var wallX = movingObj.x - rectLeftHalfWidth - TileMap.epsilon * 2;
                    var slopeEndX = wallX;
                    for (var i = 0; i < xColliders.length; ++i) {
                        if (xColliders[i] instanceof TileMap) {
                            var fromWorldToTileMap = new Vec2(-xColliders[i].worldPos.x, -xColliders[i].worldPos.y);
                            var relativeRect = new Rect(rect.left, rect.right, rect.top, rect.bottom);
                            relativeRect.translate(fromWorldToTileMap);
                            var wallTileX = xColliders[i].nearestTileLeftFromRect(relativeRect, isWallUp, Math.abs(delta));
                            if (wallTileX != -1 && wallX < wallTileX + 1 + xColliders[i].worldPos.x) {
                                wallX = wallTileX + 1 + xColliders[i].worldPos.x;
                            }
                            var slopeTiles = xColliders[i].getNearestTilesLeftFromRect(relativeRect, isFloorSlope, Math.abs(delta));
                            if (slopeTiles.length != 0) {
                                var possibleWallX = slopeTiles[0]._x + 1 + xColliders[i].worldPos.x;
                                for (var j = 0; j < slopeTiles.length; ++j) {
                                    var slopeTile = slopeTiles[j];
                                    var slopeBaseY = slopeTile._y + 1 + xColliders[i].worldPos.y;
                                    var slopeIsEffectivelyWall = (slopeBaseY - slopeTile.getFloorRelativeHeight(1) < rect.bottom - maxStepUp);
                                    if (wallX < possibleWallX && slopeIsEffectivelyWall) {
                                        wallX = possibleWallX;
                                    }
                                    if (!slopeIsEffectivelyWall) {
                                        slopeEndX = slopeTile._x + xColliders[i].worldPos.x;
                                        var relativeX = movingObj.x - slopeEndX;
                                        var slopeYRight = slopeBaseY -
                                            slopeTile.getFloorRelativeHeight(relativeX - rectLeftHalfWidth);
                                        if (slopeFloorY > slopeYRight) {
                                            slopeFloorY = slopeYRight;
                                        }
                                    }
                                }
                            }
                        } else {
                            if (xColliders[i].left < rect.right && wallX < xColliders[i].right) {
                                wallX = xColliders[i].right;
                            }
                        }
                    }
                    if (movingObj.x < slopeEndX + rectLeftHalfWidth - TileMap.epsilon * 2) {
                        var afterOriginalMove = movingObj.x;
                        movingObj.x = slopeEndX + rectLeftHalfWidth - TileMap.epsilon * 2;
                        delta = afterOriginalMove - movingObj.x;
                        // Finish this iteration on the tile boundary and continue movement on the next slope tile.
                        if (delta < -TileMap.epsilon * 2 && delta > lastDelta) {
                            done = false;
                            lastDelta = delta;
                        }
                    }
                    if (movingObj.y > slopeFloorY - rectBottomHalfHeight - TileMap.epsilon) {
                        movingObj.y = slopeFloorY - rectBottomHalfHeight - TileMap.epsilon;
                    }
                    // Apply walls only when movement is done. When moving along a slope, the code may have placed
                    // the object right beyond the tile boundary for the next iteration so that movement wouldn't
                    // be stuck in a case like below:
                    // .
                    // x. <- obj
                    if (movingObj.x < wallX + rectLeftHalfWidth + TileMap.epsilon && done) {
                        movingObj.x = wallX + rectLeftHalfWidth + TileMap.epsilon;
                    }
                }
            }
        }
        if (dim == 'y') {
            var delta = movingObj.dy * deltaTime;
            var rectBottomHalfHeight = rect.bottom - movingObj.y;
            var rectTopHalfHeight = movingObj.y - rect.top;
            var rectRightHalfWidth = rect.right - movingObj.x;
            var rectLeftHalfWidth = movingObj.x - rect.left;

            if (Math.abs(delta) > 0) {
                var lastY = movingObj.y;
                movingObj.y += delta;
                var yColliders = [];
                if (colliders !== undefined) {
                    for (var i = 0; i < colliders.length; ++i) {
                        if (colliders[i] === movingObj) {
                            continue;
                        }
                        var collider = colliders[i].getRect();
                        if (rect.left < collider.right && collider.left < rect.right) {
                            if (colliders[i] instanceof TileMap) {
                                yColliders.push(colliders[i]);
                            } else {
                                yColliders.push(collider);
                            }
                        }
                    }
                }
                if (delta > 0) {
                    var wallY = movingObj.y + rectBottomHalfHeight + 1 + TileMap.epsilon;
                    var hitSlope = false;
                    for (var i = 0; i < yColliders.length; ++i) {
                        if (yColliders[i] instanceof TileMap) {
                            var fromWorldToTileMap = new Vec2(-yColliders[i].worldPos.x, -yColliders[i].worldPos.y);
                            var relativeRect = new Rect(rect.left, rect.right, rect.top, rect.bottom);
                            relativeRect.translate(fromWorldToTileMap);
                            var origBottom = relativeRect.bottom;
                            relativeRect.bottom += 1;
                            var wallTileY = yColliders[i].nearestTileDownFromRect(relativeRect, isWall, Math.abs(delta));
                            if (wallTileY != -1 && wallY > wallTileY + yColliders[i].worldPos.y) {
                                wallY = wallTileY + yColliders[i].worldPos.y;
                                hitSlope = false;
                            }
                            relativeRect.bottom = origBottom;
                            var slopeTiles = yColliders[i].getNearestTilesDownFromRect(relativeRect, isFloorSlope,
                                                                                       Math.max(Math.abs(delta), 1));
                            if (slopeTiles.length != 0 && wallY > slopeTiles[0]._y + yColliders[i].worldPos.y) {
                                for (var j = 0; j < slopeTiles.length; ++j) {
                                    var slopeTile = slopeTiles[j];
                                    var relativeX = movingObj.x - (slopeTile._x + yColliders[i].worldPos.x);
                                    var slopeBaseY = slopeTile._y + 1 + yColliders[i].worldPos.y;
                                    var slopeYLeft = slopeBaseY -
                                                     slopeTile.getFloorRelativeHeight(relativeX - rectLeftHalfWidth);
                                    var slopeYRight = slopeBaseY -
                                                      slopeTile.getFloorRelativeHeight(relativeX + rectRightHalfWidth);
                                    if (slopeYLeft < wallY) {
                                        wallY = slopeYLeft;
                                        hitSlope = true;
                                    }
                                    if (slopeYRight < wallY) {
                                        wallY = slopeYRight;
                                        hitSlope = true;
                                    }
                                }
                            }
                        } else {
                            if (yColliders[i].bottom > rect.top && wallY > yColliders[i].top) {
                                wallY = yColliders[i].top;
                            }
                        }
                    }
                    if (movingObj.y > wallY - rectBottomHalfHeight - TileMap.epsilon) {
                        movingObj.y = wallY - rectBottomHalfHeight - TileMap.epsilon;
                        movingObj.touchGround();
                    } else if (hitSlope && stayOnGround) {
                        // TODO: There's still a bug where the character teleports downwards when there's a slope like this:
                        // .
                        // xl
                        movingObj.y = wallY - rectBottomHalfHeight - TileMap.epsilon;
                        movingObj.touchGround();
                    }
                } else {
                    var wallY = movingObj.y - rectTopHalfHeight - TileMap.epsilon * 2;
                    for (var i = 0; i < yColliders.length; ++i) {
                        if (yColliders[i] instanceof TileMap) {
                            var fromWorldToTileMap = new Vec2(-yColliders[i].worldPos.x, -yColliders[i].worldPos.y);
                            var relativeRect = new Rect(rect.left, rect.right, rect.top, rect.bottom);
                            relativeRect.translate(fromWorldToTileMap);
                            var wallTileY = yColliders[i].nearestTileUpFromRect(relativeRect, isWallUp, Math.abs(delta));
                            if (wallTileY != -1 && wallY < wallTileY + 1 + yColliders[i].worldPos.y) {
                                wallY = wallTileY + 1 + yColliders[i].worldPos.y;
                            }
                        } else {
                            if (yColliders[i].top < rect.bottom && wallY < yColliders[i].bottom) {
                                wallY = yColliders[i].bottom;
                            }
                        }
                    }
                    if (movingObj.y < wallY + rectTopHalfHeight + TileMap.epsilon) {
                        movingObj.y = wallY + rectTopHalfHeight + TileMap.epsilon;
                        movingObj.touchCeiling();
                    }
                }
            }
        }
    }
};

/**
 * Render sloped tiles to a canvas.
 * @param {TileMap} tileMap Map to render.
 * @param {CanvasRenderingContext2D} ctx 2D rendering context to use for drawing.
 */
PlatformingPhysics.renderSlopes = function(tileMap, ctx) {
    for (var y = 0; y < tileMap.height; ++y) {
        for (var x = 0; x < tileMap.width; ++x) {
            var tile = tileMap.tiles[y][x];
            if (tile.isFloorSlope()) {
                tile.render(ctx);
            }
        }
    }
};
