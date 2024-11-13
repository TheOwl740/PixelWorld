//VARIABLES AND CONSTANTS
//canvas reference
const cs = new Canvas(document.getElementById("canvas"));
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
let gameState = "home";
//base variables
let world;
let seed;
//player container variable
let player;
//counters
let ec = 0;
let tc = 0;
//render pipeline
const renderPipeline = [];
//OBJECTS
//setup image tree
const images = {
  buttons: {
  },
  player: {
    right: {
      idle: tk.generateImage("Images/Player/Right/idle.png"),
      move: [
        tk.generateImage("Images/Player/Right/Move/0.png"),
        tk.generateImage("Images/Player/Right/Move/1.png"),
        tk.generateImage("Images/Player/Right/Move/2.png")
      ]
    },
    left: {
      idle: tk.generateImage("Images/Player/Left/idle.png"),
      move: [
        tk.generateImage("Images/Player/Left/Move/0.png"),
        tk.generateImage("Images/Player/Left/Move/1.png"),
        tk.generateImage("Images/Player/Left/Move/2.png")
      ]
    }
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
    let constant = "31415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170675713913216";
    let lastNum = false;
    let currentNum;
    for(let i = 0; i < base.length; i++) {
      currentNum = base.slice(i, i + 1);
      if(lastNum !== false) {
        this.value += constant.slice(Number(lastNum + currentNum), Number(lastNum + currentNum) + 10);
        lastNum = currentNum;
      } else {
        lastNum = currentNum;
      }
    }
  }
  pseudoRandom(input, digits) {
    let returnValue;
    if((input + digits) <= this.value.length) {
      returnValue = this.value.slice(input, input + digits);
    } else {
      returnValue = this.value.slice(input, this.value.length);
      returnValue += this.value.slice(0, (input + digits) - this.value.length);
    }
    return Number(returnValue);
  }
}
//tile template
class Tile {
  constructor(parentChunk, index, transform) {
    //transform coordinate
    this.transform = transform;
    //parent chunk for later reference
    this.parentChunk = parentChunk;
    //index in the parent chunk
    this.index = index;
    //generate pseudorandom
    let code;
    let codeItems = [
      tk.roundNum(this.transform.x, 0).toString(),
      tk.roundNum(this.transform.y, 0).toString(),
      this.index.toString(),
      this.parentChunk.index.toString()
    ];
    for(let i = 0; i < this.index + this.parentChunk.index % 3; i++) {
      codeItems.push(codeItems[0]);
      codeItems.shift();
    }
    code = codeItems[0] + codeItems[1] + codeItems[2] + codeItems[3];
    let sliceIndex = Math.floor(((code.length - 1) / 256) * index);
    this.seedCode = seed.pseudoRandom(Number(code.slice(sliceIndex, sliceIndex + 2)), 4).toString();
    //assign to render properties
    this.tileDarken = false;
    if((Math.floor(this.index / 16) % 2) + (this.index % 2) === 1) {
      this.tileDarken = true;
    }
    this.image = new Img(images.tiles.grassyPlains.terrain.grass[Math.floor(Number(this.seedCode.charAt(0)) / 5)], this.tileDarken ? 0.95 : 1, Math.floor(Number(this.seedCode.charAt(1)) / 2.5) * 90, 0, 0, world.spatialUnit, world.spatialUnit, Math.floor(Number(this.seedCode.charAt(0)) / 5) == 0 ? false : true, Math.floor(Number(this.seedCode.charAt(0)) / 5) == 0 ? false : true);
  }
  //render at true position
  render() {
    rt.renderImage(this.transform, this.image);
  }
  //local rendering for chunk baking
  renderLocal(crt) {
    crt.renderImage(world.positionConverter(new Pair(0, this.index)), this.image);
  }
}
//chunk template
class Chunk {
  constructor(index, transform) {
    //transform coordinate
    this.transform = transform;
    //index in the parent chunk
    this.index = index;
    //contained tiles
    this.tiles = [];
    //natural features
    this.landforms = [];
    //structures, pois
    this.features = [];
    //canvas element for baking
    this.cs = false;
  }
  //fills tiles
  generate() {
    for(let i = 0; i < 256; i++) {
      this.tiles.push(new Tile(this, i, world.positionConverter(new Pair(this.index, i), false).add(new Pair(world.spatialUnit / 2, world.spatialUnit / 2))));
    }
  }
  //updates baking and renders
  render() {
    if(tk.calcDistance(this.transform, player.transform) < cs.w * 1.5) {
      if(this.cs === false) {
        this.cs = new Canvas(document.createElement("canvas"));
        this.cs.setDimensions(world.spatialUnit * 16, world.spatialUnit * 16);
        let crt = new RenderTool(this.cs);
        crt.camera = new Pair(world.spatialUnit * -0.5, world.spatialUnit * 15.5);
        this.tiles.forEach((tile) => {
          tile.renderLocal(crt);
        });
      }
      rt.renderImage(this.transform, new Img(this.cs.element, 1, 0, 0, 0, world.spatialUnit * 16, world.spatialUnit * 16, false, false));
    } else if(tk.calcDistance(this.transform, player.transform) > cs.w * 2) {
      this.cs = false;
    }
  }
}
//world template
class World {
  constructor() {
    //spatial unit for sizing
    this.spatialUnit = window.innerHeight / 32;
    //chunk data
    this.chunks = [];
    //mountains, lakes
    this.landforms = [];
    //structures, pois
    this.features = [];
  }
  //generates a new map
  generate() {
    const genProcess = new Promise((resolve) => {
      console.log("generating");
      //generate chunks
      for(let i = 0; i < 4096; i++) {
        this.chunks.push(new Chunk(i, new Pair(((i % 64) * this.spatialUnit * 16) + (this.spatialUnit * 7.5), (Math.floor(i / 64) * this.spatialUnit * 16) + (this.spatialUnit * 7.5))));
        this.chunks[i].generate();
      }
      resolve();
    });
    genProcess.then(() => {
      //note completion
      console.log("generated");
      //assign player
      player = new Player(world);
      gameState = "inGame";
    });
  }
  //converts between indexes and transforms
  positionConverter(pair, isTransform) {
    let rPair = pair.round(0);
    if(isTransform) {
      return new Pair((Math.floor(rPair.y / (this.spatialUnit * 16)) * 64) + (Math.floor(rPair.x / (this.spatialUnit * 16))), ((Math.floor(rPair.y / this.spatialUnit) % 16) * 16) + (Math.floor(rPair.y / this.spatialUnit) % 16));
    } else {
      return new Pair(((rPair.x % 64) * this.spatialUnit * 16) + ((rPair.y % 16) * this.spatialUnit), (Math.floor(rPair.x / 64) * this.spatialUnit * 16) + (Math.floor(rPair.y / 16) * this.spatialUnit));
    }
  }
  //renders map and updates baking on nearby chunks
  renderMap() {
    this.chunks.forEach((chunk) => {
      chunk.render();
    });
  }
}
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
    return tk.randomNum((1 * this.level) ** (1 + (this.tier / 5)), (6 * this.level) ** (1 + (this.tier / 5)));
  }
}
//player class
class Player {
  constructor(world) {
    //transform position in pixels
    this.transform = world.positionConverter(world.positionConverter(new Pair(tk.randomNum(7000, 18000), tk.randomNum(7000, 18000)), true), false);
    this.level = 1;
    this.hp = {
      current: 10,
      max: () => {
        return 15 + (this.level * 5);
      }
    };
    this.armor = new Armor(1, 1, null, null);
    this.weapon = null;
    this.effects = [];
  }
  render() {
    rt.renderRectangle(this.transform, new Rectangle(45, world.spatialUnit, world.spatialUnit), new Fill("black", 1), null);
  }
}
//FUNCTIONS
function evaluateInput() {
  if(et.getKey("a")) {
    player.transform.x -= 5;
  }
  if(et.getKey("d")) {
    player.transform.x += 5;
  }
  if(et.getKey("w")) {
    player.transform.y += 5;
  }
  if(et.getKey("s")) {
    player.transform.y -= 5;
  }
  rt.camera = new Pair(player.transform.x - (cs.w / 2), player.transform.y + (cs.h / 2));
}