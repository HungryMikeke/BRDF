/**
 * A Simple Timer Class 
 */

var Timer = function() {
    /**
     * Passed time in seconds since the start of this timer
     * @type {number}
     */
    this.time = 0.0;
    /**
     * Number of total rendered frames
     * @type {number}
     */    
    this.frameCount = 0;
    /**
     * Number of frames to use for frame rate measurement
     * @type {number}
     */    
    this.frameWindowSize = 5;
    /**
     * Frame rate in frames per second
     * @type {number}
     */    
    this.fps = 0.0;
    /**
     * Start time in seconds at the creation of this object
     * @type {number}
     */    
    this.startTime = 0.0;
    /**
     * Start time of a new frame window for frame rate measurement
     * @type {number}
     */    
    this.frameWindowTime = this.startTime;
};
  
Timer.prototype.start = function() {

	this.time = 0.0;
	this.frameCount = 0;
	this.fps = 0.0;

	this.startTime = (new Date).getTime();
	this.frameWindowTime = this.startTime;
}

Timer.prototype.stop = function() {
	;	
}

Timer.prototype.nextFrame = function() {
	
	var now = (new Date).getTime();
	
	this.time = (now - this.startTime) / 1000.0;
	this.frameCount++;

	if (this.frameCount % this.frameWindowSize === 0) {
		var seconds = (now - this.frameWindowTime) / 1000.0;
		this.fps = Math.round(this.frameWindowSize / seconds);
		this.frameWindowTime = now;
	}
};

