var floorNamesPre = 
[
    "Car"
    , "Weapons"
    , "Luxury"
];

var floorNamesPost =
[
    "Lab"
    , "Spa"
    , "Shop"
];

var floorNames =
[
    Bio weapons lab
    Security
    Garage
    Surgery Spa

Dog restaurant

Gym

Acme

Anvils, Pianos and heavy stuff shop

Porcupines and balloons   

Car wash and cocktail bar 

Chocolate cakes and cyanide pills  

Baby blenders

Dog pedicures 

Fish bicycles and frog umbrellas 

Cat travel agency   

Bunsen Burners and flammable fabrics 

Elephant slippers 

Exit signs and positive affirmations 
Dynamite and short fuses 

Giant magnets  

Coffee and meditation beads 

Sea-monkey farm 

Tap dancing shoes and earplugs  

Underwear and snowshoes

Clown bootcamp 

Cheese kits and raincoats  

Bee therapy
];

function randomFloorName()
{
    return floorNamesPre[0] + " " + floorNamesPost[0];
}