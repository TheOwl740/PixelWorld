//VARIABLES AND CONSTANTS
//canvas reference
const cs = new Canvas("canvas");
//toolkit reference
const tk = new Toolkit();
//event tracker reference
const et = new EventTracker();
//render tool reference
const rt = new RenderTool(cs);
//canvas setup
cs.setDimensions(window.innerWidth, window.innerHeight);
//context removal event disabler
et.rightClickEnabled = false;
et.tabEnabled = false;
//gameState for game control
let gameState = "home"
//setup iterables
let d, dd, s, ss;
//define spatial representation
const spatialUnit = window.innerHeight / 64;
//OBJECTS
//setup image tree
const images = {
    buttons: {
    },
    tiles: {
        grassyPlains: {
            terrain: {
                grass: [
                    tk.generateImage("Images/Tiles/GrassyPlains/Terrain/Grass/grass0.png"),
                    tk.generateImage("Images/Tiles/GrassyPlains/Terrain/Grass/grass1.png")
                ]
            },
            structures: {

            },
            misc: {

            }
        }
    }
};
//CLASSES
//seed class
class Seed {
    constructor(base) {
        //raw seed
        this.value = "";
        let constant = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170675713913216"
        let lastNum = false;
        let currentNum;
        for(d = 0; d < base.length; d++) {
            currentNum = base.slice(d, d + 1);
            if (lastNum !== false) {
                this.value += constant.slice(Number(lastNum + currentNum), Number(lastNum + currentNum) + 10);
                lastNum = currentNum;
            } else {
                lastNum = currentNum;
            }
        }
    }
    pseudoRandom(input, digits) {
        let returnValue;
        if ((input + digits) <= this.value.length) {
            returnValue = this.value.slice(input, input + digits);
        } else {
            returnValue = this.value.slice(input, this.value.length);
            returnValue += this.value.slice(0, (input + digits) - this.value.length);
        }
        return Number(returnValue)
    }
}
//world
//armor class
class Armor {
    constructor(tier, level, enchantment, curse) {
        this.tier = tier;
        this.level = level;
        this.enchantment = enchantment;
        this.curse = curse;
        this.identified = false;
    }
    calculateReduction(damage, type) {
        return tk.randomNum((1 * this.level) ** (1 + (this.tier / 5)), (6 * this.level) ** (1 + (this.tier / 5)))
    }
}
//player class
class Player {
    constructor() {
        //transform position in pixels
        this.transform = world.tileQuery()
        this.level = 1;
        this.hp = {
            current: 10,
            max: () => {
                return 15 + (this.level * 5)
            }
        };
        this.armor = new Armor(1, 1, null, null);
        this.weapon = null;
        this.effects = [];
    }
}
//FUNCTIONS