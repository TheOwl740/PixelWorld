//INITIALISATION
//generate base seed
//run seed generation
//GAME
//main loop
function runGlobalCycle() {
  //check gameState
  switch(gameState) {
    //main menu
    case "home":
      //prompt for base seed
      let seedEntry = prompt("Welcome. Please enter an 11 digit numerical seed or press enter for a random generated seed.")
      //assign random if prompt is an invalid seed or empty
      if(seedEntry.length !== 11 || Number(seedEntry) / Number(seedEntry) !== 1) {
        seedEntry = "random";
      }
      //add values to seed
      for(s = 0; s < 11; s++) {
        seed.base.push(seedEntry === "random" ? tk.randomNum(0, 9).toString() : seedEntry.slice(s, s + 1));
      }
      //generate full seed
      seed.generateFSeed();
      //start game
      gameState = "game";
    //ingame
    case "game":
    //in a menu
    case "menu":
  }
}
//loop timer
const timer = setInterval(runGlobalCycle(), 17)