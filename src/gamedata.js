var GameData = {};

GameData.floors =
[
    {
        id: "security",
        name: "Security",
        spawnIds: [],
        excludeAsDestination: true
    },
    {
        id: "bioweapon",
        name: "Bio weapons lab"
    },
    {
        id: "garage",
        name: "Garage"
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
        id: "acme",
        name: "Acme"
    },
    {
        id: "heavystuff",
        name: "Anvils, Pianos and heavy stuff shop"
    },
    {
        id: "balloonpop",
        name: "Porcupines and balloons"
    },
    {
        id: "carwash",
        name: "Car wash and cocktail bar"
    },
    {
        id: "cakepoison",
        name: "Chocolate cakes and cyanide pills"
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
        name: "Fish bicycles and frog umbrellas"
    },
    {
        id: "travel",
        name: "Cat travel agency"
    },
    {
        id: "burnerfabric",
        name: "Bunsen Burners and flammable fabrics"
    },
    {
        id: "elephantslippers",
        name: "Elephant slippers"
    },
    {
        id: "positivesign",
        name: "Exit signs and positive affirmations"
    },
    {
        id: "dynamite",
        name: "Dynamite and short fuses"
    },
    {
        id: "magnets",
        name: "Giant magnets"
    },
    {
        id: "coffeemeditation",
        name: "Coffee and meditation beads"
    },
    {
        id: "seamonkey",
        name: "Sea-monkey farm"
    },
    {
        id: "tapdanceearplugs",
        name: "Tap dancing shoes and earplugs"
    },
    {
        id: "underwearsnowshoe",
        name: "Underwear and snowshoes"
    },
    {
        id: "clowncamp",
        name: "Clown bootcamp"
    },
    {
        id: "cheeseandraincoats",
        name: "Cheese kits and raincoats"
    },
    {
        id: "beetherapy",
        name: "Bee therapy"
    }
];

function getAllButExcluded() {
    var group = [];
    
    for ( var i = 0; i < GameData.floors.length; i++ ) {
        if ( GameData.floors[i].hasOwnProperty("excludeAsDestination") ) {
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
        destinations : getAllButExcluded() 
    }
};