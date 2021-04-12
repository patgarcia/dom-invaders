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

// Entity Model
class Entity {
    constructor(parentElem, className) {
        this.x;
        this.y;
        this.cx;
        this.cy;
        this.width;
        this.height;
        this.domElem;
        this.sprite;
        this.className = className;
        this.parentElem = parentElem;
        this.shotBy;

        this.domInit();
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
        this.updateCoordsAndDimensions();
        let [cx, cy] = [this.cx, this.cy];
        return { cx, cy }
    }
}

Entity.prototype.domInit = function () {
    this.domElem = document.createElement('div');
    this.domElem.classList.add('entity');
    this.domElem.classList.add(this.className);
    
    this.sprite = document.createElement('div');
    this.sprite.classList.add(`${this.className}_sprite`);
    this.domElem.appendChild(this.sprite);

    // attach element to get computed properties
    this.parentElem.appendChild(this.domElem);

    // get DOM computed coordinates and dimensions
    this.updateCoordsAndDimensions();
};

Entity.prototype.followScroller = function(normalizedPosition){
    let { width: parentWidth } = this.parentBoundRect;
    this.x = normalizedPosition * (parentWidth - this.width);
    this.domElem.style.transform = `translate(${this.x}px)`;
}

Entity.prototype.itemLocation = function(){
    this.domElem.style.transform = `translate(${this.x}px, ${this.y}px)`
}

Entity.prototype.shootLaser = function(){
    if(lasers.length !== 0) return
    const laser = new Entity(playArea, 'laser');
    laser.domElem.classList.add('hide');
    laser.shotBy = this;
    laser.direction = this.className == 'spaceship' ? -1 : 1;;
    laser.x = this.center.cx;
    laser.y = this.y;
    laser.itemLocation();
    lasers.push(laser);
    sounds.shoot.cloneNode().play();
    laser.domElem.classList.remove('hide');
}

Entity.prototype.removeLaser = function(){
    this.domElem.remove();
    lasers.pop();
    delete(this); 
}

Entity.prototype.alienHit = function(){
    sounds.alienHit.cloneNode().play();
    this.domElem.classList.remove(this.className)
    this.domElem.classList.add('explosion')
    this.sprite.classList.add('explosion_sprite')
    this.sprite.classList.remove(this.className + "_sprite")
    this.domElem.style.opacity = 0;

}

// using DOM getBoundClientRect update Entity's props
Entity.prototype.updateCoordsAndDimensions = function () {
    let { x: parentX, y: parentY } = this.parentBoundRect;
    let { x, y, width, height } = this.boundRect;
    [this.x, this.y, this.width, this.height] = [x - parentX, y - parentY, width, height];
    // center logic is not considering the parent object displacement
    [this.halfWidth, this.halfHeight] = [this.width / 2, this.height / 2]
    this.cx = Math.abs(this.x + this.halfWidth);
    this.cy = Math.abs(this.y + this.halfHeight);
};

// Colission detection logic | Ignores entry side
Entity.prototype.detectColission = function (other) {
    // other must be type Entity or have coords and dimensions
    /* 
        [  this.cx  ]       [  other.cx  ]
              |--------------------|  dxBetweenEntitiesCXs
              |-----|   +   |------|  withBetweenCXs
        
    */
    this.updateCoordsAndDimensions();
    other.updateCoordsAndDimensions();

    let dxBetweenEntitiesCXs = Math.abs(this.cx - other.cx);
    let withBetweenCXs = this.halfWidth + other.halfWidth;
    let colissionX = (dxBetweenEntitiesCXs - withBetweenCXs) < 0;

    let dyBetweenEntitiesCYs = Math.abs(this.cy - other.cy);
    let heightBetweenCYs = this.halfHeight + other.halfHeight;
    let colissionY = (dyBetweenEntitiesCYs - heightBetweenCYs) < 0;

    return colissionX && colissionY
}

// DOM elements
header = document.querySelector('header')
alienBlock = document.getElementById('alien-block');

// spaceCraft and Alien
let spaceCraft = new Entity(playArea, 'spaceship');
spaceCraft.domElem.style.display = 'none';
spaceCraft.domElem.classList.add('spaceship_position')
spaceCraft.y = spaceCraft.parentBoundRect.y + spaceCraft.parentBoundRect.height;
spaceCraft.domElem.removeAttribute('style');

const aliens = [];
for (let i = 0; i < 10; i++) {
    let alien = new Entity(alienBlock, 'alien');
    aliens.push(alien);
}

// shooting event listener
playArea.addEventListener('click', ()=> spaceCraft.shootLaser())

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
        console.log(scrollY, scrollY < topLimit, 'moving to top')
        scrollTo(0, topLimit + 1)
    }
    else if (scrollY > bottomLimit) {
        scrollTo(0, bottomLimit - 1)
    }

    let normalizedPosition = (scrollY - topLimit) / motionRange;
    spaceCraft.followScroller(normalizedPosition);
}

function lasersPositioning() {
    if(lasers.length){
        const laser = lasers[0];
        laser.y += (120 * laser.direction)
        if(laser.y  > `-${header.offsetHeight}` ){
            laser.itemLocation();
        }
        else{
            laser.domElem.remove();
            lasers.pop()
            delete(laser);            
        }
    }
}

// collision resolution
// Colission Illustration, logic to run in gameloop
function colissionResolution() {
    for (const alien of aliens) {
        hitLaser = lasers.length ? lasers[0].detectColission(alien) : false
        if (spaceCraft.detectColission(alien) || hitLaser) {

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

        }, 20);
    }
}

gameLoop();

// set the scroller to the middle of the page hack
// browser remembers the scrolling position and goes to it
setTimeout(() => scrollTo(0, document.body.scrollHeight / 2), 600)


//on window resize get innerHeight in the footer
let heightPrompt = document.getElementById('inner-height');
heightPrompt.style.fontSize = '3rem';
addEventListener('resize', () => heightPrompt.innerText =  `Height: ${window.innerHeight} Touch points: ${navigator.maxTouchPoints}`)