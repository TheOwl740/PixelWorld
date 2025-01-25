//INITIALISATION
//setup menu interface
const menuInterface = {
  newGameButton: landscape ? new Button(new Pair(cs.w * 0.35, cs.w * -0.42), cs.w * 0.25, cs.h * 0.1) : new Button(new Pair(cs.w * 0.5, cs.h * -0.4), cs.w * 0.7, cs.h * 0.1),
  loadGameButton: landscape ? new Button(new Pair(cs.w * 0.65, cs.w * -0.42), cs.w * 0.25, cs.h * 0.1) : new Button(new Pair(cs.w * 0.5, cs.h * -0.6), cs.w * 0.7, cs.h * 0.1)
};
//GAME
//main loop
function runGlobalCycle() {
  //increment epoch counter
  ec++;
  //check gameState
  switch(gameState) {
    //main menu
    case "home":
      updateHomeMenu();
      break;
    //ingame
    case "inGame":
      //run camera controls
      rt.camera = new Pair(player.transform.x - (cs.w / 2), player.transform.y + (cs.h / 2));
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