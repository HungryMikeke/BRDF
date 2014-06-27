/**
 * - JavaScript Code for Rendering BRDF
 *
 * - 1. Simple mechanism for loading new resources at run time
 * - 2. Loading resources from strings or DOM elements
 * - 3. Add support for cube maps
 */
 
require.config({

	baseUrl:		'js',
	paths: {
		jquery:		'lib/jquery-1.11.0',
		glmatrix:	'lib/gl-matrix-1.3.1',
		modernizr:	'lib/modernizr-2.7.2',
		model:		'Model',
		shader:		'Shader',
		timer:		'Timer',
	}
});

require(["jquery", "glmatrix", "model", "shader", "timer", "modernizr"], function($, glmatrix, glmodel)
{
	var mat4 = glmatrix.mat4;
	var vec3 = glmatrix.vec3;

	// 全局变量
	var g_WebGLContext;									// WebGL 上下文环境
	var g_Shader;										// 着色器对象
	var g_Model;										// 模型对象
	
	var g_Timer;										// 计时器

	// 全局参数
	var g_CanvasAspectRatio = 1.0;
	var g_AnimationKey = 0.0;

	var g_Exposure = 10.0;

	// Uniform Locations 4 Shader
	var g_ProjectionMatUniformLocation;
	var g_CameraViewMatUniformLocation;
	var g_CameraPosVecUniformLocation;
	var g_ModelMatUniformLocation;

	var g_LightDirVecUniformLocation;

	var g_DiffuseColorVecUniformLocation;
	var g_SpecularIntensityUniformLocation;
	var g_ExposureUniformLocation;
	
	var g_TextureWidthUniformLocation;
	var g_TextureHeightUniformLocation;
	var g_SegThetaUniformLocation;

	var g_BRDFMapUniformLocation;

	// Attribute Locations 4 Shader
	var g_PositionAttribLocation;
	var g_NormalAttribLocation;
	var g_TexCoordAttribLocation;
	var g_TangentAttribLocation;

	// VBOs Index
	var g_VertexBufferObject = 0;
	var g_IndexBufferObject = 0;
	
	var g_TriangleBufferObject = 0;

	// Texture Object ID
	var g_Texture0_ID;

	/**
	 * Adjusts the width and height of the viewport to the
	 * dimensions of the current WebGL canvas.
	 */
	var reshapeViewport = function(gl, canvas) {
		
		if (!gl) {
			return;
		}
		
		/*
		if (canvas.oldwidth == canvas.width && canvas.oldheight == canvas.height) {
			return;
		}
		
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;
		canvas.oldwidth = canvas.clientWidth;
		canvas.oldheight = canvas.clientHeight;
		*/

		gl.viewportWidth = canvas.width;
        gl.viewportHeight = canvas.height;

		// Set the Viewport
		// gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight);
		// gl.viewport(0, 0, canvas.width, canvas.height);
	};

	/**
	 * Schedules a new animation frame. 
	 * The specified callback function is called as soon as the
	 * next frame is due.
	 * @param {function} callback
	 */
	var requestAnimFrame = (function() {
		
		return	window.requestAnimationFrame || 
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function(callback, element) {
					 window.setTimeout(callback, 1000.0 / 60.0);
				};
	})();

	// ------------
	//  初始化函数
	// ------------

	var initWebGLContext = function(canvasID) {
		
		var webGLContext;
		
		var canvas = document.getElementById(canvasID);
		if (undefined !== canvas) 
		{
			webGLContext = canvas.getContext("experimental-webgl");
			
			webGLContext.enable(webGLContext.DEPTH_TEST);
			webGLContext.enable(webGLContext.CULL_FACE);
			webGLContext.cullFace(webGLContext.BACK);

			webGLContext.clearColor(0.0, 0.0, 0.0, 0.0);
			webGLContext.clearDepth(1.0);
		}

		return webGLContext;	
	};

	var initModel = function(fileName, callback) {
		
		var onGetJSONFileDone = function(data) {
			
			// 初始化 Model
			var model = new glmodel.Model(g_WebGLContext);
			model.load(data);

			console.log('InitModel SUCCESS.');

			callback(model);
		};

		// 载入 JSON 模型文件
		$.getJSON(fileName, onGetJSONFileDone);	
	};

	var initShader = function(vertShaderFilename, fragShaderFilename, callback) {

		// 变量用于保存 Shader 代码
		var vertShaderSource;
		var fragShaderSource;

		// 回调函数（读取文件）
		var onGetVertShaderSource = function(source) {
			vertShaderSource = source;
			$.get(fragShaderFilename, onGetFragShaderSource, 'text');	
		};

		var onGetFragShaderSource = function(source) {
			fragShaderSource = source;
		
			// 初始化 Shader
			var shader = new Shader(g_WebGLContext, vertShaderSource, fragShaderSource);
			
			// 编译链接 Shader
			var flag = shader.compileAndLink();
			if (false === flag) {
				console.log('Could not initialize Shader.');
				callback(flag, undefined);
			} else {
				callback(flag, shader);
			}
		};

		// 开始载入 Shader 文件
		$.get(vertShaderFilename, onGetVertShaderSource, 'text');
	};
	
	var initScene = function(gl) {

		// Shader Program ID
		var program = g_Shader.getGLProgramID();
		gl.useProgram(program);

		// Init Light Direction Slot
		g_LightDirVecUniformLocation = gl.getUniformLocation(program, 'vLightDir');

		// Init Model Transform & Camera View & Projection Matrix Slots
		g_ProjectionMatUniformLocation = gl.getUniformLocation(program, 'mProjection');
		g_CameraViewMatUniformLocation = gl.getUniformLocation(program, 'mCameraView');
		g_CameraPosVecUniformLocation = gl.getUniformLocation(program, 'vCameraPos');
		g_ModelMatUniformLocation = gl.getUniformLocation(program, 'mModelTrans');
		
		g_CanvasAspectRatio = gl.viewportWidth / gl.viewportHeight;

		var projectionMatrix = mat4.perspective(45.0, g_CanvasAspectRatio, 0.1, 100.0);
		var cameraViewMatrix = mat4.lookAt([0.0, 0.0, 2.8], [0.0, 0.0, 0.0], [0.0, 1.0, 0.0]);
		var cameraPosVec = vec3.create([0.0, 0.0, 2.8]);

		gl.uniformMatrix4fv(g_ProjectionMatUniformLocation, false, projectionMatrix);
		gl.uniformMatrix4fv(g_CameraViewMatUniformLocation, false, cameraViewMatrix);
		gl.uniform3fv(g_CameraPosVecUniformLocation, cameraPosVec);
		
		// Init Light Argument Slots
		g_DiffuseColorVecUniformLocation = gl.getUniformLocation(program, 'vDiffuseColor');
		g_SpecularIntensityUniformLocation = gl.getUniformLocation(program, 'fSpecularIntensity');
		g_ExposureUniformLocation = gl.getUniformLocation(program, 'fExposure');

		gl.uniform3fv(g_DiffuseColorVecUniformLocation, vec3.create([0.0, 0.0, 0.0]));
		gl.uniform1f(g_SpecularIntensityUniformLocation, 1.0);
		gl.uniform1f(g_ExposureUniformLocation, g_Exposure);

		// Init Texture Slots
		g_TextureWidthUniformLocation = gl.getUniformLocation(program, 'fTextureWidth');
		g_TextureHeightUniformLocation = gl.getUniformLocation(program, 'fTextureHeight');
		g_SegThetaUniformLocation = gl.getUniformLocation(program, 'SegTheta');
		
		// Init Texture Sampler
		g_BRDFMapUniformLocation = gl.getUniformLocation(program, 'BRDFMap');

		var segTheta = 32.0;

		gl.uniform1f(g_TextureWidthUniformLocation, segTheta * 4.0);
		gl.uniform1f(g_TextureHeightUniformLocation, segTheta * segTheta);
		gl.uniform1f(g_SegThetaUniformLocation, segTheta);

		// Init Array Slots
		g_PositionAttribLocation = gl.getAttribLocation(program, 'vPosAttrib');
		g_NormalAttribLocation = gl.getAttribLocation(program, 'vNormalAttrib');
		g_TexCoordAttribLocation = gl.getAttribLocation(program, 'vTexCoordAttrib');
		g_TangentAttribLocation = gl.getAttribLocation(program, 'vTangentAttrib');

		// Init VBO & IBO
		g_VertexBufferObject = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, g_VertexBufferObject);
		gl.bufferData(gl.ARRAY_BUFFER, g_Model.meshes[0].vertices, gl.STATIC_DRAW);
		
		g_IndexBufferObject = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_IndexBufferObject);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g_Model.meshes[0].indices, gl.STATIC_DRAW);

		/*
		g_TriangleBufferObject = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, g_TriangleBufferObject);

		var vertices = [
             0.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
             1.0, -1.0,  0.0
        ];
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		*/
	};
	
	var initImage = function(gl, fileName, callback) {
		
		var image = new Image();
		
		image.onload = function() {
			
			var textureID = gl.createTexture();
			
			gl.bindTexture(gl.TEXTURE_2D, textureID);
			gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
			
			/*
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
			*/

			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);       

			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			// gl.generateMipmap(gl.TEXTURE_2D);
			
			gl.bindTexture(gl.TEXTURE_2D, null);
			
			callback(fileName, textureID);
		};

		image.src = fileName;
	};

	// ------------------
	//  Render the Scene
	// ------------------

	var draw = function() {
	
		console.log('Draw');
			
		// Use Program
		g_WebGLContext.useProgram(g_Shader.getGLProgramID());
		
		// Clear the Buffer
		g_WebGLContext.clear(g_WebGLContext.COLOR_BUFFER_BIT | g_WebGLContext.DEPTH_BUFFER_BIT);
		
		// Set the Viewport
		g_WebGLContext.viewport(0, 0, g_WebGLContext.viewportWidth, g_WebGLContext.viewportHeight);

		// Projection Matrix
		g_CanvasAspectRatio = g_WebGLContext.viewportWidth / g_WebGLContext.viewportHeight;
		console.log("<g_CanvasAspectRatio, glViewportWidth, glViewportHeight> = <%f, %f, %f>", g_CanvasAspectRatio, g_WebGLContext.viewportWidth, g_WebGLContext.viewportHeight);

		var projectionMatrix = mat4.perspective(45.0, g_CanvasAspectRatio, 0.1, 100.0);
		g_WebGLContext.uniformMatrix4fv(g_ProjectionMatUniformLocation, false, projectionMatrix);

		// Send Light Direction Vector 2 GPU
		var lightDirVec = vec3.create([0, 0, 1]);
		mat4.multiplyVec3(mat4.rotateX(mat4.identity(), Math.sin(g_AnimationKey * Math.PI * 8.0) * Math.PI * 0.5), lightDirVec);
		g_WebGLContext.uniform3fv(g_LightDirVecUniformLocation, lightDirVec);

		// Send Object Transform Matrix 2 GPU
		var objectTransMatrix = mat4.rotateY(mat4.identity(), g_AnimationKey * Math.PI * 2.0);
		g_WebGLContext.uniformMatrix4fv(g_ModelMatUniformLocation, false, objectTransMatrix);

		// Active the Current Texture
		g_WebGLContext.activeTexture(g_WebGLContext.TEXTURE0);
		g_WebGLContext.bindTexture(g_WebGLContext.TEXTURE_2D, g_Texture0_ID);
		g_WebGLContext.uniform1i(g_BRDFMapUniformLocation, 0);

		// Active the VBO & IBO
		g_WebGLContext.bindBuffer(g_WebGLContext.ARRAY_BUFFER, g_VertexBufferObject);
		g_WebGLContext.bindBuffer(g_WebGLContext.ELEMENT_ARRAY_BUFFER, g_IndexBufferObject); 
    	
		// Disable Unused Attribute Slots
		var count = g_WebGLContext.getParameter(g_WebGLContext.MAX_VERTEX_ATTRIBS);
		for (var i = 0; i < count; ++i) {
			g_WebGLContext.disableVertexAttribArray(i);
		}
	
		// Triangle For Debugging
		/*
		g_WebGLContext.bindBuffer(g_WebGLContext.ARRAY_BUFFER, g_TriangleBufferObject);

		g_WebGLContext.enableVertexAttribArray(0);
		g_WebGLContext.vertexAttribPointer(0, 3, g_WebGLContext.FLOAT, false, 0, 0); 

		g_WebGLContext.drawArrays(g_WebGLContext.TRIANGLES, 0, 3);
		*/

		// Assign Portions of the Vertex Buffer to Attribute Index
		var attrs = g_Model.meshes[0].vertexFormat.attributes;
		for (var j = 0; j < attrs.length; ++j) 
		{
			var loc;

			// Search vertex format declaration for a fitting vertex attribute:  
			if (attrs[j].role === 'p') {
				loc = g_PositionAttribLocation;
			} else if (attrs[j].role === 'n') {
				loc = g_NormalAttribLocation;
			} else if (attrs[j].role === 't') {
				loc = g_TexCoordAttribLocation;
			} else if (attrs[j].role === 'tg') {
				loc = g_TangentAttribLocation;
			}

			if (loc >= 0) 
			{
				// Enable & Set Pointer of Vertex Attrib Arrays
				g_WebGLContext.enableVertexAttribArray(loc);
				g_WebGLContext.vertexAttribPointer(loc, attrs[j].size, g_WebGLContext.FLOAT, false, attrs[j].stride, attrs[j].offset); 
			}
		}

		if (g_IndexBufferObject) {
			g_WebGLContext.drawElements(g_Model.meshes[0].primitive, g_Model.meshes[0].indexCount, g_WebGLContext.UNSIGNED_SHORT, 0);
		} else {
			g_WebGLContext.drawArrays(g_Model.meshes[0].primitive, 0, g_Model.meshes[0].indexCount);
		}
	};

	// ----------
	//  CallBack
	// ----------

	var onLoadModelFile = function(model) {
		
		g_Model = model;

		// 开始载入 Shader 文件
		initShader('../res/shader/brdf.vert', '../res/shader/brdf.frag', onLoadShader);
	};

	var onLoadShader = function(result, shader) {
				
		g_Shader = shader;
		
		console.log('InitShader SUCCESS.');

		// 初始化场景
		initScene(g_WebGLContext);
		console.log('InitScene SUCCESS.');
		
		// 初始化纹理
		initImage(g_WebGLContext, '../res/material/alum-bronze_rgbe.png', onLoadImageFile);
	
		// 渲染	
		var loopFunc = function() {
		
			$('#frameRateStats').html(g_Timer.fps + ' FPS');

			g_AnimationKey = (g_Timer.time % 12.0 / 12.0);

			reshapeViewport(g_WebGLContext, document.getElementById("webGLCanvas"));
			draw();
	
			g_Timer.nextFrame();

			requestAnimFrame(loopFunc);
		};
		
		// 开启计时器
		g_Timer = new Timer();
		g_Timer.start();
			
		// 开启渲染循环
		requestAnimFrame(loopFunc);
	};

	var onLoadImageFile = function(fileName, textureID) {
		
		g_Texture0_ID = textureID;

		console.log('InitImage SUCCESS.');
	};

	// -------------------------
	//  Start the Main Function
	// -------------------------

	console.log($);

	// 界面相关
	$('#brdfMaterialSelector').on('change', function(data) {

		var fileName = $("#brdfMaterialSelector option:selected").attr('value');		
		
		image = new Image();
		image.onload = function() {
		
			var gl = g_WebGLContext;

			gl.bindTexture(gl.TEXTURE_2D, g_Texture0_ID);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

			gl.generateMipmap(gl.TEXTURE_2D);
			gl.bindTexture(gl.TEXTURE_2D, null);
		};
		image.src = '../res/material/' + fileName + '.png';
    });

	var brdfs = ['alum-bronze', 'alumina-oxide', 'aluminium', 'aventurnine', 
				 'beige-fabric', 'black-fabric', 'black-obsidian', 
				 'black-oxidized-steel', 'black-phenolic', 'black-soft-plastic', 
				 'blue-acrylic', 'blue-fabric', 'blue-metallic-paint', 
				 'blue-metallic-paint2', 'blue-rubber', 'brass', 'cherry-235', 
				 'chrome-steel', 'chrome', 'colonial-maple-223', 'color-changing-paint1', 
				 'color-changing-paint2', 'color-changing-paint3', 'dark-blue-paint', 
				 'dark-red-paint', 'dark-specular-fabric', 'delrin', 'fruitwood-241', 
				 'gold-metallic-paint', 'gold-metallic-paint2', 'gold-metallic-paint3', 
				 'gold-paint', 'gray-plastic', 'grease-covered-steel', 'green-acrylic', 
				 'green-fabric', 'green-latex', 'green-metallic-paint', 
				 'green-metallic-paint2', 'green-plastic', 'hematite', 
				 'ipswich-pine-221', 'light-brown-fabric', 'light-red-paint', 
				 'maroon-plastic', 'natural-209', 'neoprene-rubber', 'nickel', 'nylon', 
				 'orange-paint', 'pearl-paint', 'pickled-oak-260', 'pink-fabric', 
				 'pink-fabric2', 'pink-felt', 'pink-jasper', 'pink-plastic', 
				 'polyethylene', 'polyurethane-foam', 'pure-rubber', 'purple-paint', 
				 'pvc', 'red-fabric', 'red-fabric2', 'red-metallic-paint', 
				 'red-phenolic', 'red-plastic', 'red-specular-plastic', 
				 'silicon-nitrade', 'silver-metallic-paint', 'silver-metallic-paint2', 
				 'silver-paint', 'special-walnut-224', 'specular-black-phenolic', 
				 'specular-blue-phenolic', 'specular-green-phenolic', 
				 'specular-maroon-phenolic', 'specular-orange-phenolic', 
				 'specular-red-phenolic', 'specular-violet-phenolic', 
				 'specular-white-phenolic', 'specular-yellow-phenolic', 'ss440', 'steel', 
				 'teflon', 'tungsten-carbide', 'two-layer-gold', 'two-layer-silver', 
				 'violet-acrylic', 'violet-rubber', 'white-acrylic', 
				 'white-diffuse-bball', 'white-fabric', 'white-fabric2', 'white-marble', 
				 'white-paint', 'yellow-matte-plastic', 'yellow-paint', 
				 'yellow-phenolic', 'yellow-plastic'];
	
	$.each(brdfs, function(key, value) {
		$('#brdfMaterialSelector').append('<option value="' + value + '_rgbe">' + value + '</option>');
    });

	// 初始化流程：
	// 1. initWebGLContext ->
	// 2. initModel ->
	// 3. initShader ->
	// 4. initScene (ModelView, Projection, VBOs) ->
	// 5. initImage (Texture) ->

	// 初始化 WebGL 上下文环境
	g_WebGLContext = initWebGLContext("webGLCanvas");

	if (g_WebGLContext !== undefined) {
		console.log('InitWebGLContext SUCCESS.');
	} else {
		return;
	}

	// 开始载入模型
	initModel('../res/model/monkey.json', onLoadModelFile);
});

