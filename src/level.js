
var TILE_WIDTH = 6;

var Level = function() {
    this.timeUntilSpawn = 0;
    this.time = 0;
    this.numFloors = 6;

    this.elevator = new Elevator({x: this.getFloorWidth(), level: this});
    this.floors = [];
    
    var shuffledFloors = arrayUtil.shuffle(GameData.floors);
    
    // Fixed, functional floors
    var floor;
    var randomIndex = Math.floor(Math.random() * this.numFloors);
    
    for (var i = 0; i < this.numFloors; ++i) {
        this.floors.push(this.createFloor(shuffledFloors[i], i));
    }
    this.characters = [];
    
    this.goToState(Level.State.IN_PROGRESS);
    
    this.characterMoveSpeed = 60;
    this.elevatorMoveSpeed = 4;
    this.elevatorDoorOpenTime = 0.3;
    
    this.score = 0;
    this.comboCount = 0;
    this.comboCharacters = [];
    this.stateTime = 0;
    
    this.particles = new ParticleEngine({
        gravityY: 240
    });
    
    this.levelOverFade = 0;
};

Level.prototype.createFloor = function(floorParameters, i) {
    var floorOptions = {floorNumber: i, elevator: this.elevator, level: this};
    for (var key in floorParameters) {
        if (floorParameters.hasOwnProperty(key)) {
            floorOptions[key] = floorParameters[key];
        }
    }
    if (this.floors.length > i) {
        floorOptions.occupants = this.floors[i].occupants;
    }
    return new Floor(floorOptions);
};

Level.State = {
    IN_PROGRESS: 0,
    FAIL: 1
};

Level.moneySound = new Audio('money-chime');

Level.prototype.goToState = function(state) {
    if ( state === this.state ) {
        return;
    }
    
    this.state = state;
    this.stateTime = 0;
}

Level.failSprite = new Sprite('level-fail.png');

Level.prototype.spawnCharacter = function() {
    if (this.state !== Level.State.IN_PROGRESS) {
        return;
    }
    var shuffledFloors = arrayUtil.shuffle(this.floors);
    
    for ( var i = 0; i < shuffledFloors.length; i++ ) {
        if ( shuffledFloors[i].spawnIds.length !== 0 ) {
            var spawnFloor = shuffledFloors[i];
            break;
        }
    }
    var character = spawnFloor.spawnCharacter();
    this.characters.push(character);
};

Level.prototype.getFloorTopY = function(floor) {
    return (this.numFloors - floor - 1) * Floor.height * 6;
};

Level.prototype.getFloorFloorY = function(floor) {
    return ((this.numFloors - floor - 1) * Floor.height + Floor.height - 1) * 6;
};

Level.prototype.getFloorWidth = function() {
    return 23 * 6;
};

Level.prototype.getFloorCapacity = function() {
    return Game.parameters['floorCapacity'];
};

Level.prototype.render = function(ctx) {
    ctx.save();
    ctx.translate(0, 6);

    this.elevator.renderBg(ctx);
    for (var i = 0; i < this.floors.length; ++i) {
        this.floors[i].renderBg(ctx);
    }
    for (var i = 0; i < this.characters.length; ++i) {
        if (this.characters[i].falling) {
            this.characters[i].render(ctx);
        }
    }
    this.elevator.renderFg(ctx);
    for (var i = 0; i < this.characters.length; ++i) {
        if (!this.characters[i].falling) {
            this.characters[i].render(ctx);
        }
    }
    for (var i = 0; i < this.floors.length; ++i) {
        this.floors[i].renderFg(ctx);
    }
    
    this.particles.render(ctx);
    
    ctx.restore();
    
    if (this.state === Level.State.FAIL) {
        ctx.globalAlpha = this.levelOverFade * 0.5;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.globalAlpha = this.levelOverFade;
        Level.failSprite.drawRotated(ctx, ctx.canvas.width * 0.5, ctx.canvas.height * 0.4, 0);
        
        ctx.textAlign = 'center';
        bigBitmapFont.drawText(ctx, 'FINAL SCORE: ' + this.score, ctx.canvas.width * 0.5, ctx.canvas.height * 0.6);
        
        var key = game.input.getKeyInstruction(game.startPress, 0);
        bigBitmapFont.drawText(ctx, 'PRESS ' + key + ' TO RESTART', ctx.canvas.width * 0.5, ctx.canvas.height * 0.7);
        ctx.globalAlpha = 1.0;
    }
};

Level.prototype.hasFloorId = function(id) {
    for (var i = 0; i < this.floors.length; ++i) {
        if (this.floors[i].id === id) {
            return true;
        }
    }
    return false;
};

Level.prototype.update = function(deltaTime) {
    this.stateTime += deltaTime;
    this.time += deltaTime;
    for (var i = 0; i < this.floors.length; ++i) {
        this.floors[i].update(deltaTime);
        if (this.floors[i].state === Floor.State.RENOVATED) {
            var shuffledFloors = arrayUtil.shuffle(GameData.floors);
            var j = 0;
            while (this.hasFloorId(shuffledFloors[j].id)) {
                ++j;
            }
            this.floors[i] = this.createFloor(shuffledFloors[j], i);
        }
    }
    this.elevator.update(deltaTime);
    for (var i = 0; i < this.characters.length;) {
        this.characters[i].update(deltaTime);
        if (this.characters[i].dead) {
            this.characters.splice(i, 1);
        } else {
            ++i;
        }
    }
    this.timeUntilSpawn -= deltaTime;
    if (this.timeUntilSpawn <= 0) {
        this.spawnCharacter();
        var randomMult = (1.0 + (Math.random() - 0.5) * Game.parameters['spawnIntervalRandomness']);
        var spawnIntervalFunc = Math.pow(this.time + 10, -0.3) * 2;
        this.timeUntilSpawn = Game.parameters['initialSpawnInterval'] * spawnIntervalFunc * randomMult;
    }
    
    this.particles.update(deltaTime);
    BaseCharacter.coinAnimation.update(deltaTime); // Shared between all particles
    
    if (this.state === Level.State.FAIL) {
        propertyToValue(this, 'levelOverFade', 1, deltaTime);
    } else {
        propertyToValue(this, 'levelOverFade', 0, deltaTime);
    }
};

Level.prototype.resetCombo = function() {
    this.elevator.comboText = null;
    this.comboCount = 0;
}

Level.prototype.reachedGoal = function(character) {
    if ( this.lastScoreFloor === character.floorNumber ) {
        // Repeat previous tippers in combo
        for ( var i = 0; i < this.comboCharacters.length; i++ ) {
            this.score += this.comboCharacters[i].getTip();
        }
        
        // Apply your own tip TIMES current combo count
        this.comboCount++;
        this.score += character.getTip() * this.comboCount;
        
        this.comboCharacters.push(character);
    }
    else {
        this.comboCharacters = [character];
        this.comboCount = 1;
        this.score += character.getTip();
    }
    
    character.spawnTip();
    Level.moneySound.play();
    
    if ( this.comboCount > 1 ) {
        this.elevator.comboText = "COMBO X" + this.comboCount;
    }

    this.lastScoreFloor = character.floorNumber;
};

Level.prototype.upPress = function(playerNumber) {
    if (this.state === Level.State.IN_PROGRESS) {
        this.elevator.upPress();
    }
};

Level.prototype.downPress = function(playerNumber) {
    if (this.state === Level.State.IN_PROGRESS) {
        this.elevator.downPress();
    }
};

Level.prototype.upRelease = function(playerNumber) {
    if (this.state === Level.State.IN_PROGRESS) {
        this.elevator.upRelease();
    }
};

Level.prototype.downRelease = function(playerNumber) {
    if (this.state === Level.State.IN_PROGRESS) {
        this.elevator.downRelease();
    }
};

Level.getTotalUsedSpace = function(occupants) {
    var usedSpace = 0;
    for (var i = 0; i < occupants.length; ++i) {
        usedSpace += occupants[i].width;
    }
    return usedSpace;
};

Level.getTotalWeight = function(occupants) {
    var w = 0;
    for (var i = 0; i < occupants.length; ++i) {
        w += occupants[i].weight;
    }
    return w;
};
