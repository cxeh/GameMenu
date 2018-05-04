(function () {      // establishing a separate namespace, prohibiting access from the console
    // getting access to the canvas and its drawing context
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    // introducing global game variables
    let stop;                           // false on default, turns true when the player hits an obstacle, stops animations
    let score;                          // variable keeping track of score
    let accelerateThreshold;            // variable setting the first point where the game begins to speed up

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
            if((/*KEY_STATUS.w || KEY_STATUS.up || */currentMoveDirection === "up") && this.y > 128 && switchCounter === 0) { // second condition prohibits the player from going up in the uppermost lane             
                this.y -= canvas.height/3;   // actually moves the player by changing the y coordinate
                switchCounter = 16;          // the higher the number, the longer the delay before being able to change the line again
                currentMoveDirection = "none";
            } else if((/*KEY_STATUS.s || KEY_STATUS.down || */currentMoveDirection === "down") && this.y < 320 && switchCounter === 0) {
                this.y += canvas.height/3;   // same thing, just moves the player downwards
                switchCounter = 16;
                currentMoveDirection = "none";
            }
            switchCounter = Math.max(switchCounter-1, 0);   // decreases the switchCounter delay
        };

        return player;
    })(Object.create(Vector.prototype));

    let currentMoveDirection = "none";
    
    /**
     * This section handles user inpout and lets the player control the figure using keyboard
     */    
    let keyboardInput = function() {
        function setDirection(direction) {
            currentMoveDirection = direction;
        };
        
        document.onkeydown = function(e) {
            let keyPressed = e.key;
            switch(keyPressed) {
                case "ArrowUp":
                    setDirection('up');
                    break;
                case "w":
                    setDirection('up');
                    break;
                case "ArrowDown":
                    setDirection('down');
                    break;
                case "s":
                    setDirection('down');
                    break;
                default:
                    setDirection('none');
            }
            e.preventDefault();
        };
        
        document.onkeyup = function(e) {
            setDirection('none');
            e.preventDefault();
        };
    };
    
    function mouseSwipeInput() {  
        let swipeDirection;                         // will be used to store the direction of ongoing swipe
        let startY;                                 // starting y coordinate of the swipe
        let distY;                                  // starting x coordinate of the swipe
        let threshold = 50;                         // required min distance traveled to be considered swipe
        let allowedTime = 300;                      // maximum time allowed to travel that distance
        let elapsedTime;                            // this variable measures how much time has between a mousedown and a mouseup event
        let startTime;                              // this variable stores the time passed since mousedown event
        let isMouseDown = false;

        function setMoveDirection(swipeDirection) {            
            currentMoveDirection = swipeDirection;
        };

        canvas.addEventListener('mousedown', function(e){
            swipeDirection = 'none';
            startY = e.pageY;
            startTime = new Date().getTime();       // record time when finger first makes contact with surface
            isMouseDown = true;
            e.preventDefault();
            e.stopPropagation();
        });

        canvas.addEventListener('mousemove', function(e){
            e.preventDefault();                     // prevent scrolling
            e.stopPropagation();
        });

        canvas.addEventListener('mouseup', function(e){
            if(isMouseDown) {
                distY = e.pageY - startY;           // get vertical dist traveled by finger while in contact with surface
                elapsedTime = new Date().getTime() - startTime;  // get time elapsed
                if(elapsedTime <= allowedTime) {    // first condition for awipe met
                    if(Math.abs(distY) >= threshold){            // 2nd condition for vertical swipe met
                        swipeDirection = (distY < 0) ? 'up' : 'down';  // if dist traveled is negative, it indicates up swipe
                    }
                }
                isMouseDown = false;                
                setMoveDirection(swipeDirection);
                e.preventDefault();
                e.stopPropagation();
            };
        });
    };
    
    function touchSwipeInput() {  
        let swipeDirection;
        let startY;
        let distY;
        let threshold = 50;                             //required min distance traveled to be considered swipe
        let allowedTime = 300;                          // maximum time allowed to travel that distance
        let elapsedTime;
        let startTime;
        let isMouseDown = false;

        function setMoveDirection(swipeDirection) {
            currentMoveDirection = swipeDirection;
        };

        canvas.addEventListener('touchstart', function(e){
            swipeDirection = 'none';
            startY = e.changedTouches[0].pageY;
            startTime = new Date().getTime(); // record time when finger first makes contact with surface
            isMouseDown = true;
            e.preventDefault();
        });

        canvas.addEventListener('touchmove', function(e){
            e.preventDefault(); // prevent scrolling when inside DIV;
        });

        canvas.addEventListener('touchend', function(e){
            if(isMouseDown) {
                distY = e.changedTouches[0].pageY - startY; // get vertical dist traveled by finger while in contact with surface
                elapsedTime = new Date().getTime() - startTime; // get time elapsed
                if(elapsedTime <= allowedTime) { // first condition for awipe met
                    if (Math.abs(distY) >= threshold){ // 2nd condition for vertical swipe met
                        swipeDirection = (distY < 0)? 'up' : 'down'; // if dist traveled is negative, it indicates up swipe
                    }
                };
                isMouseDown = false;
                setMoveDirection(swipeDirection);
                e.preventDefault();
            }
        });
    };

    /**
     * This feature takes care of ensuring that all images will be loaded by the start of the game
     */
    let assetLoader = (function() {
        this.images = {                                         // property holding all images
            "avatar_normal" : "images/gr.png",                  // an alias and the path to the image
            "bg"            : "images/bg.png",
            "lineElement"   : "images/lineElement.jpg",
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
     * @param {vector} anotherVec - another object possessing a "speed" and a position on canvas
     */ 
    Vector.prototype.iterativeCollisionOnX = function(anotherVec) {                     // Also this feature hasnt been tested for some time so it might not even work
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
        this.dx     = -player.dx;           // this is the use of player.dx
        this.y      = y;
        this.width  = 209;                  // I am currently using fixed size since I had trouble with writing a general expression
        this.height = 128;                  // @see line 326
        const OBSTACLES_AVAILABLE = 4;      // constant holding the number of images serving as obstacles, if there are more images added, raise the number by corresponding amount
        this.name   = "obs"+ getRandomInRange(1, OBSTACLES_AVAILABLE);

        Vector.call(this, x, y, 0, 0);

        this.update = function() {
            this.dx = -player.dx;                                                   // in case the player has accelerated speed up the obstacles too
            this.advance();                                                         // advances the position of the obstacle
        };
        
        this.draw = function() {
            let image = assetLoader.images[this.name];
            // ctx.drawImage(image, this.x, this.y, image.clientWidth/((canvas.height*(1/3))-this.height), (canvas.height*(1/3))-this.height); pretty sure this is the general expression, doesnt seem to work though
            ctx.drawImage(image, this.x, this.y, 209, 128);
        };
    };
    Obstacle.prototype = Object.create(Vector.prototype);                           // makes functions from vector.prototype available to obstacles
    
    function collisionDetection(obstacles) {
        for(let obstacle of obstacles) {                                            // iterates through all obstacles currently present in the game
            if(player.collisionOnX(obstacle) && player.collisionOnY(obstacle)) {    // if there is a collision with a single obstacle on both axis them the player has collided with that obstacle
                gameOver();                                                         // so he/she loses
            }
        }
    };

    /**
     * operation related to obstacles is contained in this module
     */
    let manageObstacles = (function() {
        let obstacles = [];                 // array incorporating all obstacles present at a given point in time
        // this function updates the position of all obstacles currently present on the canvas, removes those which are behind the figure and adds new one in their place to the right of the canvas
        this.updateObstacles = function() {
            for(let i=0; i<obstacles.length; i++) {     // updates and draws all obstacles currently present on the canvas using methods defined in the obstacle class
                obstacles[i].update();
                obstacles[i].draw();
            }
            // if an obstacle moved too far left remove it and put a new one before the player figure
            if(obstacles[0] && obstacles[0].x < -obstacles[0].width) {     // subtracting in the condition results in increasing the gap between two succeeding obstacles (-0 means they are right after each other)
                obstacles.splice(0,1);                                     // delete the leftmost obstacle in the array
                obstacles.push(new Obstacle(canvas.width, (canvas.height*(getRandomInRange(0, 2)/3)))); // and create a new one on the right side
                score++;                                                   // when an obstacle is removed, increment the score by one
            }
        };
        this.resetObstacles = function() {
            obstacles = [];                                                // empties all obstacles in the array
        };
        this.prepareObstacles = function() {
            for(let i=0; i<2; i++) {    // prepares two obstacles in advance and also sets it up in a way that there always will be two obstacles on the screen
                obstacles.push(new Obstacle(i*(canvas.width)+2*canvas.width, (canvas.height*(getRandomInRange(0, 2)/3))));  // +2*canvas.width creates a beginning without any obstacles
            }
        };
        this.getObstacles = function() {                                   // a getter for the obstacles array for the purposes of the collisionDetecton
            return obstacles;
        };
        return {                                                           // makes code from this module accessible to code outside ofit
            updateObstacles: this.updateObstacles,
            resetObstacles: this.resetObstacles,
            prepareObstacles: this.prepareObstacles,
            getObstacles: this.getObstacles
        };
    })();

    /**
     * this IIFE contains line-related behaviour of the game
     */
    let manageLines = (function() {
        let ground1 = [];                                               // array containing images forming the lowest line
        let ground2 = [];                                               // array containing images forming the middle line
        let ground3 = [];                                               // array containing images forming the uppermost line
        const PLAT_DIMENSION = 32;                                      // constant holding dimensions of a square line element image in pixels 
        this.updateLines = function() {                                 // updates the x, y position of individual line elements
            let grounds = [ground1, ground2, ground3];                  // creates a 2D array matrix of the different lines
            for(let ground of grounds) {                                // goes through all lines contained in the grounds matrix
                for(let i=0; i<ground.length; i++) {                    // iterates through all objects in a single 1D array
                    let maxWidth = canvas.width + PLAT_DIMENSION;       // combined width of all line elements of one row together, adding one to fill the gap on the edges of the screen
                    ground[i].x = (ground[i].x - player.dx + maxWidth) % maxWidth - PLAT_DIMENSION;     // shifts all elements by player.dx to the left. If they are too far, put them to the far right
                    ctx.drawImage(assetLoader.images.lineElement, ground[i].x, ground[i].y);            // actually draws the line element at the coordinates computed in the preceding step on the screen
                }
            }
        };
        this.resetLines = function() {                                  // sets all ground arrays empty. Restarts the lines
            ground1 = [];
            ground2 = [];
            ground3 = [];
        };
        this.prepareLines = function() {                                                          // gives all line elements their default values
            for(let i=0; i<Math.floor(canvas.width / PLAT_DIMENSION)+1; i++) {                    // prepares the three lines and creates two right to the canvas edge to prevent another from 'blipping into
                ground1[i] = {"x": i * PLAT_DIMENSION, "y": canvas.height-PLAT_DIMENSION};        // existence' inside the canvas creating a disturbing visual effect as they appear. And this line sets up the bottommost line
                ground2[i] = {"x": i * PLAT_DIMENSION, "y": canvas.height*(2/3)-PLAT_DIMENSION};  // middle line
                ground3[i] = {"x": i * PLAT_DIMENSION, "y": canvas.height*(1/3)-PLAT_DIMENSION};  // uppermost line
            }
        };
        return {                                                        // makes the contents of this module accessible to outside code
            updateLines  :  this.updateLines,
            resetLines   :  this.resetLines,
            prepareLines :  this.prepareLines
        };
    })();

    
    /**
     * creates a parallax background, supplies behaviour affecting background images
     */
    let manageBackground = (function() {
        let sky   = {};                                 // creates an object which will possess attributes of background
        this.updateBackground = function() {            // updates the position of the background and repaints it at the new coordinates
            ctx.drawImage(assetLoader.images.bg, 0, 0); // very important, painted over the entire canvas, hides everything drawn in previous animation frame
            sky.x -= sky.speed;                         // updates the speed of sky
            ctx.drawImage(assetLoader.images.sky, sky.x, sky.y);                    // draws one set of clouds
            ctx.drawImage(assetLoader.images.sky, sky.x + canvas.width, sky.y);     // draws another set of clouds right to the previous one       
            if( sky.x + assetLoader.images.sky.width <= 0) {        // if the image scrolled off the screen, reset its x coordinate
                sky.x = 0;                                          // together with 3 previous lines makes the moving clouds look endless
            }
        };        
        this.resetBackground = function()  {            // reset background, set x and y coordinates to default value (0) as well as speed
            sky.x = 0;
            sky.y = 0;
            sky.speed = 0.2;
        };
        return {                                        // makes the methods defined in this module accessible to the outside code environment
            updateBackground :  this.updateBackground,
            resetBackground  :  this.resetBackground
        };
    })();
    
    /**
     * This class contains all manipulations of HTML elements performed in this script
     */
    let manipulateHTML = (function() {
        this.manipulateAtStart = function() {           // displays the score counter and hides the game over screen
            document.getElementById('game-over').style.display = 'none';
            document.getElementById('currentScore').style.display = '';
        };
        this.manipulateScore = function() {             // updates the score counter to display the current score value
            document.getElementById('varScore').innerHTML = score;
        };
        this.manipulateAtEnd = function() {             // displays the game over screen and makes score counter vanish
            document.getElementById('currentScore').style.display = 'none';
            document.getElementById('game-over').style.display = 'block';
            document.getElementById('score').innerHTML = (+score+"!");
        };
        this.manipulateAtRestart = function() {         // makes the try again button able to restart the game
            document.getElementById('restart').addEventListener('click', startGame); 
        };
        return {                                        // makes the functions included in this module accessible to outside code
            manipulateAtStart   :   this.manipulateAtStart,
            manipulateScore     :   this.manipulateScore,
            manipulateAtEnd     :   this.manipulateAtEnd,
            manipulateAtRestart :   this.manipulateAtRestart
        };
    })();

    /**
     * Start the game - reset all variables and entities, spawn platforms and water.
     */
    function startGame() {
        manipulateHTML.manipulateAtStart();     // disappears the game over screen, shows the score counter
        
        score = 0;                              // resets score because to be able to accumulate score across multiple runs would be cheating
        stop = false;                           // assigns the boolean value false to stop variable so that the animation loop can run again
        accelerateThreshold = 10;               // sets the threshold to the default value of 10
        
        player.reset();                         // puts player at the starting position, sets his/her speed to default (currently 8)
        manageBackground.resetBackground();     // resets background. Simple
        manageLines.resetLines();               // sets all three ground arrays to be empty (I dont think it is really needed, but I prefer to reset everything when a new game starts just to be sure)
        manageObstacles.resetObstacles();       // sets the obstacles array to empty, therefore makes it ready to be refilled by manageObstacles.prepareObstacles
        
        manageLines.prepareLines();             // spawns the lineElements which together create a line
        manageObstacles.prepareObstacles();     // spawns the first two obstacles in the game
        
        animate();                              // initiates animations, basically starts the game itself
    };

    /**
     * Main loop, takes care of updating the game at each frame
     */
    function animate() {
        if(!stop) {
            requestAnimFrame(animate);          // sets up animation loop
            manageBackground.updateBackground();// updates the background
            manageObstacles.updateObstacles();  // moves obstacles by -player.dx and redraws them at the new location
            manageLines.updateLines();          // updates the position of the line elements
            manipulateHTML.manipulateScore();   // updates score counter element to reflect current score value
            
            keyboardInput();                    // accepts keyboard input
            mouseSwipeInput();                  // accepts mouse input using swipes
            touchSwipeInput();                  // accepts touch input from touchscreens
            collisionDetection(manageObstacles.getObstacles());     // gets the current state of obstacles and then checks whether the player has collided with one
            
            if(score > accelerateThreshold) player.accelerate();    // if the player has reached a sufficient score threshold, this expression will speed up the pace of the game
            player.update();                    // updates the postion of the player based on the player input
            player.draw();                      // redraws the player character at current coordinates obtained from player.update
        }
    };
    
    function gameOver() {                       // called only when the game is lost
        stop = true;                            // stops the animation loop
        manipulateHTML.manipulateAtEnd();       // removes score counter and displays a screen containing the achieved score and a game over message
    };
    
    manipulateHTML.manipulateAtRestart();       // adds a try again and connects an event listener listening for a click on it which then causes the game to restart
    
    assetLoader.downloadAll();                  // does what it says. Downloads stuff
})();                                           // matches the IIFE declaration from line 1. We dont want anybody calling some functions from browser console