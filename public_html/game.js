            (function () {
    // define variables
    let canvas;
    let ctx;
    let player;
    var ground1;
    var platformWidth;
    var platformHeight;
  
    /**
     * Request Animation Polyfill
     */
    var requestAnimFrame;
 })();
    var assetLoader = (function() {
        // images dictionary
        this.images = {            
            "avatar_normal" : "images/gr.png",
            "avatar_alza" : "images/alza.jpg",
            "bg" : "images/bg.png",
            "lineElement" : "images/lineElement.png",
            "sky" : "images/sky.png"
        };
        var assetsLoaded = 0;                                // how many assets have been loaded
        var numImages      = Object.keys(this.images).length;    // total number of image assets
        this.totalAssets = numImages;                          // total number of assets
    /**
     * Ensure all assets are loaded before using them
     * @param {number} dic  - Dictionary name ('images')
     * @param {number} name - Asset name in the dictionary
     */
    function assetLoaded(dic, name) {
        // don't count assets that have already loaded
        if (this[dic][name].status !== "loading" ) {
            return;
        }
        this[dic][name].status = "loaded";
        assetsLoaded++;
        // finished callback
        if (assetsLoaded === this.totalAssets && typeof this.finished === "function") {
            this.finished();
        }
    }
      /**
       * Create assets, set callback for asset loading, set asset source
       */
    this.downloadAll = function() {
        var _this = this;
        var src;
        // load images
        for (var img in this.images) {
            if (this.images.hasOwnProperty(img)) {
                src = this.images[img];
                // create a closure for event binding
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
}
        
/**
 * Creates a Spritesheet
 * @param {string} - Path to the image.
 * @param {number} - Width (in px) of each frame.
 * @param {number} - Height (in px) of each frame.
 */
function SpriteSheet(path, frameWidth, frameHeight) {
    this.image = new Image();
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    // calculate the number of frames in a row after the image loads
    var self = this;
    this.image.onload = function() {
        self.framesPerRow = Math.floor(self.image.width / self.frameWidth);
    };
    this.image.src = path;
    console.log("in spritesheet function");
}
/**
 * Creates an animation from a spritesheet.
 * @param {SpriteSheet} - The spritesheet used to create the animation.
 * @param {number}      - Number of frames to wait for before transitioning the animation.
 * @param {array}       - Range or sequence of frame numbers for the animation.
 * @param {boolean}     - Repeat the animation once completed.
 */
function Animation(spritesheet, frameSpeed, startFrame, endFrame) {
  var animationSequence = [];  // array holding the order of the animation
  var currentFrame = 0;        // the current frame to draw
  var counter = 0;             // keep track of frame rate
  // start and end range for frames
  for (var frameNumber = startFrame; frameNumber <= endFrame; frameNumber++)
    animationSequence.push(frameNumber);
  /**
   * Update the animation
   */
  this.update = function() {
    // update to the next frame if it is time
    if (counter == (frameSpeed - 1))
      currentFrame = (currentFrame + 1) % animationSequence.length;
    // update the counter
    counter = (counter + 1) % frameSpeed;
  };
  /**
   * Draw the current frame
   * @param {integer} x - X position to draw
   * @param {integer} y - Y position to draw
   */
  this.draw = function(x, y) {
    // get the row and col of the frame
    ctx.drawImage(assetLoader.images.avatar_normal, x, y);
  };
}
  /**
 * Create a parallax background
 */
var background = (function() {
  var sky   = {};
  /**
   * Draw the backgrounds to the screen at different speeds
   */
  this.draw = function() {
    ctx.drawImage(assetLoader.images.bg, 0, 0);
    // Pan background
    sky.x -= sky.speed;
    // draw images side by side to loop
    ctx.drawImage(assetLoader.images.sky, sky.x, sky.y);
    ctx.drawImage(assetLoader.images.sky, sky.x + canvas.width, sky.y);
    // If the image scrolled off the screen, reset
    if (sky.x + assetLoader.images.sky.width <= 0)
      sky.x = 0;
  };
  /**
   * Reset background to zero
   */
  this.reset = function()  {
    sky.x = 0;
    sky.y = 0;
    sky.speed = 0.2;
  }
  return {
    draw: this.draw,
    reset: this.reset
  };
})();

/**
 * Start the game - reset all variables and entities, spawn platforms and water.
 */
function startGame() {
    
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");
    player = {};
    ground1 = [];
    ground2 = [];
    ground3 = [];
    platformWidth = 32;
    platformHeight = canvas.height - platformWidth * 4;
    requestAnimFrame = (function(){
        return  window.requestAnimationFrame       ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame    ||
                window.oRequestAnimationFrame      ||
                window.msRequestAnimationFrame     ||
                function(callback, element){
                  window.setTimeout(callback, 1000 / 60);
                };
    })();
  console.log("hello I am working");
  player.width  = 64;
  player.height = 64;
  player.speed  = 6;
  player.sheet  = new SpriteSheet("images/gr.png", player.width, player.height);
  player.anim   = new Animation(player.sheet, 4, 1, 1);
  for (i = 0, length = Math.floor(canvas.width / platformWidth) + 1; i < length; i++) {
    ground1[i] = {"x": i * platformWidth, "y": canvas.height-platformWidth};
    ground2[i] = {"x": i * platformWidth, "y": canvas.height*(2/3)-platformWidth};
    ground3[i] = {"x": i * platformWidth, "y": canvas.height*(1/3)-platformWidth};
  }
  background.reset();
  animate();
}
/**
 * Game loop
 */
function animate() {
  requestAnimFrame( animate );
  background.draw();
  for (i = 0; i < ground1.length; i++) {
    ground1[i].x -= player.speed;
    ground2[i].x -= player.speed;
    ground3[i].x -= player.speed;
    ctx.drawImage(assetLoader.images.lineElement, ground1[i].x, ground1[i].y);
    ctx.drawImage(assetLoader.images.lineElement, ground2[i].x, ground2[i].y);
    ctx.drawImage(assetLoader.images.lineElement, ground3[i].x, ground3[i].y);
  }
  if (ground1[0].x <= -platformWidth) {
    ground1.shift();
    ground1.push({"x": ground1[ground1.length-1].x + platformWidth, "y": canvas.height-platformWidth});
  }
  if (ground2[0].x <= -platformWidth) {
    ground2.shift();
    ground2.push({"x": ground2[ground2.length-1].x + platformWidth, "y": canvas.height*(2/3)-platformWidth});
  }
  if (ground3[0].x <= -platformWidth) {
    ground3.shift();
    ground3.push({"x": ground3[ground3.length-1].x + platformWidth, "y": canvas.height*(1/3)-platformWidth});
  }
  player.anim.update();
  player.anim.draw(64, canvas.height-platformWidth*3);
}
assetLoader.downloadAll();