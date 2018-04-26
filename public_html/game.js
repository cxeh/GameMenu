let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

let ground1 = [];
let ground2 = [];
let ground3 = [];
let currentLevel = 1;                          // player is starting at the middle line
let platformWidth = 32;
let platformHeight = canvas.height - platformWidth * 4;
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

let player = {};
player.width  = 64;
player.height = 64;
player.speed  = 6;
player.draw = function(yCoord) {
    ctx.drawImage(assetLoader.images.avatar_normal, 64, yCoord);
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
    return currentLevel;
};

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
  
let assetLoader = (function() {
    this.images = {                                         // property holding all images
        "avatar_normal" : "images/gr.png",
        "avatar_alza"   : "images/alza.jpg",
        "bg"            : "images/bg.png",
        "lineElement"   : "images/lineElement.png",
        "sky"           : "images/sky.png"
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