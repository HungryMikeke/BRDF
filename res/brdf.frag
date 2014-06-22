#ifdef GL_ES
precision highp float;
#endif

#define RGBE_FORMAT
#define QUADRILINEAR_INTERPOLATION

#ifdef FRAGMENT_SHADER

// Uniform Variables
uniform sampler2D BRDFMap;

uniform vec3 vDiffuseColor;
uniform float fSpecularIntensity;
uniform float fExposure;

uniform float fTextureWidth;
uniform float fTextureHeight;
uniform float fSegTheta;													// Resolution of theta

float SegPhi = fSegTheta * 4.0;												// Number of segments per longitude angle
const float PI = 3.1415926535897932384626433832795028841971694;
const float PI_DIV_2 = PI * 0.5;

// Varying Variables (Input 4 Fragment Shader & Output 4 Vertex Shader)
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
	vec3 normal = normalize(vNormalAttrib);
	vec3 tangent = normalize(vTangentAttrib);
	// vec3 tangent = normalize(vec4(cross(vNormalAttrib, vec3(0.0, 1.0, 0.0)), 0.0)).xyz);

	// Transform from World to Tangent Space
	// mat3 TangentSpace = mat3(tangent, normalize(cross(vNormalAttrib, vTangentAttrib)), vNormalAttrib);
	mat3 TangentSpace = mat3(tangent, normalize(cross(vNormalAttrib, vTangentAttrib)), normal);
	
	// Light Direction in Tangent Space
	vLightDirOutput = normalize(TangentSpace * vLightDir);
	
	vec3 viewDir = vCameraPos - position.xyz;
	vViewDirOutput = normalize(TangentSpace * viewDir);
	
	vTexCoordOutput = vTexCoordAttrib;
	vDebugOutput = tangent;
	
	gl_Position = mProjection * mCameraView * mModelTrans * position;
}

#endif

