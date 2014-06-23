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
		gl-matrix:	'lib/gl-matrix-2.2.1',
		modernizr:	'lib/modernizr-2.7.2',
		model:		'Model',
		shader:		'Shader',
		timer:		'Timer',
	}
});
 
require(["jquery", "gl-matrix", "modernizr", "model", "shader", "timer"], function($)
{
	// 全局变量
	var g_WebGLContext = undefined;
	var g_Shader = undefined;
	var g_Model = undefined;
	
	// 全局参数
	var g_CanvasAspectRatio = 1.0;
	var g_AnimationKey = 0.0;

	var g_Exposure = 0.0;

	// Uniform Locations 4 Shader
	var g_ModelMatUniformLocation = undefined;
	var g_CameraViewMatUniformLocation = undefined;
	var g_CameraPosVecUniformLocation = undefined;
	var g_ProjectionMatUniformLocation = undefined;
	var g_LightDirVecUniformLocation = undefined;

	var g_DiffuseColorVecUniformLocation = undefined;
	var g_SpecularIntensityUniformLocation = undefined;
	var g_ExposureUniformLocation = undefined;
	
	var g_TextureWidthUniformLocation = undefined;
	var g_TextureHeightUniformLocation = undefined;
	var g_SegThetaUniformLocation = undefined;

	var g_BRDFMapUniformLocation = undefined;

	// Attribute Locations 4 Shader
	var g_PositionAttribLocation = undefined;
	var g_NormalAttribLocation = undefined;
	var g_TexCoordAttribLocation = undefined;
	var g_TangentAttribLocation = undefined;

	// VBOs Index
	var g_VertexBufferObject = 0;
	var g_IndexBufferObject = 0;

	// 函数
	var initWebGLContext = function(canvasID) {
		
		var webGLContext = undefined;
		
		var canvas = document.getElementById(canvasID);
		if (undefined != canvas) 
		{
			webGLContext = canvas.getContext("experimental-webgl");
			
			webGLContext.enable(webGLContext.DEPTH_TEST);
			webGLContext.enable(webGLContext.CULL_FACE);
		
			webGLContext.cullFace(webGLContext.BACK);

			webGLContext.clearColor(0.0, 0.0, 0.0, 1.0);
			webGLContext.clearDepth(0.0);
		}

		return webGLContext;	
	};

	var initShader = function(vertShaderFilename, fragShaderFilename, callback) {

		// 变量用于保存 Shader 代码
		var vertShaderSource = undefined;
		var fragShaderSource = undefined;

		// 回调函数（读取文件）
		var onGetVertShaderSource = function(source) {
			vertShaderSource = source;
			$.get(fragShaderFilename, onGetFragShaderSource, 'text');	
		};

		var onGetFragShaderSource = function(source) {
			fragShaderSource = source;
		
			// 初始化 Shader
			var shader = new Shader(webGLContext, vertShaderSource, fragShaderSource);
			
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

	var initModel = function(filename, callback) {
		
		var onGetJSONFileDone = function(data) {
			
			// 初始化 Model
			var model = new Model();
			model.load(data);

			callback(model);
		}

		// 载入 JSON 模型文件
		$.getJSON('res/monkey.json', onGetJSONFileDone);	
	};
	
	var initScene = function(gl) {

		// Shader Program
		var program = g_Shader.getGLProgramID();

		// Init Light Direction Slot
		g_LightDirVecUniformLocation = gl.getUniformLocation(program, 'vLightDir');

		// Init Model Transform & Camera View & Projection Matrix Slots
		g_ProjectionMatUniformLocation = gl.getUniformLocation(program, 'mProjection');
		g_CameraViewMatUniformLocation = gl.getUniformLocation(program, 'mCameraView');
		g_CameraPosVecUniformLocation = gl.getUniformLocation(program, 'vCameraPos');
		g_ModelMatUniformLocation = gl.getUniformLocation(program, 'mModelTrans');

		var projectionMatrix = mat4.perspective(45.0, g_CanvasAspectRatio, 0.1, 100.0);
		var cameraViewMatrix = mat4.lookAt([0, 0, 2.8], [0, 0, 0], [0, 1, 0]);
		var cameraPosVec = vec3.create([0, 0, 2.8]);

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

		g_BRDFMapUniformLocation = gl.getUniformLocation(program, 'BRDFMap');

		var segTheta = 32.0;

		gl.uniform1f(g_TextureWidthUniformLocation, segTheta * 4.0);
		gl.uniform1f(g_TextureHeightUniformLocation, segTheta * segTheta);
		gl.uniform1f(g_SegThetaUniformLocation, segTheta);

		gl.uniform1f(g_ExposureUniformLocation, g_Exposure);

		// Init Array Slots
		g_PositionAttribLocation = gl.getUniformLocation(program, 'vPosAttrib');
		g_NormalAttribLocation = gl.getUniformLocation(program, 'vNormalAttrib');
		g_TexCoordAttribLocation = gl.getUniformLocation(program, 'vTexCoordAttrib');
		g_TangentAttribLocation = gl.getUniformLocation(program, 'vTangentAttrib');

		// Init Model
		g_VertexBufferObject = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, g_VertexBufferObject);
		gl.bufferData(gl.ARRAY_BUFFER, g_Model.meshes[0].vertices, gl.STATIC_DRAW);
		
		g_IndexBufferObject = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, g_IndexBufferObject);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g_Model.meshes[0].indices, gl.STATIC_DRAW);
	};

	// ------------------
	//  Render the Scene
	// ------------------

	var draw = function() {
		
		// Use Program
		g_WebGLContext.useProgram(g_Shader.getGLProgramID());
		
		// Clear the Buffer
		g_WebGLContext.clear(g_WebGLContext.COLOR_BUFFER_BIT | g_WebGLContext.DEPTH_BUFFER_BIT);

		// Light Direction Vector	
		var lightDirVec = vec3.create([0, 0, 1]);
		mat4.multiplyVec3(mat4.rotateX(mat4.identity(), Math.sin(g_AnimationKey * Math.PI * 8.0) * Math.PI * 0.5), lightDirVec);
		gl_WebGLContext.uniform3fv(g_LightDirVecUniformLocation, lightDirVec);

		// Object Transform Matrix
		var objectTransMatrix = mat4.rotateY(mat4.identity(), g_AnimationKey * Math.PI * 2.0);
		g_WebGLContext.uniformMatrix4fv(g_ModelMatUniformLocation, false, objectTransMatrix);

		// Active the VBOs
		g_WebGLContext.bindBuffer(g_WebGLContext.ARRAY_BUFFER, g_VertexBufferObject);
	    g_WebGLContext.bindBuffer(g_WebGLContext.ELEMENT_ARRAY_BUFFER, g_IndexBufferObject); 
    	
		// Improve disabling unused attribute slots
		var count = g_WebGLContext.getParameter(g_WebGLContext.MAX_VERTEX_ATTRIBS);
		for (var i = 0; i < count; ++i) {
			g_WebGLContext.disableVertexAttribArray(i);
		}

		// Assign portions of the vertex buffer to attribute index used by the effect
		var attrs = g_Model.meshes[0].vertexFormat.attributes;
		for (var i = 0; i < attrs.length; ++i) 
		{
			var loc = undefined;

			// Search vertex format declaration for a fitting vertex attribute:  
			if (attrs[i].role === 'p') {
				loc = g_PositionAttribLocation;
			} else if (attrs[i].role === 'n') {
				loc = g_NormalAttribLocation;
			} else if (attrs[i].role === 't') {
				loc = g_TexCoordAttribLocation;
			} else if (attrs[i].role === 'tg') {
				loc = g_TangentAttribLocation;
			}

			if (loc) 
			{
				// Enable & Set Pointer of Vertex Attrib Arrays
				g_WebGLContext.enableVertexAttribArray(loc);
				g_WebGLContext.vertexAttribPointer(loc, attrs[i].size, g_WebGLContext.FLOAT, false, attrs[i].stride, attrs[i].offset);
			}
		}
    
		if (g_IndexBufferObject) {
			g_WebGLContext.drawElements(g_Model.meshes[0].primitive, g_Model.meshes[0].indexCount, g_WebGLContext.UNSIGNED_SHORT, 0);
		} else {
			g_WebGLContext.drawArrays(g_Model.meshes[0].primitive, 0, g_Model.meshes[0].indexCount);
		}
	}

	var onLoadModelFile = function(model) {
		
		var onLoadShader = function(result, shader) {
				
			g_Shader = shader;
			
			// 初始化场景
			initScene(g_WebGLContext);
		}

		g_Model = model;

		// 开始载入 Shader 文件
		initShader('res/brdf.vert', 'res/brdf.frag', onLoadShader);
	}

	// -------------------------
	//  Start the Main Function
	// -------------------------

	console.log($);

	// 界面相关
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

	// 初始化 WebGL 上下文环境
	g_WebGLContext = initWebGLContext("webGLCanvas");

	// 开始载入模型
	initModel('model/monkey.json', onLoadModelFile);
});

