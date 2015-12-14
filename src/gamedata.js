var GameData = {};

GameData.floors =
[
    {
        id: "acme",
        name: "Acme",
        spawnIds: [
            {id: "customer", chance: 4},
            {id: "customerette", chance: 2},
            {id: "horse", chance: 1},
            {id: "heavy", chance: 4},
            {id: "runner", chance: 2},
            {id: "renovator", chance: 2},
            {id: "magnetman", chance: 2}
        ]
    },
    {
        id: "stables",
        name: "Stables",
        spawnIds: [
            {id: "customer", chance: 3},
            {id: "customerette", chance: 3},
            {id: "horse", chance: 5},
            {id: "heavy", chance: 1},
            {id: "bandmember1", chance: 1},
            {id: "bandmember2", chance: 1},
            {id: "groom", chance: 1},
            {id: "gaygroom", chance: 1},
        ]
    },
    {
        id: "graveyard",
        name: "Graveyard",
        spawnIds: [
            {id: "customer", chance: 2},
            {id: "customerette", chance: 2},
            {id: "ghost", chance: 5},
            {id: "cat", chance: 2},
            {id: "horse", chance: 1}
        ]
    },
    {
        id: "lounge",
        name: "Business lounge",
        spawnIds: [
            {id: "customer", chance: 2},
            {id: "customerette", chance: 2},
            {id: "runner", chance: 3},
            {id: "bandmember1", chance: 1},
            {id: "bandmember2", chance: 1},
            {id: "groom", chance: 1},
            {id: "bride", chance: 1}
        ]
    },
    {
        id: "garage",
        name: "Garage",
        spawnIds: [
            {id: "customer", chance: 6},
            {id: "customerette", chance: 2},
            {id: "car", chance: 1},
            {id: "renovator", chance: 2},
            {id: "magnetman", chance: 1}
        ]
    },
    {
        id: "security",
        name: "Security",
        spawnIds: [],
        excludeAsDestination: true
    },
    {
        id: "clowncamp",
        name: "Clown bootcamp",
        spawnIds: [
            {id: "clown", chance: 5},
            {id: "horse", chance: 2},
            {id: "customer", chance: 1},
            {id: "customerette", chance: 1}
        ]
    },
     {
        id: "battlefield",
        name: "Battlefield",
        spawnIds: [
            {id: "soldier", chance: 4},
            {id: "horse", chance: 1},
            {id: "stretcher", chance: 1},
            {id: "ghost", chance: 1}
        ]
    },
    {
        id: "catcafe",
        name: "Cat Cafe",
        spawnIds: [
            {id: "customer", chance: 2},
            {id: "customerette", chance: 4},
            {id: "cat", chance: 4},
            {id: "bride", chance: 1},
            {id: "lesbianbride", chance: 1}
        ]
    },    /*,
    {
        id: "bioweapon",
        name: "Bio weapons lab"
    },
    {
        id: "surgeryspa",
        name: "Surgery Spa"
    },
    {
        id: "dogfood",
        name: "Dog restaurant"
    },
    {
        id: "gym",
        name: "Gym"
    },
    {
        id: "heavystuff",
        name: "Anvils & grand pianos"
    },
    {
        id: "balloonpop",
        name: "Porcupines & balloons"
    },
    {
        id: "carwash",
        name: "Car wash & cocktail bar"
    },
    {
        id: "cakepoison",
        name: "Fruit cakes & cyanide pills"
    },
    {
        id: "babyblender",
        name: "Baby blenders"
    },
    {
        id: "dogpedicure",
        name: "Dog pedicures"
    },
    {
        id: "fishbicycle",
        name: "Fish bicycles"
    },
    {
        id: "travel",
        name: "Cat travel agency"
    },
    {
        id: "burnerfabric",
        name: "Flamethrowers & envelopes"
    },
    {
        id: "elephantslippers",
        name: "Elephant slippers"
    },
    {
        id: "positivesign",
        name: "Exit signs & demotivators"
    },
    {
        id: "dynamite",
        name: "Dynamite & short fuses"
    },
    {
        id: "magnets",
        name: "Giant magnets"
    },
    {
        id: "coffeemeditation",
        name: "Coffee & meditation beads"
    },
    {
        id: "seamonkey",
        name: "Sea-monkey farm"
    },
    {
        id: "tapdanceearplugs",
        name: "Tuba repair shop & earplugs"
    },
    {
        id: "underwearsnowshoe",
        name: "Underwear & snowshoes"
    },
    {
        id: "cheeseandraincoats",
        name: "Cheese kits & raincoats"
    },
    {
        id: "beetherapy",
        name: "Bee therapy"
    }*/
];

function getAllButExcluded() {
    var group = [];
    
    for ( var i = 0; i < GameData.floors.length; i++ ) {
        if ( !GameData.floors[i].hasOwnProperty("excludeAsDestination") ) {
            group.push(GameData.floors[i]);
        }
    }
    
    return group;
};

GameData.destinationGroups =
[
    getAllButExcluded()
];

GameData.characters =
{
    'customer' : {
        destinations : getAllButExcluded(),
        characterConstructor: Character,
        weight: 1,
        bodyIds: ['customer']
    },
    'customerette' : {
        destinations : getAllButExcluded(),
        characterConstructor: Character,
        weight: 1,
        bodyIds: ['customerette']
    },    
    'soldier' : {
        destinations : getAllButExcluded(),
        characterConstructor: Character,
        weight: 1,
        immuneToScary: true
    },
    'clown' : {
        destinations : getAllButExcluded(),
        characterConstructor: Character,
        weight: -4
    },
    'heavy' : {
        destinations : getAllButExcluded(),
        characterConstructor: Character,
        weight: 4,
        minTip: 5,
        maxTip: 10
    },
    'runner' : {
        destinations : getAllButExcluded(),
        characterConstructor: Runner,
        constructorLimit: 1,
        weight: 1,
        minTip: 20,
        maxTip: 30,
        takesSpaceInLine: false
    },
    'stretcher' : {
        destinations : getAllButExcluded(),
        characterConstructor: Runner,
        constructorLimit: 1,
        weight: 3,
        width: 4,
        minTip: 20,
        maxTip: 30,
        takesSpaceInLine: false,
        numberOfLegs: 2,
        legsSpread: 15,
        immuneToScary: true
    },
    'horse': {
        destinations : getAllButExcluded(),
        characterConstructor: Horse,
        width: 4,
        weight: 2,
        minTip: 5,
        numberOfLegs: 2,
        legsSpread: 12
    },
    'cat': {
        destinations : getAllButExcluded(),
        characterConstructor: Cat,
        width: 1,
        weight: 0.5,
        minTip: 1,
        maxTip: 3,
        numberOfLegs: 0,
        immuneToScary: true
    },
    'ghost': {
        destinations : getAllButExcluded(),
        characterConstructor: Ghost,
        weight: -1,
        minTip: 10,
        maxTip: 10,
        scary: true,
        immuneToScary: true
    },
    'car': {
        destinations : getAllButExcluded(),
        characterConstructor: Car,
        weight: 8,
        width: 6,
        minTip: 30
    },
    'renovator': {
        destinations : getAllButExcluded(),
        characterConstructor: Renovator,
        constructorLimit: 1,
        weight: 1,
        width: 2,
        minTip: 0,
        maxTip: 0
    },
    'bandmember1': {
        destinations : getAllButExcluded(),
        characterConstructor: BandMember,
        idLimit: 1,
        weight: 1,
        width: 2,
        minTip: 15,
        maxTip: 15,
        band: 'music',
        spawnWith: ['bandmember2'],
        bandSize: 2
    },
    'bandmember2': {
        destinations : getAllButExcluded(),
        characterConstructor: BandMember,
        idLimit: 1,
        weight: 1,
        width: 2,
        minTip: 15,
        maxTip: 15,
        band: 'music',
        spawnWith: ['bandmember1'],
        bandSize: 2
    },
    /*'bandmember3': {
        destinations : getAllButExcluded(),
        characterConstructor: BandMember,
        constructorLimit: 3,
        weight: 1,
        width: 2,
        minTip: 1,
        maxTip: 1
    }*/
    'groom': {
        destinations : getAllButExcluded(),
        characterConstructor: BandMember,
        idLimit: 1,
        weight: 1,
        width: 2,
        minTip: 20,
        maxTip: 20,
        band: 'wedding',
        spawnWith: ['bride'],
        bandSize: 2
    },
    'bride': {
        destinations : getAllButExcluded(),
        characterConstructor: BandMember,
        idLimit: 1,
        weight: 1,
        width: 2,
        minTip: 20,
        maxTip: 20,
        band: 'wedding',
        spawnWith: ['groom'],
        bandSize: 2
    },
    'gaygroom': {
        destinations : getAllButExcluded(),
        characterConstructor: BandMember,
        idLimit: 1,
        weight: 1,
        width: 2,
        minTip: 20,
        maxTip: 20,
        band: 'wedding',
        spawnWith: ['groom'],
        bandSize: 2,
        bodyIds: ['groom']
    },
    'lesbianbride': {
        destinations : getAllButExcluded(),
        characterConstructor: BandMember,
        idLimit: 1,
        weight: 1,
        width: 2,
        minTip: 20,
        maxTip: 20,
        band: 'wedding',
        spawnWith: ['bride'],
        bandSize: 2,
        bodyIds: ['bride']
    },
    'magnetman': {
        destinations : getAllButExcluded(),
        characterConstructor: Reverser,
        constructorLimit: 1,
        weight: 1,
        width: 2,
        minTip: 30,
        maxTip: 30,
    }
};

BaseCharacter.loadSprites();
