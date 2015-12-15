'use strict';

/**
 * A class to help keeping canvas size suitable for the window or parent
 * element size and screen resolution.
 * @constructor
 * @param {Object} options Object with the following optional keys:
 *  canvas: HTMLCanvasElement (one is created by default)
 *  mode: CanvasResizer.Mode (defaults to filling the window)
 *  width: number Width of the coordinate space.
 *  height: number Height of the coordinate space.
 *  parentElement: HTMLElement (defaults to the document body)
 *  wrapperElement: HTMLElement Optional wrapper element that tightly wraps
 *      the canvas. Useful for implementing HTML-based UI on top of the canvas.
 *      The wrapper element should already be the parent of the canvas when it
 *      is passed in.
 */
var CanvasResizer = function(options) {
    var defaults = {
        canvas: null,
        mode: CanvasResizer.Mode.DYNAMIC,
        width: 16,
        height: 9,
        parentElement: document.body,
        wrapperElement: null
    };

    for(var key in defaults) {
        if (!options.hasOwnProperty(key)) {
            this[key] = defaults[key];
        } else {
            this[key] = options[key];
        }
    }
    if (this.canvas !== null) {
        if (!options.hasOwnProperty('width')) {
            this.width = this.canvas.width;
        }
        if (!options.hasOwnProperty('height')) {
            this.height = this.canvas.height;
        }
    } else {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }
    
    this.canvasWidthToHeight = this.width / this.height;

    if (this.mode === CanvasResizer.Mode.FIXED_RESOLUTION) {
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    var that = this;
    var resize = function() {
        that.resize();
    }
    if (this.parentElement === document.body) {
        document.body.style.padding = '0';
        document.body.style.margin = '0';
        document.body.style.overflow = 'hidden';
    } else {
        this.parentElement.style.padding = '0';
    }
    // No need to remove the object from existing parent if it has one
    if (this.wrapperElement === null) {
        this.parentElement.appendChild(this.canvas);
    } else {
        this.parentElement.appendChild(this.wrapperElement);
        // Assume that wrapper already wraps the canvas - don't re-append the
        // canvas to the wrapper since the wrapper might have other children.
    }
    window.addEventListener('resize', resize, false);
    this.resize();
    this._scale = 1.0;
    this._wrapCtx = null; // Wrapper context for coordinate system change
    this._wrapCtxPixelate = null; // Wrapper context for automatically aligning pixel art
    this._copyCanvas = null; // For upscaling pixelated copy of the image
};

/**
 * Create a wrapper for an object that forwards method calls and set/get on properties.
 * @param {Object} toWrap Object to wrap.
 * @param {function()=} excludeFromForwarding Function that takes a key string and returns true if it should be
 *                      excluded from forwarding. Defaults to not excluding anything.
 * @return {Object} Wrapped object.
 */
CanvasResizer.wrap = function(toWrap, excludeFromForwarding) {
    if (excludeFromForwarding === undefined) {
        excludeFromForwarding = function() { return false; };
    }
    var wrapper = {};
    for (var prop in toWrap) {
        (function(p) {
            if (!excludeFromForwarding(p)) {
                if (typeof toWrap[p] == 'function') {
                    wrapper[p] = function() {
                        toWrap[p].apply(toWrap, arguments); 
                    };
                } else  {
                    Object.defineProperty(wrapper, p, {
                        get: function() { return toWrap[p]; },
                        set: function(v) { toWrap[p] = v; }
                    });
                }
            }
        })(prop);
    }
    return wrapper;
};

CanvasResizer.Mode = {
    // Fixed amount of pixels, rendered pixelated:
    FIXED_RESOLUTION: 0,
    // Fixed amount of pixels, rendered interpolated:
    FIXED_RESOLUTION_INTERPOLATED: 1,
    // Only available for 2D canvas. Set the canvas transform on render to
    // emulate a fixed coordinate system:
    FIXED_COORDINATE_SYSTEM: 2,
    // Fix the aspect ratio, but not the exact width/height of the coordinate
    // space:
    FIXED_ASPECT_RATIO: 3,
    // Make the canvas fill the containing element completely, with the
    // coordinate space being set according to the canvas dimensions:
    DYNAMIC: 4
};

/**
 * Resize callback.
 */
CanvasResizer.prototype.resize = function() {
    // Resize only on a render call to avoid flicker from changing canvas
    // size.
    this.resizeOnNextRender = true;
};

/**
 * Do nothing. This function exists just for mainloop.js compatibility.
 */
CanvasResizer.prototype.update = function() {
};

/**
 * @return {Object} An object with render() and update() functions. render() will display an upscaled pixelated
 * canvas instead of the regular CanvasResizer canvas when supporting the CanvasResizer mode requires that.
 */
CanvasResizer.prototype.pixelator = function() {
    var that = this;
    var gl;
    var tex;
    var initCopyCanvas = function() {
        that._copyCanvas = document.createElement('canvas');
        gl = that._copyCanvas.getContext('webgl') || that._copyCanvas.getContext('experimental-webgl');
        if (gl) {
            // Shaders
            var vertSrc = [
                'attribute vec2 aVertexPosition;',
                'varying vec2 vTexCoord;',
                'void main() {',
                '    gl_Position = vec4(aVertexPosition * 2.0 - vec2(1.0), 0.0, 1.0);',
                '    vTexCoord = vec2(aVertexPosition.x, 1.0 - aVertexPosition.y);',
                '}'
            ].join('\n');
            var fragSrc = [
                'precision mediump float;',
                'uniform sampler2D uTex;',
                'varying vec2 vTexCoord;',
                'void main() {',
                '    gl_FragColor = texture2D(uTex, vTexCoord);',
                '}'
            ].join('\n');
            var positionAttribLocation = 0;
            var vertShader = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vertShader, vertSrc);
            gl.compileShader(vertShader);
            var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fragShader, fragSrc);
            gl.compileShader(fragShader);
            var program = gl.createProgram();
            gl.attachShader(program, vertShader);
            gl.attachShader(program, fragShader);
            gl.bindAttribLocation(program, positionAttribLocation, "aVertexPosition");
            gl.linkProgram(program);
            gl.useProgram(program);
            if (gl.getProgramParameter(program, gl.LINK_STATUS) === 0) {
                gl = null;
                return;
            }
            
            // Vertex buffer
            var positionData = new Float32Array([0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0]);
            var vertexBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.DYNAMIC_DRAW);
            gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(0);
            
            // Texture
            tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        }
    }
    var drawToCopyCanvas = function(canvas) {
        // Replace original canvas on page
        if (that.canvas.parentNode === that.parentElement) {
            that.parentElement.replaceChild(that._copyCanvas, that.canvas);
        }
        that._copyCanvas.width = that.canvas.width * that._canvasPixelationRatio;
        that._copyCanvas.height = that.canvas.height * that._canvasPixelationRatio;
        that._copyCanvas.style.marginLeft = that.canvas.style.marginLeft;
        that._copyCanvas.style.marginTop = that.canvas.style.marginTop;
        that._copyCanvas.style.width = that.canvas.style.width;
        that._copyCanvas.style.height = that.canvas.style.height;
        gl.viewport(0, 0, that._copyCanvas.width, that._copyCanvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, that.canvas);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    return {
        update: function() {},
        render: function() {
            if (that.mode === CanvasResizer.Mode.FIXED_RESOLUTION) {
                if (!that.canvas.style.imageRendering) {
                    if (!that._copyCanvas) {
                        initCopyCanvas();
                    }
                    if (gl) {
                        drawToCopyCanvas(that.canvas);
                    }
                }
            }
            else if (that._copyCanvas && that._copyCanvas.parentNode === that.parentElement) {
                that.parentElement.replaceChild(that.canvas, that._copyCanvas);
            }
        }
    }
};

/**
 * Call this function in the beginning of rendering a frame to update
 * the canvas size. Compatible with mainloop.js.
 */
CanvasResizer.prototype.render = function() {
    if (this.resizeOnNextRender) {
        var parentProperties = this._getParentProperties();
        var parentWidth = parentProperties.width;
        var parentHeight = parentProperties.height;
        var parentWidthToHeight = parentProperties.widthToHeight;
        if (this.mode === CanvasResizer.Mode.FIXED_RESOLUTION ||
            this.mode === CanvasResizer.Mode.FIXED_RESOLUTION_INTERPOLATED) {
            this._resizeFixedResolution();
        } else if (this.mode === CanvasResizer.Mode.FIXED_COORDINATE_SYSTEM ||
                   this.mode === CanvasResizer.Mode.FIXED_ASPECT_RATIO) {
            if (parentWidthToHeight > this.canvasWidthToHeight) {
                // Parent is wider, so there will be empty space on the left and right
                this.canvas.height = parentHeight;
                this.canvas.width = Math.floor(this.canvasWidthToHeight * this.canvas.height);
                this.canvas.style.marginTop = '0';
                this.canvas.style.marginLeft = Math.round((parentWidth - this.canvas.width) * 0.5) + 'px';
            } else {
                // Parent is narrower, so there will be empty space on the top and bottom
                this.canvas.width = parentWidth;
                this.canvas.height = Math.floor(this.canvas.width / this.canvasWidthToHeight);
                this.canvas.style.marginTop = Math.round((parentHeight - this.canvas.height) * 0.5) + 'px';
                this.canvas.style.marginLeft = '0';
            }
            this.canvas.style.width = this.canvas.width + 'px';
            this.canvas.style.height = this.canvas.height + 'px';
            this.canvas.style.marginBottom = '-5px'; // This is to work around a bug in Firefox 38
        } else { // CanvasResizer.Mode.DYNAMIC
            this.canvas.width = parentWidth;
            this.canvas.height = parentHeight;
            this.canvas.style.width = parentWidth + 'px';
            this.canvas.style.height = parentHeight + 'px';
            this.canvas.style.marginTop = '0';
            this.canvas.style.marginLeft = '0';
        }
        if (this.wrapperElement !== null) {
            this.wrapperElement.style.width = this.canvas.style.width;
            this.wrapperElement.style.height = this.canvas.style.height;
            this.wrapperElement.style.marginTop = this.canvas.style.marginTop;
            this.wrapperElement.style.marginLeft = this.canvas.style.marginLeft;
            this.canvas.style.marginTop = '0';
            this.canvas.style.marginLeft = '0';
        }
        this.resizeOnNextRender = false;
    }
    if (this.mode == CanvasResizer.Mode.FIXED_COORDINATE_SYSTEM) {
        var ctx = this.canvas.getContext('2d');
        var scale = this.canvas.width / this.width;
        ctx.setTransform(scale, 0, 0, scale, 0, 0);

        // Wrap the context so that when ctx.canvas.width/height is queried, they return the coordinate system width/height.
        if (this._wrapCtx == null) {
            var wrapCtx = CanvasResizer.wrap(ctx, function(prop) {
                return (prop.indexOf('webkit') === 0 || prop === 'canvas');
            });

            wrapCtx.canvas = {};
            var that = this;
            Object.defineProperty(wrapCtx.canvas, 'width', {
                get: function() { return that.width; }
            });
            Object.defineProperty(wrapCtx.canvas, 'height', {
                get: function() { return that.height; }
            });
            this._wrapCtx = wrapCtx;
        }
        return this._wrapCtx;
    }
    if (this.mode == CanvasResizer.Mode.FIXED_RESOLUTION) {
        var ctx = this.canvas.getContext('2d');
        if (this._wrapCtxPixelate == null) {
            var pixelatingStack = [true];
            var wrapCtx = CanvasResizer.wrap(ctx, function(prop) {
                return (prop.indexOf('webkit') === 0 || 
                       prop == 'translate' || prop == 'scale' || prop == 'rotate' ||
                       prop == 'transform' || prop == 'setTransform' ||
                       prop == 'save' || prop == 'restore');
            });
            wrapCtx.translate = function(x, y) {
                if (pixelatingStack[pixelatingStack.length - 1]) {
                    ctx.translate(Math.round(x), Math.round(y));
                } else {
                    ctx.translate(x, y);
                }
            };
            wrapCtx.scale = function(x, y) {
                if (Math.round(x) !== x || Math.round(y) !== y) {
                    pixelatingStack[pixelatingStack.length - 1] = false;
                }
                ctx.scale(x, y);
            };
            wrapCtx.rotate = function(angle) {
                if (angle !== 0) {
                    pixelatingStack[pixelatingStack.length - 1] = false;
                }
                ctx.rotate(angle);
            };
            wrapCtx.transform = function(a, b, c, d, e, f) {
                pixelatingStack[pixelatingStack.length - 1] = false;
                ctx.transform(a, b, c, d, e, f);
            };
            wrapCtx.setTransform = function(a, b, c, d, e, f) {
                pixelatingStack[pixelatingStack.length - 1] = false;
                ctx.setTransform(a, b, c, d, e, f);
            };
            wrapCtx.save = function() {
                pixelatingStack.push(pixelatingStack[pixelatingStack.length - 1]);
                ctx.save();
            };
            wrapCtx.restore = function() {
                pixelatingStack.pop();
                ctx.restore();
            };
            this._wrapCtxPixelate = wrapCtx;
        }
        return this._wrapCtxPixelate;
    }
};

/**
 * Get a canvas coordinate space position from a given event. The coordinate
 * space is relative to the width and height properties of the canvas.
 * @param {MouseEvent|PointerEvent|TouchEvent} Event to get the position from.
 * In case of a touch event, the position is retrieved from the first touch
 * point.
 * @return {Object} Object with x and y keys for horizontal and vertical
 * positions in the canvas coordinate space.
 */
CanvasResizer.prototype.getCanvasPosition = function(event) {
    var rect = this.canvas.getBoundingClientRect();
    var x, y;
    if (event.touches !== undefined && event.touches.length > 0) {
        x = event.touches[0].clientX;
        y = event.touches[0].clientY;
    } else {
        x = event.clientX;
        y = event.clientY;
    }
    // +0.5 to position the coordinates to the pixel center.
    var xRel = x - rect.left + 0.5;
    var yRel = y - rect.top + 0.5;
    var coordWidth = this.canvas.width;
    var coordHeight = this.canvas.height;
    if (this.mode == CanvasResizer.Mode.FIXED_COORDINATE_SYSTEM) {
        coordWidth = this.width;
        coordHeight = this.height;
    }
    if (rect.width != coordWidth) {
        xRel *= coordWidth / rect.width;
        yRel *= coordHeight / rect.height;
    }
    if (typeof Vec2 !== 'undefined') {
        return new Vec2(xRel, yRel);
    } else {
        return {x: xRel, y: yRel};
    }
};

/**
 * @return {HTMLCanvasElement} The canvas element this resizer is using.
 * If no canvas element was passed in on creation, one has been created.
 */
CanvasResizer.prototype.getCanvas = function() {
    return this.canvas;
};

/**
 * Set the dimensions of the canvas coordinate space. Note that this has no
 * effect when the mode is DYNAMIC. If the mode is FIXED_ASPECT_RATIO, the
 * aspect ratio is set based on the width and height.
 * @param {number} width New width for the canvas element.
 * @param {number} height New height for the canvas element.
 */
CanvasResizer.prototype.changeCanvasDimensions = function(width, height) {
    this.width = width;
    this.height = height;
    this.canvasWidthToHeight = this.width / this.height;
    this.resize();
};

/**
 * Change the resizing mode.
 * @param {CanvasResizer.Mode} mode New mode to use.
 */
CanvasResizer.prototype.changeMode = function(mode) {
    this.mode = mode;
    if ('imageRendering' in this.canvas.style) {
        this.canvas.style.imageRendering = 'auto';
    }
    this.resize();
};

/**
 * @return {number} the scale at which the canvas coordinate space is drawn.
 */
CanvasResizer.prototype.getScale = function() {
    if (this.mode === CanvasResizer.Mode.FIXED_COORDINATE_SYSTEM) {
        return this.canvas.width / this.width;
    } else if (this.mode === CanvasResizer.Mode.FIXED_RESOLUTION ||
               this.mode === CanvasResizer.Mode.FIXED_RESOLUTION_INTERPOLATED)
    {
        return this._scale;
    } else {
        return 1.0;
    }
};

/**
 * Get properties of the containing element.
 * @return {Object} Object containing keys width, height, and widthToHeight.
 * @protected
 */
CanvasResizer.prototype._getParentProperties = function() {
    var parentProperties = {};
    if (this.parentElement === document.body) {
        parentProperties.width = window.innerWidth;
        parentProperties.height = window.innerHeight;
    } else {
        parentProperties.width = this.parentElement.clientWidth;
        parentProperties.height = this.parentElement.clientHeight;
    }
    parentProperties.widthToHeight = parentProperties.width / parentProperties.height;
    return parentProperties;
};

/**
 * Resize the canvas in one of the fixed resolution modes.
 * @protected
 */
CanvasResizer.prototype._resizeFixedResolution = function() {
    if (this.mode !== CanvasResizer.Mode.FIXED_RESOLUTION &&
        this.mode !== CanvasResizer.Mode.FIXED_RESOLUTION_INTERPOLATED) {
        return;
    }
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    var parentProperties = this._getParentProperties();
    var parentWidth = parentProperties.width;
    var parentHeight = parentProperties.height;
    var parentWidthToHeight = parentProperties.widthToHeight;
    var styleWidth = 0;
    var styleHeight = 0;
    if (this.mode === CanvasResizer.Mode.FIXED_RESOLUTION) {
        var maxWidth = parentWidth * window.devicePixelRatio;
        var maxHeight = parentHeight * window.devicePixelRatio;
        if (this.canvas.width > maxWidth || this.canvas.height > maxHeight) {
            if (parentWidthToHeight > this.canvasWidthToHeight) {
                styleHeight = parentHeight;
                styleWidth = Math.floor(this.canvasWidthToHeight * styleHeight);
            } else {
                styleWidth = parentWidth;
                styleHeight = Math.floor(styleWidth / this.canvasWidthToHeight);
            }
            if ('imageRendering' in this.canvas.style) {
                this.canvas.style.imageRendering = 'auto';
            }
        } else {
            var i = 1;
            while ((i + 1) * this.width <= maxWidth && (i + 1) * this.height <= maxHeight) {
                ++i;
            }
            this._canvasPixelationRatio = i;
            styleWidth = (this.width * i) / window.devicePixelRatio;
            styleHeight = (this.height * i) / window.devicePixelRatio;
            if ('imageRendering' in this.canvas.style) {
                this.canvas.style.imageRendering = 'pixelated';
                if (!this.canvas.style.imageRendering || this.canvas.style.imageRendering === 'auto') {
                    this.canvas.style.imageRendering = '-moz-crisp-edges';
                }
                if (!this.canvas.style.imageRendering || this.canvas.style.imageRendering === 'auto') {
                    this.canvas.style.imageRendering = '-webkit-optimize-contrast';
                }
            }
        }
    } else if (this.mode === CanvasResizer.Mode.FIXED_RESOLUTION_INTERPOLATED) {
        if (parentWidthToHeight > this.canvasWidthToHeight) {
            styleHeight = parentHeight;
            styleWidth = Math.floor(this.canvasWidthToHeight * styleHeight);
        } else {
            styleWidth = parentWidth;
            styleHeight = Math.floor(styleWidth / this.canvasWidthToHeight);
        }
    }
    this.canvas.style.width = styleWidth + 'px';
    this.canvas.style.height = styleHeight + 'px';
    this._scale = styleHeight / this.canvas.height;
    this.canvas.style.marginLeft = Math.round((parentWidth - styleWidth) * 0.5) + 'px';
    this.canvas.style.marginTop = Math.round((parentHeight - styleHeight) * 0.5) + 'px';
    this.canvas.style.marginBottom = '-5px'; // This is to work around a bug in Firefox 38
};
