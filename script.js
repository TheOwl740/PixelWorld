//INITIALISATION
//generate base seed
for(s = 0; s < 11; s++) {
    bSeed.push(tk.randomNum(0, 9).toString());
}
//run seed generation
let fSeed = generateFSeed(bSeed);
//GAME
//main loop
function runGlobalCycle() {
    
}
//loop timer
const timer = setInterval(runGlobalCycle(), 17)