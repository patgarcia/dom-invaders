// play area
let playArea = document.getElementById('play-area');

// Entity Model
class Entity {
    constructor(parentElem, color) {
        this.x;
        this.y;
        this.cx;
        this.cy;
        this.width;
        this.height;
        this.color = color;
        this.domElem;
        this.parentElem = parentElem;

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

    if (this.color) this.domElem.style.backgroundColor = this.color;

    // attach element to get computed properties
    this.parentElem.appendChild(this.domElem);

    // get DOM computed coordinates and dimensions
    this.updateCoordsAndDimensions();
};

Entity.prototype.followScroller = function(normalizedPosition){
    let { width: parentWidth } = this.parentBoundRect;
    this.x = normalizedPosition * (parentWidth - this.width);
    this.domElem.style.transform = `translateX(${this.x}px)`;
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

// spaceCraft and Alien
let spaceCraft = new Entity(playArea, 'purple');
// let alien = new Entity(playArea, 'blue');
const aliens = [];
for (let i = 0; i < 20; i++) {
    let alien = new Entity(playArea, 'blue');
    aliens.push(alien);

}

// Stretch the window Hack
const longElemHeight = 10000;
const topLimit = longElemHeight / 2.3;

bottomDown = document.createElement('div');
bottomDown.style.height = `${longElemHeight + window.innerHeight}px`;
document.body.append(bottomDown);

const bottomLimit = document.body.scrollHeight - topLimit;

const motionRange = bottomLimit - topLimit;

function scrollToLimit() {
    if (scrollY < topLimit) {
        console.log(scrollY, scrollY < topLimit, 'moving to top')
        scrollTo(0, topLimit)
    }
    else if (scrollY > bottomLimit) {
        scrollTo(0, bottomLimit)
    }

    let normalizedPosition = (scrollY - topLimit) / motionRange;
    spaceCraft.followScroller(normalizedPosition);
}

// collision resolution
// Colission Illustration, logic to run in gameloop
function colissionResolution() {
    for (alien of aliens) {
        let alienColor = alien.domElem.style.backgroundColor; // alienColor allows to switch the color once after colission
        if (spaceCraft.detectColission(alien)) {

            if (alienColor !== 'yellow') alien.domElem.style.backgroundColor = 'yellow';
        }
        else {
            alien.domElem.style.backgroundColor = 'blue';
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

            colissionResolution();
            gameLoop()

        }, 43);
    }
}

gameLoop();

// set the scroller to the middle of the page hack
// browser remembers the scrolling position and goes to it
setTimeout(() => scrollTo(0, document.body.scrollHeight / 2), 600)
