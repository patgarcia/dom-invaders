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

/*======
  UTILS
 ======*/

 const range = (n, start = 0, step = 1) => {
    return Object.keys(Array(n).fill())
    .map((x) => Number(x))
    .filter((x) => x + start < n)
    .map((x) => x + start)
    .filter((x, i) => !(i % step));
}

/*===========
  GAME LOGIC
 ===========*/

// play area
let playArea = document.getElementById('play-area');

// consts
const lasers = [];
let lives = 0;

// sound rel from index
const soundDir = 'static/snd/';
const shoot = 'shoot.wav';
const alienHit = 'alien_hit.wav';
const explosion = 'explosion.wav';

// sound nodes
const sounds = { shoot, alienHit, explosion }
for(sound in sounds){
    const soundNode = document.createElement('audio');
    soundNode.src = soundDir + sounds[sound];
    soundNode.preload = 'auto';
    sounds[sound] = soundNode;
}

/*============= 
  ENTITY MODEL
 =============*/
class Entity {
    constructor(parentElem, className=null) {
        this.x;
        this.y;
        this.cx;
        this.cy;
        this.width;
        this.height;
        this.domElem;
        this.sprite;
        this.className = className || this.constructor.name.toLowerCase();
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
    let { x:parentX, y:parentY } = this.parentBoundRect;
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

Spaceship.prototype.overlapInY = function(minima){
    return (this.domElem.offsetTop - 25) < minima
}

Spaceship.prototype.detectColission = function(alien){
    let overlapY = (this.domElem.offsetTop - 25) < alien.parentNode.y;
    let spaceCraftcenterX = spaceCraft.x - spaceCraft.width / 2;
    let alienCenterX = alien.x - alien.width / 2;
    let dxBetweenEntitiesCXs = Math.abs(spaceCraftcenterX - alienCenterX);
    let withBetweenCXs = spaceCraft.width / 2 + alien.width / 2;
    let colissionX = (dxBetweenEntitiesCXs - withBetweenCXs) < 0;
    return overlapY && colissionX
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
const alienPoints = { octopus: 10, crab: 20, squid: 30 }

const alienRows = [];
class AlienRow extends Entity{
    
    get rowName(){
        return this.className;
    }
}

AlienRow.prototype.domInit = function () {
    this.domElem = document.createElement('div');
    this.domElem.classList.add(this.className);

    // attach element to get computed properties
    this.parentElem.appendChild(this.domElem);

    // get DOM computed coordinates and dimensions
    this.locationFromBoundingBoxes();

    // Pre-compute Half width and height as well as cx and cy
    this.calcHalvesAndCenters();
}

AlienRow.prototype.setWidthAndHeight = function(){
    this.domElem.style.height = `${this.height}px`;
    this.domElem.style.width = `${this.width}px`;
}

let aliensPerRow = 11;
class Alien extends Entity{
    constructor(){
        super();
        let parentElemName = `${this.className}-block`;
        let parentNodes = alienRows.map(row => row.rowName);
        let parentNode = alienRows[parentNodes.lastIndexOf(parentElemName)];
        let parentLen = parentNode ? parentNode.domElem.children.length : null;
        if(!parentNode || parentLen >= aliensPerRow){
            parentNode = new AlienRow(alienContainer, parentElemName);
            alienRows.push(parentNode);
            let parent = parentNode.domElem;            
            this.parentElem = parent;
            this.parentNode = parentNode;
        }
        else {
            this.parentElem = parentNode.domElem;
            this.parentNode = parentNode;
        }
        
        this.alt = false;
        this.altSpriteName = `${this.className}-alt-sprite`;
        this.spriteName = `${this.className}-sprite`

        this.domInit();
    }
}

// For Alien only
Alien.prototype.alienHit = function(){
    updateScore(score1, alienPoints[this.className])
    sounds.alienHit.cloneNode().play();
    this.domElem.classList.remove(this.className)
    this.domElem.classList.add('explosion')
    this.sprite.classList.add('explosion-sprite')
    this.sprite.classList.remove(this.className + '-sprite')
    this.domElem.style.opacity = 0;
    this.domElem.style.width = `${this.width}px`; // keep same distance between aliens
    this.domElem.style.height = `${this.height}px`;
    this.domElem.style.setProperty('--explosion', `var(--${this.className})`)
    let hitIndex = aliens.indexOf(this);
    aliens = aliens.slice(0,hitIndex++).concat(aliens.slice(hitIndex)) // update array
}

// Alien types
class Octopus extends Alien { }
class Crab extends Alien { }
class Squid extends Alien { }

/*========== 
  DOM SETUP
 ==========*/

// query parameters
const queryParams = new URLSearchParams(window.location.search);
const playAgain = queryParams.get('continue');

// DOM elements
let header = document.querySelector('header');
let score1 = document.getElementById('score1');
let score2 = document.getElementById('score2');
let highScore = document.getElementById('highScore');
let footer = document.querySelector('footer');
let livesElem = document.querySelector('.footer-left').querySelector('span');

// spaceCraft instantiation
let spaceCraft = new Spaceship(playArea);
spaceCraft.domElem.style.display = 'none';
spaceCraft.domElem.classList.add('spaceship_position')
spaceCraft.y = spaceCraft.parentBoundRect.y + spaceCraft.parentBoundRect.height;
spaceCraft.domElem.removeAttribute('style');
spaceCraft.locationFromBoundingBoxes();

// Alien Container
let aliens = [];

// Alien instantiation
let spaceBetweenAliens = 10;
let yOffset = alienContainer.getBoundingClientRect().height * .30   ;
function createAlienRow(AlienType, row){
    let alien;
    for (let i = 0; i <= 10; i++) {
        alien = new AlienType();
        alien.x = (alien.width * i + spaceBetweenAliens * i) + 100; // offset of 100
        alien.y = 0;
        alien.itemLocation();
        aliens.push(alien);
    }
    let parentNode = alien.parentNode;
    [parentNode.x, parentNode.y, parentNode.width, parentNode.height] = [ 0,  alien.width * row + yOffset, alien.width * aliensPerRow, alien.width] // used alien width instead of height for gratuitous padding
    parentNode.setWidthAndHeight();
    parentNode.itemLocation();
}

[Octopus, Octopus, Crab, Crab, Squid].reverse().forEach( 
    (a, row) => {
        createAlienRow(a, row);
    });


/* =========
   MOVEMENT
 ========== */

// Calculate lowest point for each alienBlock
function getAlienBlocksMinima() {
    return alienRows.sort((a,b) => b.y - a.y)[0].y
}

// Shooting event listener
playArea.addEventListener('click', () => spaceCraft.shootLaser())

// spaceCraft controller 
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

// Laser travel through screen
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

// Alien block movement
let playAreaLimitX = playArea.getBoundingClientRect().width;

let moveAlienArray;
let moveAlienArraySwitch;
let moveArray;

function updateArrays(){
    moveAlienArray = aliens.slice().reverse();
    moveAlienArraySwitch = (range(moveAlienArray.length, 0, 11)).map((n,i,a) => moveAlienArray.slice(n, n+11).reverse())
    moveAlienArraySwitch = moveAlienArraySwitch.reduce((a,i) => a.concat(i),[])
    moveArray = moveAlienArray;
}
updateArrays();

let alienStep = 10;
let alienDirection = 1;
let directionSwitchingIndex;
let alienIndex = 0;
let stepDown = false;
let stepDownCounter = 1;
function moveAlien(alien){
    function stepDownNow(){
        for (let alienRow of alienRows){
            alienRow.y += alien.height;
        }
        stepDownCounter++;
    }
    function switchDir(){
        alienDirection *= -1;
        directionSwitchingIndex = alienIndex - 1;
        stepDown = !stepDown
        stepDownNow();
    }
    if(alien.alt){
        alien.sprite.className = '';
        alien.sprite.classList.add(alien.altSpriteName);
        
    }
    else{
        alien.sprite.className = '';
        alien.sprite.classList.add(alien.spriteName);
        
    }
    alien.alt = !alien.alt;
    if(alien.x + (alienStep * alienDirection) + alien.width > playAreaLimitX && alienDirection === 1){
        switchDir();
        moveArray = moveAlienArraySwitch;
    }
    else if(alien.x + (alienStep * alienDirection) < 0 && alienDirection === -1){
        switchDir();
        moveArray = moveAlienArray;
    }
    if(!stepDown){
        alien.x += (alienStep * alienDirection);
    }
    else{
        alienIndex = 0;
        stepDown = !stepDown
    }
    
    alien.itemLocation();
    alien.parentNode.itemLocation();
    
}

function moveAliens(){
    let alien = moveArray[alienIndex];
    alienIndex++;
    alienIndex %= moveArray.length;
    if(!alienIndex && alienStep < 70) alienStep++;
    moveAlien(alien);
}

/*===
  UI
 ===*/
function updateScore(score, amount){
    score.innerText = `${Number(score.innerText) + amount}`.padStart(5,0);
}

// Modal
let modal = document.getElementById('modal');
modal.classList.add('hide');
function toggleModal(){
    if(modal.classList.contains('hide')){
        modal.className = '';
    }
    else{
        modal.classList.add('hide')
    }
}

// Game Intro
let introWindow = document.createElement('div');
introWindow.id = 'intro';
let introTitle = document.createElement('h1');
introTitle.innerHTML = '<span>DOM</span> INVADERS';
let introButton = document.createElement('button');
introButton.innerText = 'Start Playing';
introButton.addEventListener('click', () => {
    stopLoop = !stopLoop; 
    if(!stopLoop) gameLoop();
    toggleModal();
})
let introP = document.createElement('p');
introP.innerText = 'Mouse wheel scroll controls the ship and click above red line to shoot'
introWindow.appendChild(introTitle);
introWindow.appendChild(introButton);
introWindow.appendChild(introP);
function triggerModal(elem){
    stopLoop = !stopLoop;
    modal.innerHTML = '';
    modal.appendChild(elem);
    toggleModal();
}

// GameOver
let overWindow = document.createElement('div');
overWindow.id = 'gameover';
let overTitle = document.createElement('h1');
overTitle.innerHTML = '<span>GAME OVER</span>';
let overButton = document.createElement('button');
overButton.innerText = 'Try Again';
overButton.addEventListener('click', () => {
    location.href = '?continue=true';
})
overWindow.appendChild(overTitle);
overWindow.appendChild(overButton);


// WIN
let winWindow = document.createElement('div');
winWindow.id = 'won';
let winTitle = document.createElement('h1');
winTitle.innerHTML = '<span>YOU WIN!</span>';
let winP = document.createElement('p');
winP.innerText = `Your score: \n ${ score1.innerText }`
let winButton = document.createElement('button');
winButton.innerText = 'Do it again!';
winButton.addEventListener('click', () => {
    location.href = '?continue=true';
})
winWindow.appendChild(winTitle);
winWindow.appendChild(winP);
winWindow.appendChild(winButton);


/*============ 
  GAME ENGINE
 ============*/

// Game Over
function isGameOver(){
    sounds.explosion.cloneNode().play();
    if(lives <= 0){
        triggerModal(overWindow);
    }
    else{
        lives--;
        livesElem.innerText = lives;
        document.querySelector('.footer-left').querySelector('.spaceship').remove()
    }
}

// WIN
function playerHasWon(){
    if(aliens.length == 0){
        winP.innerText = `Your score: \n ${ score1.innerText }`
        triggerModal(winWindow);
    }
}

// Collision resolution
function colissionResolution() {
    const absMinima = getAlienBlocksMinima();
    const shipInRange = spaceCraft.overlapInY(absMinima);
    const laserInRange = lasers.length ? lasers[0].overlapInY(absMinima) : false;
    if(!shipInRange && !laserInRange) return

    for (const alien of aliens.slice().reverse()) {
        const blockMinima = alien.parentNode.y + alien.parentNode.height;
        const shipInRange = spaceCraft.overlapInY(blockMinima);
        const laserInRange = lasers.length ? lasers[0].overlapInY(blockMinima) : false;

        hitLaser = laserInRange ? lasers[0].detectColission(alien) : false;
        hitCraft = shipInRange ? spaceCraft.detectColission(alien) : false;

        if (hitCraft || hitLaser) {
            if (hitLaser) lasers[0].removeLaser();
            if (hitCraft) isGameOver();
            alien.alienHit();

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
            moveAliens();
            playerHasWon();
            gameLoop();

        }, 23);
    }
}


/*============= 
  HACKIE STUFF
 =============*/

 // reset bounding box of aliens once DOM is loaded
 window.onload = () => {
    aliens.forEach( alien => alien.locationFromBoundingBoxes());
    gameLoop();
    if(!playAgain) triggerModal(introWindow);
};


// set the scroller to the middle of the page hack
// browser remembers the scrolling position and goes to it
setTimeout(() => scrollTo(0, document.body.scrollHeight / 2), 600)


// on window resize get innerHeight in the footer
// use this for mobile device exploration
/* let heightPrompt = document.getElementById('inner-height');
heightPrompt.style.fontSize = '3rem';
addEventListener('resize', () => heightPrompt.innerText =  `Height: ${window.innerHeight} Touch points: ${navigator.maxTouchPoints}`) */