// getting access to the canvas and its drawing context
let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

// introducing global game variables
let ground1 = [];
let ground2 = [];
let ground3 = [];
let currentLevel = 1;                          // player is starting at the middle line
let platformWidth = 32;
let platformHeight = canvas.height - platformWidth * 4;

let obstacles = [];

// requesting animation frames
let requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.oRequestAnimationFrame      ||
            window.msRequestAnimationFrame     ||
            function(callback){
                window.setTimeout(callback, 1000 / 60);
            };
})();

/**
 * Defines the player object and its methods
 */
let player = (function(player) {
    player.dy     = 0;
    player.width  = 64;
    player.height = 64;
    player.speed  = 6;
    player.draw = function(yCoord) {
        ctx.drawImage(assetLoader.images.avatar_normal, 64, yCoord);
    };
    player.reset = function() {
        player.x = 64;
        currentLevel = 1;
    };
    let switchCounter = 0;
    player.update = function(currentLevel) {
        if((KEY_STATUS.w || KEY_STATUS.up) && currentLevel !== 2 && switchCounter === 0) {
            currentLevel++;
            switchCounter = 21;
        } else if((KEY_STATUS.s || KEY_STATUS.down) && currentLevel !== 0 && switchCounter === 0) {
            currentLevel--;
            switchCounter = 21;
        }
        
        switchCounter = Math.max(switchCounter-1, 0);
        
        this.advance();
        
        // perhaps call the draw function here        
        return currentLevel;
    };
    
    return player;
})(Object.create(Vector.prototype));

/**
 * This section handles user inpout and lets the player control the fugure using keyboard
 */
let KEY_CODES = {
    38: 'up',
    40: 'down',
    83: 's',
    87: 'w'    
};
let KEY_STATUS = {};
for(let code in KEY_CODES) {
    if(KEY_CODES.hasOwnProperty(code)) {
        KEY_STATUS[KEY_CODES[code]] = false;
    }
}
document.onkeydown = function(e) {
    let keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if(KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
};
document.onkeyup = function(e) {
    let keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if(KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
};

/**
 * This feature takes care of ensuring that all images will be loaded by the start of the game
 */
let assetLoader = (function() {
    this.images = {                                         // property holding all images
        "avatar_normal" : "images/gr.png",
        "avatar_alza"   : "images/alza.jpg",
        "bg"            : "images/bg.png",
        "lineElement"   : "images/lineElement.png",
        "sky"           : "images/sky.png",
        
        "obs1"          : "images/obstacles/obstacle1.jpg"
    };
    let assetsLoaded = 0;                                  // number of assets currently loaded
    this.totalAssets = Object.keys(this.images).length;    // total number of assets
    
    /**
     * Load all assets before starting the game
     * @param prop - name of the assetLoader property holding all images ("images")
     * @param name - name of the asset in the holding property
     */
    function assetLoaded(prop, name) {
        if(this[prop][name].status !== "loading" ) {
            return;
        }
        this[prop][name].status = "loaded";
        assetsLoaded++;
        if(assetsLoaded === this.totalAssets && typeof this.finished === "function") {
            this.finished();
        }
    }
    
    /**
     * Ensures that all assets will be loaded
     */
    this.downloadAll = function() {
        let _this = this;
        let src;
        for(let img in this.images) {
            if(this.images.hasOwnProperty(img)) {
                src = this.images[img];
                (function(_this, img) {
                    _this.images[img] = new Image();
                    _this.images[img].status = "loading";
                    _this.images[img].name = img;
                    _this.images[img].onload = function() { assetLoaded.call(_this, "images", img) };
                    _this.images[img].src = src;
                })(_this, img);
            }
        }
    }

    return {
        images: this.images,
        totalAssets: this.totalAssets,
        downloadAll: this.downloadAll
    };
})();

assetLoader.finished = function() {
    console.log("finished");
    startGame();
};

/**
 * A vector object holding the current coordinates of an object andits direction in a 2d space
 * @param {integer} x - x coordinate
 * @param {integer} y - y coordinate
 * @param {integer} dx - change in x
 * @param {integer} dy - change in y
 */
function Vector(x, y, dx, dy) {
    this.x = x || 0;
    this.y = y || 0;
    this.dx = dx || 0;
    this.dy = dy || 0;
}

/**
 * Advance the vectors position by dx, dy
 */
Vector.prototype.advance = function() {
    this.x += this.dx;
    this.y += this.dy;
};

/**
 * Get the minimum distance between two vectors
 * @param vec - another vector
 * @return minDist
 */
Vector.prototype.minDist = function(vec) {
    let minDist = Number.POSITIVE_INFINITY;
    let max     = Math.max(Math.abs(this.dx), Math.abs(this.dy), Math.abs(vec.dx), Math.abs(vec.dy));
    let slice   = 1 / max;
    let x, y, distSquared;
    
    // get the middle of each vector
    let vec1 = {}, vec2 = {};
    vec1.x = this.x + this.width/2;
    vec1.y = this.y + this.height/2;
    vec2.x = vec.x + vec.width/2;
    vec2.y = vec.y + vec.height/2;
    
    for(let percent=0; percent<1; percent += slice) {
        x = (vec1.x + this.dx * percent) - (vec2.x + vec.dx * percent);
        y = (vec1.y + this.dy * percent) - (vec2.y + vec.dy * percent);
        distSquared = x * x + y * y;
        minDist = Math.min(minDist, distSquared);
    }

    return Math.sqrt(minDist);
};

/**
 * This function specifies the behaviour of an obstacle object
 * @param {integer} x - x coordinate
 * @param {integer} y - y coordinate
 * @param {string} name - name of the obstacle
 */
function Obstacle(x, y, name) {
    this.x      = x;
    this.y      = y;
    this.width  = platformWidth;
    this.height = platformWidth;
    this.name = name;
    
    Vector.call(this, x, y, 0, 0);
    
    this.update = function() {
        this.dx = player.speed;
        this.advance();
    };
    this.draw = function() {
        ctx.save();
        ctx.translate(0.5,0.5);
        ctx.drawImage(assetLoader.images[this.name], this.x, this.y);
        ctx.restore();
    };
}
Obstacle.prototype = Object.create(Vector.prototype);


/**
 * Create a parallax background
 */
let background = (function() {
    let sky   = {};
    this.draw = function() {
        ctx.drawImage(assetLoader.images.bg, 0, 0);
        sky.x -= sky.speed;
        ctx.drawImage(assetLoader.images.sky, sky.x, sky.y);
        ctx.drawImage(assetLoader.images.sky, sky.x + canvas.width, sky.y);
        // If the image scrolled off the screen, reset
        if( sky.x + assetLoader.images.sky.width <= 0) {
            sky.x = 0;
        }
    };
    // reset background
    this.reset = function()  {
        sky.x = 0;
        sky.y = 0;
        sky.speed = 0.2;
    };
    return {
        draw: this.draw,
        reset: this.reset
    };
})();

/**
 * Start the game - reset all variables and entities, spawn platforms and water.
 */
function startGame() {
    for(let i=0, length = Math.floor(canvas.width / platformWidth)+2; i<length; i++) {
        ground1[i] = {"x": i * platformWidth, "y": canvas.height-platformWidth};
        ground2[i] = {"x": i * platformWidth, "y": canvas.height*(2/3)-platformWidth};
        ground3[i] = {"x": i * platformWidth, "y": canvas.height*(1/3)-platformWidth};
    }
    background.reset();
    animate();
}

/**
 * Main loop, takes care of updating the game at each frame
 */
function animate() {
    requestAnimFrame(animate);
    background.draw();
    
    // drawing and updating three lines
    for(let i=0; i<ground1.length; i++) {
        ground1[i].x -= player.speed;
        ground2[i].x -= player.speed;
        ground3[i].x -= player.speed;
        ctx.drawImage(assetLoader.images.lineElement, ground1[i].x, ground1[i].y);
        ctx.drawImage(assetLoader.images.lineElement, ground2[i].x, ground2[i].y);
        ctx.drawImage(assetLoader.images.lineElement, ground3[i].x, ground3[i].y);
    }
    
    if(ground1[0].x <= -platformWidth) {
        ground1.shift();
        ground1.push({"x": ground1[ground1.length-1].x + platformWidth, "y": canvas.height-platformWidth});
    }
    else if(ground2[0].x <= -platformWidth) {
        ground2.shift();
        ground2.push({"x": ground2[ground2.length-1].x + platformWidth, "y": canvas.height*(2/3)-platformWidth});
    }
    else if(ground3[0].x <= -platformWidth) {
        ground3.shift();
        ground3.push({"x": ground3[ground3.length-1].x + platformWidth, "y": canvas.height*(1/3)-platformWidth});
    }
    currentLevel = player.update(currentLevel);                                // try with currentLevel being player property
    player.draw(canvas.height*((3-currentLevel)/3)-platformWidth*3);           // Note to self: y coord will be changing
}
assetLoader.downloadAll();