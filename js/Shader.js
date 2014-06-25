/**
 * Loads a shader resource asynchronously 
 * @param {string} fileName Relative URL to file
 * @param {function(string, Effect)} callback Callback that is invoked as soon
 * as the shader has been loaded. The first argument is the URL and the
 * second argument is the created Effect instance.
 */

var Shader = function(webGLContext, vertShaderSource, fragShaderSource) {

	this.programID = 0;
	this.vertShaderID = 0;
	this.fragShaderID = 0;

	this.vertShaderSource = vertShaderSource;
	this.fragShaderSource = fragShaderSource;

	this.gl = webGLContext;
};

Shader.prototype.getGLProgramID = function() {

	return this.programID;
};

Shader.prototype.compileAndLink = function() {
	
	// Create a Program
	this.programID = this.gl.createProgram();

	this.vertShaderID = this.loadAndCompileShaderSource('VERTEX_SHADER', this.vertShaderSource);
	this.fragShaderID = this.loadAndCompileShaderSource('FRAGMENT_SHADER', this.fragShaderSource);

	if (this.programID === 0 || this.vertShaderID === 0 || this.fragShaderID === 0) {
		console.log('Could not Compile and Link the Shader Program.');
		this.cleanUp();
		
		return false;
	}

	// Attach the Shader
	this.gl.attachShader(this.programID, this.vertShaderID);
	this.gl.attachShader(this.programID, this.fragShaderID);

	// Link the program
	if (this.linkProgram() === false) {
		console.log('Could not Compile and Link the Shader Program.');
		this.cleanUp();
		
		return false;
	}

	return true;
};

Shader.prototype.cleanUp = function() {
	
	if (this.vertShaderID) {
		this.gl.deleteShader(this.vertShaderID);
		this.vertShaderID = 0;
	}

	if (this.fragShaderID) {
		this.gl.deleteShader(this.fragShaderID);
		this.fragShaderID = 0;
	}

	if (this.programID) {
		this.gl.deleteProgram(this.programID);
		this.programID = 0;
	}
};

Shader.prototype.loadAndCompileShaderSource = function(shaderType, source) {

	// Create a Shader
	var shader = this.gl.createShader(this.gl[shaderType]);
	
	// Specify the source for the shader && Compile the shader
	this.gl.shaderSource(shader, source);
	this.gl.compileShader(shader);

	var success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS) === true && this.gl.getError() === this.gl.NO_ERROR;
	if (success) {
		// console.log('Successfully Compile Shader ' + fileName + ' (' + shaderType + ').');
		console.log('Successfully Compile the Shader (' + shaderType + ').');
	} else {
		// console.log('Could not Compile Shader (' + shaderType + ') ' + fileName + ':\n' + this.gl.getShaderInfoLog(shader));
		console.log('Could not Compile the Shader (' + shaderType + ') :\n' + this.gl.getShaderInfoLog(shader));
	}

	return shader;
};

Shader.prototype.linkProgram = function() {
	
	// Link Program
	this.gl.linkProgram(this.programID);
	this.gl.validateProgram(this.programID);

	if (this.gl.getError() === this.gl.NO_ERROR) {
		// console.log('Successfully Link Shader Program ' + fileName + '.');
		console.log('Successfully Link the Shader Program.');
		return true;
	} else {
		var infoLog = this.gl.getProgramInfoLog(program);
		// console.log('Could not Link Shader Program ' + fileName + ':\n' + infoLog);
		console.log('Could not Link the Shader Program:\n' + infoLog);
		return false;
	}
};

