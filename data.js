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
//device layout bool
const landscape = cs.w > cs.h ? true : false;
//context removal event disabler
et.rightClickEnabled = false;
et.tabEnabled = false;
//gameState for game control
let gameState = "unloaded";
//base variables
let world;
let seed;
let player;
let tm;
//counters
let ec = 0;
//OBJECTS
//setup image tree
const images = {
  logo: tk.generateImage("Images/logo.png"),
  menuBackground: tk.generateImage("Images/menuBackground.png"),
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
//fonts
const pixelFont = new FontFace('pixelFont', 'url(pixelFont.ttf)');
pixelFont.load().then((font) => {
  document.fonts.add(font);
  gameState = "home";
});
//UTILITY CLASSES
//button class
class Button {
  constructor(transform, w, h) {
    this.transform = transform;
    this.rectangle = new Rectangle(0, w, h);
  }
  render() {
    if(tk.detectCollision(et.cursor, new Collider(this.transform, this.rectangle)) && (landscape || et.getClick("left"))) {
      rt.renderRectangle(this.transform, this.rectangle, new Fill("#AB9", 1), new Border("#897", 1, 10, "bevel"));
    } else {
      rt.renderRectangle(this.transform, this.rectangle, new Fill("#897", 1), new Border("#675", 1, 10, "bevel"));
    }
  }
  getPress() {
    return (tk.detectCollision(et.cursor, new Collider(this.transform, this.rectangle)) && et.getClick("left"));
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
    if(tk.calcDistance(this.transform, player.transform) < (landscape ? cs.w : cs.h) * 1.5) {
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
class Item {
  constructor(id) {
    this.id = id;
    this.value;
    this.icon;

  }
}
//armor item subclass
class Armor extends Item {
  constructor(id, tier, level, enchantment, curse) {
    super(id);
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
//SAVE CLASSES
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
//world template
class World {
  constructor() {
    //spatial unit for sizing
    this.spatialUnit = window.innerHeight / 16;
    //chunk data
    this.chunks = [];
    //mountains, lakes
    this.landforms = [];
    //structures, pois
    this.features = [];
  }
  //generates a new map
  generate() {
    //generate chunks
    for(let i = 0; i < 4096; i++) {
      this.chunks.push(new Chunk(i, new Pair(((i % 64) * this.spatialUnit * 16) + (this.spatialUnit * 7.5), (Math.floor(i / 64) * this.spatialUnit * 16) + (this.spatialUnit * 7.5))));
      this.chunks[i].generate();
    }
    //assign player
    player = new Player(world);
    //assign turn manager
    tm = new TurnManager();
    tm.add(player);
    //start game
    gameState = "inGame";
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
//player class
class Player {
  constructor() {
    this.id = "player";
    //next turn number the player will take
    this.nextTurn = 1;
    //current directive from player input
    this.currentTarget = false;
    //transform position in pixels
    this.transform = world.positionConverter(world.positionConverter(new Pair(tk.randomNum(7000, 18000), tk.randomNum(7000, 18000)), true), false);
    //image object for rendering
    this.image = new Img(images.player.right.idle, 1, 0, 0, world.spatialUnit * 0.25, world.spatialUnit * 1.25, world.spatialUnit * 1.25, false, false);
    //player level
    this.level = 1;
    //player hp data
    this.hp = {
      current: 10,
      max: () => {
        return 15 + (this.level * 5);
      }
    };
    //armor slot
    this.armor = new Armor(1, 1, null, null);
    //weapon slot
    this.weapon = null;
    //effects stack
    this.effects = [];
  }
  render() {
    rt.renderImage(this.transform, this.image);
  }
  update() {
    //if it's the player's turn
    if(tm.turnQueue[0].id === "player") {

    }
  }
}
//turn manager updates turn order
class TurnManager {
  constructor() {
    this.turnQueue = [];
    this.turn = 0;
  }
  next(increment) {
    this.turn += increment;
    this.turnQueue.sort((a, b) => {
      return a.nextTurn - b.nextTurn;
    });
  }
  add(entity) {
    this.turnQueue.push(entity);
    this.turnQueue.sort((a, b) => {
      return a.nextTurn - b.nextTurn;
    });
  }
}
//entity manager updates entity ai and turn order
class EntityManager {
  constructor() {
    this.entities = [];
    this.currentId = 0;
  }
  add(entity) {
    currentId++;
    entity.id = currentId;
    this.entities.push(entity);
  }
}
//FUNCTIONS
function updateHomeMenu() {
  if(landscape) {
    //background
    rt.renderImage(new Pair(cs.w / 2, cs.h / -2), new Img(images.menuBackground, 1, 0, 0, 0, cs.w, cs.w, false, false));
    //logo
    rt.renderImage(new Pair(cs.w * 0.5, cs.w * -0.2), new Img(images.logo, 1, 0, 0, 0, cs.w * 0.5, cs.w * 0.3, false, false));
    //new game button
    menuInterface.newGameButton.render();
    rt.renderText(new Pair(cs.w * 0.25, cs.w * -0.438), new TextNode("pixelFont", "New Game", 0, cs.w / 20), new Fill("#000", 1));
    //load game button
    menuInterface.loadGameButton.render();
    rt.renderText(new Pair(cs.w * 0.545, cs.w * -0.438), new TextNode("pixelFont", "Load Game", 0, cs.w / 20), new Fill("#000", 1));
  } else {
    //background
    rt.renderImage(new Pair(cs.w / 2, cs.h / -2), new Img(images.menuBackground, 1, 0, 0, 0, cs.h, cs.h, false, false));
    //logo
    rt.renderImage(new Pair(cs.w * 0.5, cs.h * -0.16), new Img(images.logo, 1, 0, 0, 0, cs.w * 0.8, cs.w * 0.5, false, false));
    //new game button
    menuInterface.newGameButton.render();
    rt.renderText(new Pair(cs.w * 0.24, cs.h * -0.418), new TextNode("pixelFont", "New Game", 0, cs.h / 17), new Fill("#000", 1));
    //load game button
    menuInterface.loadGameButton.render();
    rt.renderText(new Pair(cs.w * 0.22, cs.h * -0.618), new TextNode("pixelFont", "Load Game", 0, cs.h / 17), new Fill("#000", 1));
  }
  if(menuInterface.newGameButton.getPress() && seed === undefined) {
    //prompt for base seed
    /*let seedEntry = prompt("Please enter an 11 digit numerical seed or press enter for a random generated seed.");
    //assign random if prompt is an invalid seed or empty
    if(seedEntry.length !== 11 || Number(seedEntry) / Number(seedEntry) !== 1) {
      seedEntry = "";
      for(let i = 0; i < 11; i++) {
        seedEntry += tk.randomNum(0, 9).toString();
      }
    }*/
    //random seed
    let seedEntry;
    for(let i = 0; i < 11; i++) {
      seedEntry += tk.randomNum(0, 9).toString();
    }
    //generate full seed
    seed = new Seed(seedEntry);
    //instantiate world
    world = new World();
    //render generating screen
    cs.fillAll(new Fill("black", 1));
    rt.renderText(new Pair(cs.w * 0.25, cs.h / -2), new TextNode("pixelFont", "Generating...", 0, cs.w / 50), new Fill("white", 1));
    window.setTimeout(() => {
      world.generate();
    }, 0);
  }
  if(menuInterface.loadGameButton.getPress()) {

  }
}