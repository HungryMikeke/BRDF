// ---------------
//  Vertex Shader
// ---------------

precision highp float;

// Uniform Variables
uniform mat4 mProjection;
uniform mat4 mCameraView;
uniform vec3 vCameraPos;
uniform mat4 mModelTrans;

uniform vec3 vLightDir;

// Attribute Variables (Input)
attribute vec3 vPosAttrib;
attribute vec3 vNormalAttrib;
attribute vec2 vTexCoordAttrib;
attribute vec3 vTangentAttrib;

// Varying Variables (Output 4 Fragment Shader)
varying vec2 vTexCoordOutput;
varying vec3 vLightDirOutput;
varying vec3 vViewDirOutput;
varying vec3 vDebugOutput;

// ---------------
//  Main Function
// ---------------

void main(void)
{
	// Position in Object Coordinates
	vec4 position = vec4(vPosAttrib, 1.0);
	
	// Normal & Tangent in World Coordinates
	vec3 normal = normalize((mModelTrans * vec4(vNormalAttrib, 0.0)).xyz);
	// vec3 tangent = normalize((mModelTrans * vec4(vTangentAttrib, 0.0)).xyz);
	vec3 tangent = normalize((mModelTrans * vec4(cross(vNormalAttrib, vec3(0.0, 1.0, 0.0)), 0.0)).xyz);

	// Transform from World to Tangent Space
	// mat3 TangentSpace = mat3(tangent, normalize(cross(vNormalAttrib, vTangentAttrib)), vNormalAttrib);
	// mat3 TangentSpace = mat3(tangent, normalize(cross(vNormalAttrib, vTangentAttrib)), normal);
	mat3 TangentSpace = mat3(tangent, normalize(cross(normal, tangent)), normal);
	
	// Light Direction in Tangent Space
	vLightDirOutput = normalize(TangentSpace * vLightDir);
	
	vec3 viewDir = vCameraPos - (mModelTrans * position).xyz;
	vViewDirOutput = normalize(TangentSpace * viewDir);
	
	vTexCoordOutput = vTexCoordAttrib;
	vDebugOutput = tangent;
	
	// gl_Position = mProjection * mCameraView * vec4(vNormalAttrib, 1.0);
	gl_Position = mProjection * mCameraView * mModelTrans * position;
}
