//DATA
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
//setup iterables
let d, dd, s, ss;
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
//setup seed data
const seedSet = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170675713913216"
let bSeed = [];
//FUNCTIONS
//generate full seed
function generateFSeed(bSeed) {
    lastNum = false;
    retVal = "";
    bSeed.forEach((currentNum) => {
        if(lastNum !== false) {
            retVal += seedSet.slice(Number(lastNum + currentNum), Number(lastNum + currentNum) + 10);
            lastNum = currentNum;
        } else {
            lastNum = currentNum;
        }
    });
    return retVal;
}