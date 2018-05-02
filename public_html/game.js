(function () {      // establishing a separate namespace, prohibiting access from the console
    // getting access to the canvas and its drawing context
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d", { alpha : false });

    // introducing global game variables
    let ground1 = [];                   // array containing images forming the lowest line
    let ground2 = [];                   // array containing images forming the middle line
    let ground3 = [];                   // array containing images forming the uppermost line
    const platDimension = 32;           // constant holding dimensions of a square line element image in pixels 
    let stop;                           // false on default, turns true when the player hits an obstacle, stops animations
    let score;                          // variable keeping track of score
    let accelerateThreshold;       // variable setting the first point where the game begins to speed up

    let obstacles = [];                 // array incorporating all obstacles present at a given point in time
    const OBSTACLES_AVAILABLE = 4;      // constant holding the number of images serving as obstacles

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
     * @param   {integer} low  - the low bound
     * @param   {integer} high - the high bound
     * @returns {integer}      - the pseudorandom integer such that low <= number <= high
     * helper function for obtaining a pseudorandom number in a specific range
     */
    function getRandomInRange(low, high) {
        return Math.floor(Math.random()*(high-low+1)+low);
    };

    /**
     * Defines the player object and its methods
     */
    let player = (function(player) {         // creating another private namespace belonging to player object
        player.x      =  64;                 // x coordinate of the player object, remains constant
        player.y      = 224;                 // y coordinate of the player object, either 64, 224 or 384 at all times
        player.dx     =   8;                 // "speed" along the x coordinate of the player object (player doesnt move)
        player.width  =  64;                 // width  of the player object
        player.height =  64;                 // height of the player object
        player.draw = function() {           // draw function of player, since there are no animation it just draws an image
            ctx.drawImage(assetLoader.images.avatar_normal, 64, this.y);
        };
        player.reset = function() {          // resets players position and speed to default values
            player.x     =  64;
            player.y     = 224; 
            player.dx    =   8;
        };
        player.accelerate = function() {            
            player.dx += 2;                  // accelerate
            accelerateThreshold += 15;       // raise the threshold for another speed increase
        };
        let switchCounter = 0;               // initializes switchCounter which is used to set delay before line can be changed again
        player.update = function() {         // updates the player positioin based on keyboard input
            if((KEY_STATUS.w || KEY_STATUS.up || SWIPES === "up") && this.y > 128 && switchCounter === 0) {                
                this.y -= canvas.height/3;   // actually moves the player by changing the y coordinate
                switchCounter = 16;          // the higher the number, the longer the delay before being able to change the line again
                SWIPES = "none";
            } else if((KEY_STATUS.s || KEY_STATUS.down || SWIPES === "down") && this.y < 320 && switchCounter === 0) {
                this.y += canvas.height/3;   // same thing, just moves the player downwards
                switchCounter = 16;
                SWIPES = "none";
            }
            switchCounter = Math.max(switchCounter-1, 0);   // decreases the switchCounter delay
        };

        return player;
    })(Object.create(Vector.prototype));     // imports the functions of Vector.prototype to be used by player object

    /**
     * This section handles user inpout and lets the player control the figure using keyboard
     */
    let KEY_CODES = {                        // includes the codes of keys used to control the players figure
        38: 'up',
        40: 'down',
        83: 's',
        87: 'w'    
    };
    let KEY_STATUS = {};                     // true or false based on if the respective key has been pressed
    for(let code in KEY_CODES) {
        if(KEY_CODES.hasOwnProperty(code)) {
            KEY_STATUS[KEY_CODES[code]] = false;    // set the default value to false
        }
    }
    document.onkeydown = function(e) {       // handles the event when a key has been pressed
        let keyCode = (e.keyCode) ? e.keyCode : e.charCode;
        if(KEY_CODES[keyCode]) {
            e.preventDefault();
            KEY_STATUS[KEY_CODES[keyCode]] = true;  // if the key has been pressed, set the value to true;
        }
    };
    document.onkeyup = function(e) {         // handles the event when a previously pressed key has been released
        let keyCode = (e.keyCode) ? e.keyCode : e.charCode;
        if(KEY_CODES[keyCode]) {
            e.preventDefault();
            KEY_STATUS[KEY_CODES[keyCode]] = false; // if the key has been released, reset the value to false
        }
    };
    
    let SWIPES = "none";
    function mouseswipedetect() {  
        let swipedir;
        let startY;
        let distY;
        let threshold = 50;                        //required min distance traveled to be considered swipe
        let allowedTime = 300;                      // maximum time allowed to travel that distance
        let elapsedTime;
        let startTime;
        let isMouseDown = false;

        function handleswipe(sdir) {            
            SWIPES = sdir;
        }

        canvas.addEventListener('mousedown', function(e){
            swipedir = 'none';
            startY = e.pageY;
            startTime = new Date().getTime();       // record time when finger first makes contact with surface
            isMouseDown = true;
            e.preventDefault();
            e.stopPropagation();
        }, false);

        canvas.addEventListener('mousemove', function(e){
            e.preventDefault();                     // prevent scrolling
            e.stopPropagation();
        }, false);

        canvas.addEventListener('mouseup', function(e){
            if(isMouseDown) {
                distY = e.pageY - startY;           // get vertical dist traveled by finger while in contact with surface
                elapsedTime = new Date().getTime() - startTime;  // get time elapsed
                if(elapsedTime <= allowedTime) {    // first condition for awipe met
                    if(Math.abs(distY) >= threshold){            // 2nd condition for vertical swipe met
                        swipedir = (distY < 0) ? 'up' : 'down';  // if dist traveled is negative, it indicates up swipe
                    }
                }
                isMouseDown = false;                
                handleswipe(swipedir);
                e.preventDefault();
                e.stopPropagation();
            };
        }, false);

        return {
//            originX: this.startX,
//            originY: this.startY,
//            destinationX: this.distX,
//            destinationY: this.distY,
            //dir: this.swipedir
        };
    };
    
    function swipedetect() {
  
        let swipedir;
        let startY;
        let distY;
        let threshold = 50;                            //required min distance traveled to be considered swipe
        let allowedTime = 300;                          // maximum time allowed to travel that distance
        let elapsedTime;
        let startTime;
        let isMouseDown = false;

        function handleswipe(sdir) {
            SWIPES = sdir;
        }

        canvas.addEventListener('touchstart', function(e){
            swipedir = 'none';
            startY = e.changedTouches[0].pageY;
            startTime = new Date().getTime(); // record time when finger first makes contact with surface
            isMouseDown = true;
            e.preventDefault();
            //e.stopPropagation();
        });

        canvas.addEventListener('touchmove', function(e){
            e.preventDefault(); // prevent scrolling when inside DIV;
            //e.stopPropagation();
        });

        canvas.addEventListener('touchend', function(e){
            if(isMouseDown) {
                distY = e.changedTouches[0].pageY - startY; // get vertical dist traveled by finger while in contact with surface
                elapsedTime = new Date().getTime() - startTime // get time elapsed
                if(elapsedTime <= allowedTime) { // first condition for awipe met
                    if (Math.abs(distY) >= threshold){ // 2nd condition for vertical swipe met
                        swipedir = (distY < 0)? 'up' : 'down'; // if dist traveled is negative, it indicates up swipe
                    }
                };
                isMouseDown = false;
                handleswipe(swipedir);
                e.preventDefault();
                //e.stopPropagation();
            }
        });

        return {
//            originX: this.startX,
//            originY: this.startY,
//            destinationX: this.distX,
//            destinationY: this.distY,
//            dir: this.swipedir
        };
    };

    /**
     * This feature takes care of ensuring that all images will be loaded by the start of the game
     */
    let assetLoader = (function() {
        this.images = {                                         // property holding all images
            "avatar_normal" : "images/gr.png",                  // an alias and the path to the image
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
                return;                             // if this asset is still loading return back
            }
            this[prop][name].status = "loaded";     // if this asset is no longer loading, mark it as loaded
            assetsLoaded++;                         // and raise the number of loaded assets by one
            if(assetsLoaded === this.totalAssets && typeof this.finished === "function") {
                this.finished();                    // if all assets are longer, call the finished function
            }
        }

        /**
         * Ensures that all assets will be loaded
         */
        this.downloadAll = function() {
            let _this = this;                       // stores the this reference so it can be used in the IIFE
            let src;                                // declares the src variable which will be used later
            for(let img in this.images) {           // traverses all entries in the images array
                if(this.images.hasOwnProperty(img)) {   // if images has an uninherited property, continue
                    src = this.images[img];         // store the reference to an entry of images
                    (function(_this, img) {         // IIFE isolating the following part of the code
                        _this.images[img] = new Image();    // associates a new Image object with an array entry
                        _this.images[img].status = "loading";   // changes its statuts to loading
                        _this.images[img].name = img;       // sets an array entry to reference the image
                        _this.images[img].onload = function() { assetLoaded.call(_this, "images", img); };
                        _this.images[img].src = src;    // replace the path to the image with the image itself
                    })(_this, img);
                }
            }
        };

        return {                                     // export stuff out of this IIFE to the rest of the script
            images: this.images,
            totalAssets: this.totalAssets,
            downloadAll: this.downloadAll
        };
    })();

    assetLoader.finished = function() {
        startGame();                                 // terminate the asset loader and start the game
    };

    /**
     * A vector object holding the current coordinates of an object andits direction in a 2d space
     * this "class" contains behaviour required to be a part of every moving object
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

    // advance the vectors position by dx, dy
    Vector.prototype.advance = function() {
        this.x += this.dx;
        this.y += this.dy;
    };
    
    /**
     * currently not used because there is no need in this program
     * basically divides the dx (aka the speed or change in x coordinate per frame) into multiple parts
     * and then checks whether at any point a collision happens
     * has only sense in situations where the speed is bigger than a dimension of a obstacle
     */ 
    Vector.prototype.iterativeCollisionOnX = function(anotherVec) {
        let slice = 1/anotherVec.dx;
        let delta;
        
        for(let percent=0; percent<=anotherVec.dx; percent += slice) {
            delta = anotherVec.x+percent;
            if(delta <= this.x+this.width && delta >= this.x) return true;
        }
        return false;
    };
    
    // if the y coordinate of this object is between the y coordinate of the upper and lower corner of the other, then they collide 
    Vector.prototype.collisionOnY = function(anotherVec) {
        return (this.y >= anotherVec.y && this.y <= anotherVec.y+anotherVec.height);
    };
    
    // if the right corner x coordinate of anotherVec is rigth to players' and at the same time left corner is on his/her right
    Vector.prototype.collisionOnX = function(anotherVec) {  // there is collision
        return (anotherVec.x <= this.x+this.width && anotherVec.x+anotherVec.width >= this.x);
    };

    /**
     * This function specifies the behaviour of an obstacle object
     * @param {integer} x - x coordinate
     * @param {integer} y - y coordinate
     */
    function Obstacle(x, y) {
        this.x      = x;
        this.dx     = -player.dx;   // this is the use of player.dx
        this.y      = y;
        this.width  = 209;
        this.height = 128;
        this.name   = "obs"+ getRandomInRange(1, OBSTACLES_AVAILABLE);

        Vector.call(this, x, y, 0, 0);

        this.update = function() {
            this.dx = -player.dx;
            this.advance();
        };
        
        this.draw = function() {
            let image = assetLoader.images[this.name];
            // ctx.drawImage(image, this.x, this.y, image.clientWidth/((canvas.height*(1/3))-this.height), (canvas.height*(1/3))-this.height); pretty sure this is the general expression, doesnt seem to work though
            ctx.drawImage(image, this.x, this.y, 209, 128);
        };
    };
    Obstacle.prototype = Object.create(Vector.prototype);
    
    function collisionDetection() {
        for(let obstacle of obstacles) {
            if(player.collisionOnX(obstacle) && player.collisionOnY(obstacle)) { 
                gameOver();
            }
        }
    };

    // This function updates the position of all obstacles currently present on the canvas, removes those which are behind the figure and adds new one in their place to the right of the canvas
    function updateObstacles() {
        for(let i=0; i<obstacles.length; i++) {
            obstacles[i].update();
            obstacles[i].draw();
        }

        // if an obstacle moved too far left remove it and put a new one before the player figure
        if(obstacles[0] && obstacles[0].x < -obstacles[0].width) {     // subtracting in the condition results in increasing the gap between two succeeding obstacles (-0 means they are right after each other)
            obstacles.splice(0,1);
            obstacles.push(new Obstacle(canvas.width, (canvas.height*(getRandomInRange(0, 2)/3))));
            score++;
        }
    };
    
    function resetObstacles() {
        obstacles = [];
    };
    
    function resetGround() {
        ground1 = [];
        ground2 = [];
        ground3 = [];
    };
    
    function resetSwipeInput() {
        SWIPES = "none";
    };
    
    function updateLines() {
        // drawing and updating three lines, note to self: move  to another function
        let grounds = [ground1, ground2, ground3];
        for(let ground of grounds) {
            for(let i=0; i<ground.length; i++) {
                let maxWidth = canvas.width + platDimension; // adding one to fill the gap
                ground[i].x = (ground[i].x - player.dx + maxWidth) % maxWidth - platDimension; // result is always shifted 
                ctx.drawImage(assetLoader.images.lineElement, ground[i].x, ground[i].y);
            }
        }
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
            draw:  this.draw,
            reset: this.reset
        };
    })();
    
    /**
     * This class contains all manipulations of HTML elements performed in this script
     */
    let manipulateHTML = (function() {
        this.manipulateAtStart = function() {
            document.getElementById('game-over').style.display = 'none';
            document.getElementById('currentScore').style.display = '';
        };
        this.manipulateScore = function() {
            document.getElementById('varScore').innerHTML = score;
        };
        this.manipulateAtEnd = function() {
            document.getElementById('currentScore').style.display = 'none';
            document.getElementById('game-over').style.display = 'block';
            document.getElementById('score').innerHTML = (+score+"!");
        };
        this.manipulateAtRestart = function() {
            document.getElementById('restart').addEventListener('click', startGame);
        };
        return {
            manipulateAtStart:   this.manipulateAtStart,
            manipulateScore:     this.manipulateScore,
            manipulateAtEnd:     this.manipulateAtEnd,
            manipulateAtRestart: this.manipulateAtRestart
        };
    })();

    /**
     * Start the game - reset all variables and entities, spawn platforms and water.
     */
    function startGame() {
        manipulateHTML.manipulateAtStart();
        stop = false;
        score = 0;
        accelerateThreshold = 10;
        
        resetGround();
        resetObstacles();
        //resetSwipeInput();
        player.reset();
        background.reset();
        
        for(let i=0; i<Math.floor(canvas.width / platDimension)+1; i++) {  // prepares the three lines and creates two right to the canvas edge to prevent another from 'bliping into
            ground1[i] = {"x": i * platDimension, "y": canvas.height-platDimension};        // existence inside the canvas creating a disturbing visual effect as they appear
            ground2[i] = {"x": i * platDimension, "y": canvas.height*(2/3)-platDimension};
            ground3[i] = {"x": i * platDimension, "y": canvas.height*(1/3)-platDimension};
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
            manipulateHTML.manipulateScore();
            
            mouseswipedetect();
            swipedetect();
            collisionDetection();
            
            if(score > accelerateThreshold) player.accelerate();
            player.update();
            player.draw();
        }
    };
    
    function gameOver() {
        stop = true;
        //processTouchEvents();
        manipulateHTML.manipulateAtEnd();
    };
    
    manipulateHTML.manipulateAtRestart();
    
    assetLoader.downloadAll();
})();