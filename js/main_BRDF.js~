/**
 * - JavaScript Code for Rendering BRDF
 *
 * - 1. Simple mechanism for loading new resources at run time
 * - 2. Loading resources from strings or DOM elements
 * - 3. Add support for cube maps
 */
 
require.config({

	baseUrl:		'js/lib',
	paths: {
		jquery:		'jquery-1.11.0',
		gl-matrix:	'gl-matrix-2.2.1',
		modernizr:	'modernizr-2.7.2',
	}
});
 
require(["jquery", "gl-matrix", "modernizr"], function($)
{
	// 全局变量
	var g_WebGLContext = undefined;
	var g_Shader = undefined;
	var g_Model = undefined;

	var g_CanvasAspectRatio = 1.0;

	var g_CameraViewMatUniformLocation = undefined;
	var g_ProjectionMatUniformLocation = undefined;

	// 函数
	var initWebGLContext = function(canvasID) {
		
		var webGLContext;
		
		var canvas = document.getElementById(canvasID);
		if (undefined != canvas) {
			// webGLContext = canvas.getContext("experimental-webgl");
			webGLContext = canvas.getContext("webgl");
			
			webGLContext.enable(webGLContext.DEPTH_TEST);
			webGLContext.enable(webGLContext.CULL_FACE);
		
			webGLContext.cullFace(webGLContext.BACK);
		}

		return webGLContext;	
	};

	var initShader = function(vertShaderFilename, fragShaderFilename, callback) {

		// 变量用于保存 Shader 代码
		var vertShaderSource = undefined;
		var fragShaderSource = undefined;

		// 回调函数（读取完文件）
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
	
	var initScene = function() {

		g_ProjectionMatUniformLocation = g_WebGLContext.getUniformLocation(g_Shader.getGLProgramID(), 'projectionMat');
		g_CameraViewMatUniformLocation = g_WebGLContext.getUniformLocation(g_Shader.getGLProgramID(), 'cameraViewMat');

		var projectionMatrix = mat4.perspective(45.0, g_CanvasAspectRatio, 0.1, 100.0);
		var cameraViewMatrix = mat4.lookAt([0, 0, 2.8], [0, 0, 0], [0, 1, 0]);

		g_WebGLContext.uniformMatrix4fv(g_ProjectionMatUniformLocation, false, projectionMatrix);
		g_WebGLContext.uniformMatrix4fv(g_CameraViewMatUniformLocation, false, cameraViewMatrix);
	};

	var onLoadModelFile = function(model) {
		
		var onLoadShader = function(result, shader) {
			
			g_Shader = shader;
			initScene();
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
	// 4. initScene (ModelView, Projection) ->

	// 初始化 WebGL 上下文环境
	g_WebGLContext = initWebGLContext("webGLCanvas");

	// 开始载入模型
	initModel('res/monkey.json', onLoadModelFile);
});

