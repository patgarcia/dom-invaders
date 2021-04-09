// play area
let playArea = document.getElementById('play-area');

// Entity Model
class Entity {
    constructor(parentElem, color) {
        this.x;
        this.y;
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
        let [x, y] = [this.x, this.y]
        return { x, y };
    }

}

Entity.prototype.domInit = function() {
    this.domElem = document.createElement('div');
    this.domElem.classList.add('entity');

    if (this.color) this.domElem.style.backgroundColor = this.color;

    // attach element to get computed properties
    this.parentElem.appendChild(this.domElem)

    // get DOM computed coordinates and dimensions
    this.updateCoordsAndDimensions();
}

Entity.prototype.newPosition = function(dx = 10) {

    dx = Number(dx);
    let absDx = Math.abs(dx);
    let maxDelta = 60;
    this.x += absDx < maxDelta ? dx : (dx / absDx) * maxDelta;
    let { x: parentX, y: parentY, width: parentWidth, height: parentHeight } = this.parentBoundRect;
    if (this.x <= parentX) {
        this.x = parentX;
    } else if (this.x + this.width > parentX + parentWidth) {
        this.x = parentWidth - this.width;
    }
    this.domElem.style.transform = `translateX(${this.x}px)`;
    console.log(this.x);
}

// using DOM getBoundClientRect update Entity's props
Entity.prototype.updateCoordsAndDimensions = function() {
    let { x, y, width, height } = this.boundRect;
    [this.x, this.y, this.width, this.height] = [x, y, width, height];
    return ({ x, y, width, height })
}

// spaceCraft and Alien
let spaceCraft = new Entity(playArea, 'purple');
let Alien = new Entity(playArea, 'blue');

// mouse Wheel capture
window.addEventListener('wheel', onScrollEvent, { passive: true })

let scroll;

function onScrollEvent(event) {
    scroll = event;
    console.log(scroll);
    spaceCraft.newPosition(dx = event.deltaY.toFixed(0))
}