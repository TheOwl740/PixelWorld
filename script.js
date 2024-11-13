//INITIALISATION
//generate base seed
//run seed generation
//GAME
//main loop
function runGlobalCycle() {
  //increment epoch counter
  ec++;
  //check gameState
  switch(gameState) {
    //main menu
    case "home":
      //prompt for base seed
      let seedEntry = prompt("Welcome. Please enter an 11 digit numerical seed or press enter for a random generated seed.");
      //assign random if prompt is an invalid seed or empty
      if(seedEntry.length !== 11 || Number(seedEntry) / Number(seedEntry) !== 1) {
        seedEntry = "";
        for(let i = 0; i < 11; i++) {
          seedEntry += tk.randomNum(0, 9).toString();
        }
      }
      //generate full seed
      seed = new Seed(seedEntry);
      //instantiate world
      world = new World();
      //begin generation
      world.generate();
      //start game
      gameState = "generation";
      break;
    //world generation
    case "generation":
      break;
    //ingame
    case "inGame":
      //run player controls
      evaluateInput();
      //prepare for frame
      cs.fillAll(new Fill("black", 1));
      //render the map
      world.renderMap();
      //render the player
      player.render();
      break;
    //in a menu
    case "menu":
      break;
  }
}
//loop timer
const timer = setInterval(runGlobalCycle, 17);