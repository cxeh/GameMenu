//(function () {                                  // note to self: adjust width of the canvas -> UX, more evasion time
    // getting access to the canvas and its drawing context
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // introducing global game variables
    let ground1 = [];
    let ground2 = [];
    let ground3 = [];
    const platformWidth = 32;                     // Note to self: rename to smth like platformDim
    let stop;                          // not fully integrated yet, note to self: integrate

    let obstacles = [];
    const OBSTACLES_AVAILABLE = 4;

    // requesting animation frames
    const requestAnimFrame = (function(){
        return  window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                window.oRequestAnimationFrame      ||
                window.msRequestAnimationFrame     ||
                function(callback){
                    window.setTimeout(callback, 1000 / 60);
                };
    })();
    
    /*
     * @param {integer} low - the low bound
     * @param {integer} high - the high bound
     * @returns {integer} - the pseudorandom number such that low <= number <= high
     * helper function for obtaining a pseudorandom number in a specific range
     */
    function getRandomInRange(low, high) {
        return Math.floor(Math.random()*(high-low+1)+low);
    };

    /**
     * Defines the player object and its methods
     */
    let player = (function(player) {
        player.x      = 64;
        player.y      = 224;
        player.dx     =  0;
        player.dy     =  0;                 // note to self: obsolete feature, y doesnt/shouldnt change
        player.width  = 64;
        player.height = 64;
        player.speed  =  8;                 // note to self: this value may need a bit more tinkering, @addtoplaytesting
        player.draw = function() {
            ctx.drawImage(assetLoader.images.avatar_normal, 64, this.y);
        };
        player.reset = function() {
            player.x     = 64;
            player.y     = 224; 
            player.speed = 8;
        };
        let switchCounter = 0;
        player.update = function() { 
            if((KEY_STATUS.w || KEY_STATUS.up) && this.y > 128 && switchCounter === 0) {
                this.y -= canvas.height/3;
                switchCounter = 16;         // note to self: this value may need a bit more tinkering, @addtoplaytesting
            } else if((KEY_STATUS.s || KEY_STATUS.down) && this.y < 320 && switchCounter === 0) {
                this.y += canvas.height/3;
                switchCounter = 16;
            }

            switchCounter = Math.max(switchCounter-1, 0);

            //this.advance();
            
        };

        return player;
    })(Object.create(Vector.prototype));

    /**
     * This section handles user inpout and lets the player control the figure using keyboard
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
            "lineElement"   : "images/lineElement.jpg",
            "lineElement2"  : "images/lineElement2.jpg",    
            "sky"           : "images/sky.png",

            "obs1"          : "images/obstacles/obstacle1.jpg",
            "obs2"          : "images/obstacles/obstacle2.jpg",
            "obs3"          : "images/obstacles/obstacle3.jpg",
            "obs4"          : "images/obstacles/obstacle4.jpg"
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
                        _this.images[img].onload = function() { assetLoaded.call(_this, "images", img); };
                        _this.images[img].src = src;
                    })(_this, img);
                }
            }
        };

        return {
            images: this.images,
            totalAssets: this.totalAssets,
            downloadAll: this.downloadAll
        };
    })();

    assetLoader.finished = function() {
        //console.log("finished");
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
        this.x  =  x || 0;
        this.y  =  y || 0;
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
    
    Vector.prototype.collisionOnX = function(anotherVec) {
        let speed = (anotherVec.dx);
        let slice = 1/speed;
        let delta;
        
        for(let percent=0; percent<=speed; percent += slice) {
            delta = anotherVec.x+percent;
            if(delta <= this.x+player.width && delta >= this.x) return true;
            //if(delta < player.x+player.width && delta > 0) console.log(delta);
        }
        return false;
    };
    
    Vector.prototype.collisionOnY = function(anotherVec) { 
        //if(anotherVec.x < player.x+2*player.width)
            return (this.y >= anotherVec.y && this.y <= anotherVec.y+anotherVec.height);
        //else return false;
    };
    
    Vector.prototype.boomX = function(anotherVec) {
        let pos = anotherVec.x+anotherVec.dx;
        return (pos <= this.x+this.width && pos >= this.x);
    };

    /**
     * This function specifies the behaviour of an obstacle object
     * @param {integer} x - x coordinate
     * @param {integer} y - y coordinate
     */
    function Obstacle(x, y) {
        this.x      = x;
        this.y      = y;
        this.width  = 209;
        this.height = 128;
        this.name   = "obs"+ getRandomInRange(1, OBSTACLES_AVAILABLE);

        Vector.call(this, x, y, 0, 0);

        this.update = function() {
            this.dx = -player.speed;
            this.advance();
        };
        
        this.draw = function() {
            let image = assetLoader.images[this.name];
            // ctx.drawImage(image, this.x, this.y, image.clientWidth/((canvas.height*(1/3))-this.height), (canvas.height*(1/3))-this.height); pretty sure this is the general expression, doesnt seem to work though
            ctx.drawImage(image, this.x, this.y, 209, 128);
            ctx.restore();
        };
    }
    Obstacle.prototype = Object.create(Vector.prototype);
    
    function collisionDetection() {
        for(let obstacle of obstacles) {
            //if(player.collisionOnX(obstacle)) console.log("collision on x");
            if(player.boomX(obstacle) && player.collisionOnY(obstacle)) {       //  && player.minimalYDistance(obstacle) <= player.height
                gameOver();
            }
        }
    }

    // This function updates the position of all obstacles currently present on the canvas, removes those which are behind the figure and adds new one in their place to the right of the canvas
    function updateObstacles() {
        for(let i=0; i<obstacles.length; i++) {
            obstacles[i].update();
            obstacles[i].draw();
        }

        // if an obstacle moved too far left remove it and put a new one before the player figure
        if(obstacles[0] && obstacles[0].x < -8*platformWidth) {
            obstacles.splice(0,1);
            obstacles.push(new Obstacle(canvas.width, (canvas.height*(getRandomInRange(0, 2)/3))));
        }
    }
    
    function resetObstacles() {
        obstacles = [];
    };
    
    function resetGround() {
        ground1 = [];
        ground2 = [];
        ground3 = [];
    };
    
    function updateLines() {
        // drawing and updating three lines, note to self: move  to another function
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
    }

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
        document.getElementById('game-over').style.display = 'none';
        stop = false;
        
        resetGround();
        resetObstacles();
        player.reset();
        background.reset();
        
        for(let i=0, length = Math.floor(canvas.width / platformWidth)+2; i<length; i++) {  // prepares the three lines and creates two right to the canvas edge to prevent another from 'bliping into
            ground1[i] = {"x": i * platformWidth, "y": canvas.height-platformWidth};        // existence inside the canvas creating a disturbing visual effect as they appear
            ground2[i] = {"x": i * platformWidth, "y": canvas.height*(2/3)-platformWidth};
            ground3[i] = {"x": i * platformWidth, "y": canvas.height*(1/3)-platformWidth};
        }
        
        // note to self: in case of increasing the canvas width even further, shrink the obstacles period to smth like canvas.width*0.75, use a loop, a wait statement (setTimeout()) and a second loop
        for(let i=0; i<2; i++) {    // prepares two obstacles in advance and also sets it up in a way that there always will be two obstacles on the screen
            obstacles.push(new Obstacle(i*(canvas.width)+2*canvas.width, (canvas.height*(getRandomInRange(0, 2)/3))));  // +2*canvas.width creates a beginning without any obstacles
        }        
        
        animate();
    };

    /**
     * Main loop, takes care of updating the game at each frame
     */
    function animate() {
        if(!stop) {
            requestAnimFrame(animate);
            background.draw();
            updateObstacles();
            updateLines();
            
            collisionDetection();
            
            player.update();
            player.draw();
        }
    };
    
    function gameOver() {
        stop = true;
        document.getElementById('game-over').style.display = 'block';
    };
    
    document.getElementById('restart').addEventListener('click', startGame);
    
    assetLoader.downloadAll();
//})();