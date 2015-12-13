
var minTimeUntilSpawn = 3;
var maxTimeUntilSpawn = 9;

var Level = function() {
    this.timeUntilSpawn = maxTimeUntilSpawn;
    this.numFloors = 6;

    this.elevator = new Elevator({x: this.getFloorWidth(), level: this});
    this.floors = [];
    
    var shuffledFloors = arrayUtil.shuffle(GameData.floors);
    
    // Fixed, functional floors
    var floor;
    var randomIndex = Math.floor(Math.random() * this.numFloors);
    
    for (var i = 0; i < this.numFloors; ++i) {
        var floorOptions = {floorNumber: i, elevator: this.elevator, level: this};
        for (var key in shuffledFloors[i]) {
            if (shuffledFloors[i].hasOwnProperty(key)) {
                floorOptions[key] = shuffledFloors[i][key];
            }
        }
        floor = new Floor(floorOptions);
        this.floors.push(floor);
    }
    this.characters = [];
    this.spawnCharacter();
    
    this.state = Level.State.IN_PROGRESS;
    
    this.characterMoveSpeed = 10;
    this.elevatorMoveSpeed = 4;
    this.elevatorDoorOpenTime = 0.3;
    
    this.score = 0;
    this.comboCount = 0;
    this.comboCharacters = [];
};

Level.State = {
    IN_PROGRESS: 0,
    FAIL: 1
};

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
    if (Level.getTotalUsedSpace(spawnFloor.occupants) > this.getFloorWidth() - 1) {
        this.state = Level.State.FAIL;
    }
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
    ctx.scale(6, 6);
    ctx.translate(-this.floors[0].tilemap.width * 0.5, -this.numFloors * Floor.height * 0.5);

    this.elevator.render(ctx);
    for (var i = 0; i < this.floors.length; ++i) {
        this.floors[i].render(ctx);
    }
    for (var i = 0; i < this.characters.length; ++i) {
        this.characters[i].render(ctx);
    }
    ctx.restore();
    
    if (this.state === Level.State.FAIL) {
        Level.failSprite.drawRotated(ctx, ctx.canvas.width * 0.5, ctx.canvas.height * 0.5, 0);
    }
};

Level.prototype.update = function(deltaTime) {
    for (var i = 0; i < this.floors.length; ++i) {
        this.floors[i].update(deltaTime);
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
    if ( this.timeUntilSpawn <= 0 ) {
        this.spawnCharacter();
        this.timeUntilSpawn = minTimeUntilSpawn + Math.random() * (maxTimeUntilSpawn - minTimeUntilSpawn);
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
        
        character.spawnTip();
        
        this.comboCharacters.push(character);
    }
    else {
        this.comboCharacters = [character];
        this.comboCount = 1;
        this.score += character.getTip();
        character.spawnTip();
    }
    
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
