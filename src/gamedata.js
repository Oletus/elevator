var GameData = {};

GameData.floors =
[
    {
        id: "acme",
        name: "Acme"
    },
    {
        id: "stables",
        name: "Stables"
    },
    {
        id: "graveyard",
        name: "Graveyard"
    },
    {
        id: "lounge",
        name: "Business lounge"
    },
    {
        id: "garage",
        name: "Garage"
    },
    {
        id: "security",
        name: "Security",
        spawnIds: [],
        excludeAsDestination: true
    } /*,
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
        id: "clowncamp",
        name: "Clown bootcamp"
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
        weight: 1
    },
    'heavy' : {
        destinations : getAllButExcluded(),
        characterConstructor: Character,
        weight: 4,
        minTip : 5,
        maxTip : 20
    },
    'runner' : {
        destinations : getAllButExcluded(),
        characterConstructor: Runner,
        weight: 1,
        minTip : 20,
        maxTip : 50
    },
    'horse': {
        destinations : getAllButExcluded(),
        characterConstructor: Horse,
        weight: 2,
        minTip : 5
    }
};

BaseCharacter.loadSprites();
