/* 
          00XXXX                        XXXX00        
          00XXxx                        xxXX00        
          ee0000eeeeRR            RReeee0000ee        
                xxXX00            00XXxx              
                XXXX00            00XXXX              
            eexxXXXXXXXXXXXXXXXXXXXXXXXXXXXXxxee        
            00XXXXeeee00XXXXXXXXXXXX00eeeeXXXX00        
        xxXXXXXXXX    00XXXXXXXXXXXX00    XXXXXXXXxx    
        XXXXXXXXXX    00XXXXXXXXXXXX00    XXXXXXXXXX    
    eeeeXXXXXXXXXXeeeeRRXXXXXXXXXXXXRReeeeXXXXXXXXXXeeee
    XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
    XXXX""""RRXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXRR""""XXXX
    XXXX    00XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX00    XXXX
    XXXX    00XXXX""""""""""""""""""""""""XXXX00    XXXX
    XXRR    00XXXX                        XXXX00    RRXX
    eeXX    00xxxxRR000000ee    ee000000RRxxxx00    XXee
                  xxXXXXXXxx    xxXXXXXXxx                            
                  XXXXXXXXXX    XXXXXXXXXX              
   ___  ____  __  ___  _____  ___   _____   ___  _______  ____
  / _ \/ __ \/  |/  / /  _/ |/ / | / / _ | / _ \/ __/ _ \/ __/
 / // / /_/ / /|_/ / _/ //    /| |/ / __ |/ // / _// , _/\ \  
/____/\____/_/  /_/ /___/_/|_/ |___/_/ |_/____/___/_/|_/___/  
                                                              
Coded by Patricio Garcia | github.com/patgarcia/dom-invaders
 */

// play area
let playArea = document.getElementById('play-area');

// consts
const lasers = [];

// sound rel from index
const soundDir = 'static/snd/'
const shoot = "shoot.wav"
const alienHit = "alien_hit.wav"

// sound nodes
const sounds = { shoot, alienHit }
for(sound in sounds){
    const soundNode = document.createElement('audio');
    soundNode.src = soundDir + sounds[sound];
    soundNode.preload = "auto";
    sounds[sound] = soundNode;
}

/*============= 
  ENTITY MODEL
 =============*/
class Entity {
    constructor(parentElem) {
        this.x;
        this.y;
        this.cx;
        this.cy;
        this.width;
        this.height;
        this.domElem;
        this.sprite;
        this.className = this.constructor.name.toLowerCase();
        this.parentElem = parentElem || null;

        if(parentElem) this.domInit();
    }
    get boundRect() {
        return this.domElem.getBoundingClientRect();
    }

    get parentBoundRect() {
        return this.parentElem.getBoundingClientRect();
    }

    get coords() {
        let [x, y] = [this.x, this.y];
        return { x, y }
    }

    get center() {
        this.calcHalvesAndCenters();
        let [cx, cy] = [this.cx, this.cy];
        return { cx, cy }
    }

    static getClassName() {
        return this.constructor.name
    }
}

Entity.prototype.domInit = function () {
    this.domElem = document.createElement('div');
    this.domElem.classList.add('entity');
    this.domElem.classList.add(this.className);
    
    this.sprite = document.createElement('div');
    this.sprite.classList.add(`${this.className}-sprite`);
    this.domElem.appendChild(this.sprite);

    // attach element to get computed properties
    this.parentElem.appendChild(this.domElem);

    // get DOM computed coordinates and dimensions
    this.locationFromBoundingBoxes();

    // Pre-compute Half width and height as well as cx and cy
    this.calcHalvesAndCenters();
}

Entity.prototype.locationFromBoundingBoxes = function(){
    // instantiate object with bounding boxes
    let { x: parentX, y: parentY } = this.parentBoundRect;
    let { x, y, width, height } = this.boundRect;
    [this.x, this.y, this.width, this.height] = [x - parentX, y - parentY, width, height];
}


Entity.prototype.calcHalvesAndCenters = function () {
    // center logic is not considering the parent object displacement
    [this.halfWidth, this.halfHeight] = [this.width / 2, this.height / 2]
    this.cx = Math.abs(this.x + this.halfWidth);
    this.cy = Math.abs(this.y + this.halfHeight);
};

// Check Y-axis overlap, no need to check for collision if none
// This uses the alien-block y val to avoid computing per object
Entity.prototype.overlapInY = function(minima){
    return this.y < minima
}

// Colission detection logic | Ignores entry side
Entity.prototype.detectColission = function (other) {
    // other must be type Entity or have coords and dimensions
    /* 
        [  this.cx  ]       [  other.cx  ]
              |--------------------|  dxBetweenEntitiesCXs
              |-----|   +   |------|  withBetweenCXs
        
    */

    this.calcHalvesAndCenters();
    other.locationFromBoundingBoxes();
    other.calcHalvesAndCenters();

    let dxBetweenEntitiesCXs = Math.abs(this.cx - other.cx);
    let withBetweenCXs = this.halfWidth + other.halfWidth;
    let colissionX = (dxBetweenEntitiesCXs - withBetweenCXs) < 0;

    let dyBetweenEntitiesCYs = Math.abs(this.cy - other.cy);
    let heightBetweenCYs = this.halfHeight + other.halfHeight;
    let colissionY = (dyBetweenEntitiesCYs - heightBetweenCYs) < 0;

    return colissionX && colissionY
}

Entity.prototype.itemLocation = function(){
    this.domElem.style.transform = `translate(${this.x}px, ${this.y}px)`
}

/*========== 
  SPACESHIP
 ==========*/
class Spaceship extends Entity{

}

// Ship controller
Spaceship.prototype.followScroller = function(normalizedPosition){
    let { width: parentWidth } = this.parentBoundRect;
    this.x = normalizedPosition * (parentWidth - this.width);
    this.domElem.style.transform = `translate(${this.x}px)`;
}

// Ship shooting
Spaceship.prototype.shootLaser = function(){
    if(lasers.length !== 0) return
    sounds.shoot.cloneNode().play();
    const laser = new Laser (playArea);
    laser.domElem.classList.add('hide');
    laser.shotBy = this;
    laser.direction = this.className == 'spaceship' ? -1 : 1;
    this.locationFromBoundingBoxes();
    this.calcHalvesAndCenters();
    laser.x = this.center.cx;
    laser.y = this.y;
    laser.itemLocation();
    lasers.push(laser);
    laser.domElem.classList.remove('hide');
}

/*====== 
  LASER
 ======*/
class Laser extends Entity{

}
class AlienLaser extends Laser{

}

// Laser Extended Detect Collision
Laser.prototype.detectColission = function(other){
    // Get the y + height value of the alienContainer
    // Use that to filter laser detectColission if laser.y >
    return Entity.prototype.detectColission.call(this, other);
}

// Laser Removal
Laser.prototype.removeLaser = function(){
    this.domElem.remove();
    lasers.pop();
    delete(this); 
}

/*====== 
  ALIEN
 ======*/

alienContainer = document.getElementById('alien-container');

function getAlienBlocksMinima(){
    
}
class Alien extends Entity{
    constructor(newBlock=false){
        super();
        this.parentElemName = this.className + '-block';
        let parentElem = document.getElementById(this.parentElemName); // check if parent already exists
        if(!parentElem && !newBlock){
            let parent = document.createElement('div');
            parent.id = this.parentElemName;
            alienContainer.appendChild(parent);
            this.parentElem = parent;
        }
        else if(newBlock){
            // write logic to handle more blocks of same alien
        }
        else{
            this.parentElem = parentElem;
        }
        this.domInit();
    }
}

// For Alien only
Alien.prototype.alienHit = function(){
    sounds.alienHit.cloneNode().play();
    this.domElem.classList.remove(this.className)
    this.domElem.classList.add('explosion')
    this.sprite.classList.add('explosion-sprite')
    this.sprite.classList.remove(this.className + "-sprite")
    this.domElem.style.opacity = 0;
    this.domElem.style.width = `${this.width}px`; // keep same distance between aliens
    this.domElem.style.height = `${this.height}px`;
    this.domElem.style.setProperty('--explosion', `var(--${this.className})`)
    let hitIndex = aliens.indexOf(this);
    aliens = aliens.slice(0,hitIndex++).concat(aliens.slice(hitIndex)) // update array
}

// Alien types
class Octopus extends Alien {}
class Crab extends Alien {}
class Squid extends Alien {}

/*========== 
  DOM SETUP
 ==========*/

// DOM elements
header = document.querySelector('header')

// spaceCraft instantiation
let spaceCraft = new Spaceship(playArea);
spaceCraft.domElem.style.display = 'none';
spaceCraft.domElem.classList.add('spaceship_position')
spaceCraft.y = spaceCraft.parentBoundRect.y + spaceCraft.parentBoundRect.height;
spaceCraft.domElem.removeAttribute('style');

// Alien Container
let aliens = [];

// Alien instantiation
const alienPoints = {Octopus, Crab, Squid}

function createAlienRow(AlienType){
    for (let i = 0; i < 11; i++) {
        let alien = new AlienType();
        aliens.push(alien);
    }
}

[Octopus, Crab, Squid].reverse().forEach( a => createAlienRow(a))

// Get Alien Blocks
const alienBlocks = Array.from(new Set(aliens.slice().reverse().map(x => x.parentElem))); // reversed again for logic, in presentation we reversed it to show in proper order. TODO: check this and remove reversed instances

// shared bounds object
let alienBlocksBounds;
function getAlienBlocksBounds(){
    alienBlocksBounds = alienBlocks.map(b => b.getBoundingClientRect())
    return alienBlocksBounds
}

// Calculate lowest point for each alienBlock
function getAlienBlocksMinima() {
    return getAlienBlocksBounds()
        .map(({ y, height }) => Number(y) + Number(height))
        .map((minima, i) => ({ [alienBlocks[i].id]: minima }))
        .reduce((acum, currentVal) => Object.assign(acum, currentVal), {})
}

// Alien Block Motion
let blockIndex = 0;
function moveBlock(){
    let alienBlock = alienBlocks[blockIndex++]
    alienBlock.style.transform = ''
}

// shooting event listener
playArea.addEventListener('click', () => spaceCraft.shootLaser())

// Stretch the window Hack
let longElemHeight = 10000;
let topLimit = longElemHeight / 2.3;
if(navigator.maxTouchPoints) {
    longElemHeight /= 10;
    topLimit = longElemHeight / 2.5; // Mobile device
}

bottomDown = document.createElement('div');
bottomDown.style.height = `${longElemHeight + window.innerHeight}px`;
document.body.append(bottomDown);

const bottomLimit = document.body.scrollHeight - topLimit;
const motionRange = bottomLimit - topLimit;

function scrollToLimit() {
    if (scrollY < topLimit) {
        scrollTo(0, topLimit + 1)
    }
    else if (scrollY > bottomLimit) {
        scrollTo(0, bottomLimit - 1)
    }

    let normalizedPosition = (scrollY - topLimit) / motionRange;
    spaceCraft.followScroller(normalizedPosition);
}

let laserSpeed = 40;
function lasersPositioning() {
    if(lasers.length){
        const laser = lasers[0];
        laser.y += (laserSpeed * laser.direction)
        if(laser.y  > `-${header.offsetHeight + laserSpeed}` ){
            laser.itemLocation();
        }
        else{

            laser.domElem.remove();
            lasers.pop()
            delete(laser);            
        }
    }
}


/*============ 
  GAME ENGINE
 ============*/

// Collision resolution
function colissionResolution() {
    const BlocksMinima = getAlienBlocksMinima();
    const absMinima = Math.min(...Object.values(BlocksMinima));
    const shipInRange = spaceCraft.overlapInY(absMinima);
    const laserInRange = lasers.length ? lasers[0].overlapInY(absMinima) : false;
    if(!shipInRange && !laserInRange) return

    for (const alien of aliens.slice().reverse()) {
        const blockMinima = BlocksMinima[alien.parentElem.id]
        const shipInRange = spaceCraft.overlapInY(blockMinima);
        const laserInRange = lasers.length ? lasers[0].overlapInY(blockMinima) : false;
    

        hitLaser = laserInRange ? lasers[0].detectColission(alien) : false;
        hitCraft = shipInRange ? spaceCraft.detectColission(alien) : false;

        if (hitCraft || hitLaser) {
            alien.alienHit();
            if (hitLaser) lasers[0].removeLaser();
        }
        else {
            // alien.domElem.style.backgroundColor = 'blue';
        }
    }
}


// GameLoop Draft
let stopLoop = false;
let loopTimeout = null;
function gameLoop() {
    clearTimeout(loopTimeout);
    loopTimeout = null;
    if (loopTimeout == null && !stopLoop) {
        scrollToLimit();
        loopTimeout = setTimeout(() => {
            lasersPositioning();
            colissionResolution();
            gameLoop();

        }, 23);
    }
}

gameLoop();


/*============= 
  HACKIE STUFF
 =============*/

// set the scroller to the middle of the page hack
// browser remembers the scrolling position and goes to it
setTimeout(() => scrollTo(0, document.body.scrollHeight / 2), 600)


//on window resize get innerHeight in the footer
let heightPrompt = document.getElementById('inner-height');
heightPrompt.style.fontSize = '3rem';
addEventListener('resize', () => heightPrompt.innerText =  `Height: ${window.innerHeight} Touch points: ${navigator.maxTouchPoints}`)