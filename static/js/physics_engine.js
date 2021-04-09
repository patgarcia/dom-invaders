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

Entity.prototype.newPosition = function (dx = 10) {
    dx = Number(dx);
    let absDx = Math.abs(dx);
    let maxDelta = 160;
    this.updateCoordsAndDimensions();

    this.x += absDx < maxDelta ? dx : (dx / absDx) * maxDelta;

    let { x:parentX, y:parentY, width:parentWidth, height:parentHeight } = this.parentBoundRect;

    if (this.x + parentX <= parentX) {
        this.x = 0;
    } else if (this.x + this.width > parentX + parentWidth) {
        this.x = parentWidth - this.width;
    }
    this.domElem.style.transform = `translateX(${this.x}px)`;
    console.log(this.x, absDx < maxDelta ? dx : (dx / absDx) * maxDelta);
};

// using DOM getBoundClientRect update Entity's props
Entity.prototype.updateCoordsAndDimensions = function () {
    let { x:parentX, y:parentY } = this.parentBoundRect;
    let { x, y, width, height } = this.boundRect;
    [this.x, this.y, this.width, this.height] = [x - parentX, y - parentY, width, height];
    // center logic is not considering the parent object displacement
    this.cx = Math.abs(this.x + this.width / 2);
    this.cy = Math.abs(this.y + this.height / 2);
};

// Colission detection logic
Entity.prototype.detectColission = function(other){
    // other must be type Entity or have coords and dimensions
    /* 
        [  this.cx  ]       [  other.cx  ]
              |--------------------|  dxBetweenEntitiesCXs
              |-----|   +   |------|  withBetweenCXs
        
    */
    this.updateCoordsAndDimensions();
    other.updateCoordsAndDimensions();

    let dxBetweenEntitiesCXs = Math.abs(this.cx - other.cx);
    let withBetweenCXs = this.width / 2 + other.width / 2;
    let colissionX = (dxBetweenEntitiesCXs - withBetweenCXs) < 0;

    let dyBetweenEntitiesCYs = Math.abs(this.cy - other.cy);
    let heightBetweenCYs = this.height / 2 + other.height / 2;
    let colissionY = (dyBetweenEntitiesCYs - heightBetweenCYs) < 0;

    return colissionX && colissionY
}

// spaceCraft and Alien
let spaceCraft = new Entity(playArea, 'purple');
let alien = new Entity(playArea, 'blue');



// mouse Wheel capture
window.addEventListener('wheel', onScrollEvent, { passive: true });

let timeout = null; //debouncing variable figure where to add it (scoped)
function onScrollEvent(event) {
    console.log('event.deltaY', event.deltaY);
    
    if(timeout == null){
    timeout = setTimeout(() => {

        let dx = event.deltaY.toFixed(0)
        console.log('inside time out', `dx: ${dx} spaceCraftPos: ${spaceCraft.x}`)
        spaceCraft.newPosition(dx);

        clearTimeout(timeout);

        timeout = null;
    }, 1);
    }
}


// GameLoop Draft
let stopLoop = false;
let loopTimeout = null;
function gameLoop(){
    console.log('ran gameloop timeout')
    clearTimeout(loopTimeout);
        loopTimeout = null;
    if(loopTimeout == null && !stopLoop){
        
        loopTimeout = setTimeout(() => {

            // Colission Illustration, logic to run in gameloop
            let alienColor = alien.domElem.style.backgroundColor; // alienColor allows to switch the color once after colission
            if(spaceCraft.detectColission(alien)){

                if(alienColor !== 'yellow') alien.domElem.style.backgroundColor = 'yellow';
            }
            else{

                alien.domElem.style.backgroundColor = 'blue';
            }
            gameLoop()


        }, 83);
    }
}

gameLoop();
