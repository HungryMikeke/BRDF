/**
 * Defines the semantic role of a vertex attribute
 * @readonly
 * @enum {string}
 */

var AttributeRole = {
	/**
	 * Attribute has an unknown role.
	 */
	'Unknown'	: '',
	/**
	 * Attribute is a vertex position.
	 */    
	'Position'  : 'p',
	/**
	 * Attribute is a vertex normal.
	 */    
	'Normal'    : 'n',
	/**
	 * Attribute is a set of texture coordinates.
	 */    
	'TexCoord'  : 't',
	/**
	 * Attribute is a color.
	 */    
	'Color'     : 'c',
	/**
	 * Attribute is a tangent.
	 */    
	'Tangent'   : 'tg',
	/**
	 * Attribute is a bitangent.
	 */    
	'BiTangent' : 'b'
};
  
/**
 * Attempts to find the semantic role of a vertex attribute based
 * on its name.
 * @param {object} info Info record returned by WebGL
 * @returns {AttributeRole} Guessed attribute role
 */

/*
var guessAttributeRole = function(info) {
	var format = /A(.+)/;
	var m = info.name.match(format);
	var name = (m === null) ? info.name : m[1];
	var role = AttributeRole[name] || AttributeRole.Unknown;
	console.log(info.name + ' is a ' + role + '.');
	return role;
};
*/

/**
 * @constructor
 * @classdesc Exception that is thrown, when the specified vertex format string is invalid. 
 */

var VertexFormatError = function(message) {
	this.toString = function() { return message; };
}; 

/**
 * @constructor
 * @classdesc Exception that is thrown, when the passed vertex data does not match the specified vertex format. 
 */

var VertexDataError = function(message) {
	this.toString = function() { return message; };
};

var UnknownUniformError = function(message) {
	this.toString = function() { return message; };
};  

/**
 * Creates a new VertexFormat instance
 * @constructor
 * @classdesc Declares the layout of vertex attribute data
 * @param {string} format String that specifies the format of vertex attributes.
 */

var VertexFormat = function(vertices, format) {

	/**
	 * Defined vertex attributes
	 * @type {Array.<object>}
	 */
	this.attributes = [];
    /**
     * Vertex format string
     * @type {string}
     */
    this.format = format;
    /**
     * Total size of defined vertex attributes in number of floats
     */
    this.size = 0;
    
    var readBlock = function(blockFormat) {
		
		var pattern = /\s*([a-zA-Z]+)([0-9]+)(.*)/;
		var blockSize = 0;
		var attrs = [];
		
		while (blockFormat.length > 0) 
		{
			m = blockFormat.match(pattern);
			if (m === null) {
				throw new VertexFormatError('Vertex format string is invalid at position ' + format.length - expr.length);
				// return;
			}

			blockFormat = m[3];
			role = AttributeRole[findFirstKey(AttributeRole, m[1]) || AttributeRole.Unknown];
			size = parseInt(m[2]);
			blockSize += size;
			if (size < 1 || size > 16) {
				throw new VertexFormatError('Vertex format string contains attribute with invalid size (' + m[1] + m[2] + ').');
			}
			if (role === AttributeRole.Unknown) {
				throw new VertexFormatError('Vertex format string contains attribute with unknown role (' + m[1] + m[2] + ').');
			}
			attrs.push({ role: role, size: size });
		}
		return { attrs: attrs, size: blockSize };
	};
    
    // Read blocks:
    var blockFormats = format.split('|');
    var blocks = [];
    for (var i = 0; i < blockFormats.length; i++) {
		var block = readBlock(blockFormats[i]);
		blocks.push(block);
		this.size += block.size;
    }
    
    if (vertices.length % this.size !== 0) {
		throw new VertexDataError('Length of vertices array does not match vertex format');
    }
    
    // Create attributes and calculate stride and offset:
    var vertexCount = vertices.length / this.size;
    var blockOffset = 0;
    var self = this;
    
	$.each(blocks, function() {
		
		var block = this;
		var offset = blockOffset;
		
		$.each(block.attrs, function() {
			
			self.attributes.push({
				role: this.role,
				size: this.size,
				stride: (block.attrs.length > 1) ? block.size * 4 : 0,
				offset: offset});
			
			offset += this.size * 4;
		});
		
		blockOffset += block.size * vertexCount * 4;
	});
};
  
/**
 * Find the vertex attribute with the specified role
 * @param {AttributeRole} role Attribute role
 * @returns {Object=} The vertex attribute definition or null if no 
 * attribute with the specified role exists. 
 */

VertexFormat.prototype.find = function(role) {

	var attrs = this.attributes;
	
	for (var i = 0; i < attrs.length; i++) {
		var attr = attrs[i];
		if (attr.role === role) {
			return attr;
		}
	}

	return null;
};

/**
 * Creates a new Mesh instance
 * @param {Float32Array} vertices Vertex data
 * @param {Uint16Array} indices Index data
 * @param {string} format Vertex format string
 * @param {number} primitive WebGL type of primitive
 * @param {boolean} calculateTangents If true, tangents are calculated and added to
 *   the vertex data. primtive has to be triangles and three-component positions and
 *   two-component texture coordinates need to be provided.
 * @constructor {}
 * @classdesc Mesh that represents a sequence of primitives composed of
 *   vertices with a set of customizable attributes 
 */

var Mesh = function(vertices, indices, format, primitive, calculateTangents) {
    
    var getPrimitiveCount = function(indexCount, primitive) {
      
		if (primitive === gl.TRIANGLES) {
			return indexCount / 3 >>> 0;
		} else if (primitive === gl.TRIANGLE_STRIP || primitive === gl.TRIANGLE_FAN) {
			return indexCount / 2 >>> 0;
		} else if (primitive === gl.LINES) {
			return indexCount / 2 >>> 0;
		} else if (primitive === gl.LINE_STRIP || primitive === gl.LINE_LOOP) {
			return indexCount - 1;
		} else if (primitive === gl.POINTS) {
			return indexCount;
		} else {
			return 0;
		}
	};
    
    // Convert Vertices and Indices to Float32Array and Uint16Array
    if (vertices && vertices instanceof Float32Array === false) {
		vertices = new Float32Array(vertices);
	}
    if (indices && indices instanceof Uint16Array === false) {
		indices = new Uint16Array(indices);
	}
    
    /**
     * Type of primitives to render
     * @type {number} 
     */    
    this.primitive = primitive || gl.TRIANGLES;
    
	/**
     * Format of vertex attributes
     * @type {VertexFormat}
     */
    this.vertexFormat = new VertexFormat(vertices, format);
    
	/**
     * Number of vertices in this mesh
     * @type {number}
     */
    this.vertexCount = vertices.length / this.vertexFormat.size;
    
	/**
     * {number} Number of indices in this mesh
     * @type {number}
     */
    this.indexCount = indices ? indices.length : this.vertexCount;
    
	/**
     * {number} Number of primitives defined in this mesh
     * @type {number}
     */
    this.primitiveCount = getPrimitiveCount(this.indexCount, this.primitive);
    
    if (true === calculateTangents) {
		vertices = this.calculateTangents(this, vertices, indices);
    }
    
    /**
     * Vertex buffer
     * @type {WebGLBuffer}
     */

    /*
	this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
	*/

    /**
     * Index buffer
     * @type {WebGLBuffer}
     */
    
	/*
	this.ibo = null;
    if (indices) {
		this.ibo = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }
	*/
};
  
Mesh.prototype.calculateTangents = function(mesh, vertices, indices) {
    
	var posAttr = this.vertexFormat.find(AttributeRole.Position);
    var texAttr = this.vertexFormat.find(AttributeRole.TexCoord);
    
	// Triangles with XYZ position and XY texture coordinates needed: 
    if (this.primitive !== gl.TRIANGLES || 
		posAttr === null || posAttr.size !== 3 ||
        texAttr === null || texAttr.size !== 2) 
	{
		return false;
    }    
        
    var pos = new Float32Array(9);
    var tex = new Float32Array(6);

    var pStride = posAttr.stride === 0 ? 3 : posAttr.stride / 4;
    var pOffset = posAttr.offset / 4;
    
    var tStride = posAttr.stride === 0 ? 2 : texAttr.stride / 4;
    var tOffset = texAttr.offset / 4;
	
    var q1 = new Float32Array(3);
    var q2 = new Float32Array(3);
    var u1 = new Float32Array(2);					// s1, t1
    var u2 = new Float32Array(2);					// s2, t2    
	
	var setQU = function(indices) 
	{
		// Fetch Position and Texture Coordinates for all 3 triangle vertices
		for (var j = 0; j < 3; j++) 
		{
			var vi = indices[j];					// Vertex index

			// Fetch Vertex Position X, Y & Z
			for (var c = 0; c < 3; c++) {
				pos[j * 3 + c] = vertices[vi * pStride + pOffset + c];
			}
			// Fetch Texture Coordinates X & Y:
			for (var c = 0; c < 2; c++) {
				tex[j * 2 + c] = vertices[vi * tStride + tOffset + c];
			}
		}

		// Calculate difference vectors:
		for (var c = 0; c < 3; c++) {
			q1[c] = pos[c + 3] - pos[c];
			q2[c] = pos[c + 6] - pos[c];
		}

		u1[0] =  tex[5] - tex[1];					//  t2
		u1[1] = -tex[3] + tex[1];					// -t1
		u2[0] = -tex[4] + tex[0];					// -s2
		u2[1] =  tex[2] - tex[0];					//  s1
    };
    
    var t = vec3.create();
    var indexCount = mesh.indexCount;
    var tangents = new Float32Array(3 * mesh.vertexCount);
    var index = 0;
    
    var triIndices = new Uint16Array(3);
    while (index < indexCount) 
	{
		// Set vertex indices of triangle:
		if (!indices) {
			for (var i = 0; i < 3; i++) {
				triIndices[i] = index + i;
			}
		}
		else {
			for (var i = 0; i < 3; i++) {
				triIndices[i] = indices[index + i];
			}
		}
      
		// Set Position and Texture Coordinate difference vectors:
		setQU(triIndices);
      
		// Calculate tangent of triangle:
		var frac = 1.0 / (u1[0] * u2[1] - u2[0] * u1[1]);
		for (var i = 0; i < 3; i++) {
			t[i] = ((u1[0] * q1[i] + u1[1] * q2[i]) * frac);
		}
		vec3.normalize(t);
      
		// Accumulate triangle tangent to vertex tangents:
		for (var i = 0; i < 3; i++) {
			var vi = triIndices[i] * 3;
			tangents.set(t, vi);
		}

		index += 3;
    }

    // Normalize Vertex Tangents:
    for (var i = 0; i < mesh.vertexCount; i++) {
		vec3.normalize(tangents.subarray(i * 3, i * 3 + 3));
    }

    // Append Tangents to Vertices:
    var newVertices = new Float32Array(vertices.length + tangents.length);
    newVertices.set(vertices);
    newVertices.set(tangents, vertices.length);
    mesh.vertexFormat = new VertexFormat(newVertices, mesh.vertexFormat.format + '|' + AttributeRole.Tangent + '3');

    return newVertices;
};

/**
 * Creates a new Model instance
 * @constructor 
 * @classdesc Represents a drawable 3D model composed of 3D meshes.
 */  
var Model = function() {
	/**
     * Meshes of the model
     * @type {Mesh}
     */
    this.meshes = [];
};
  
/**
 * Loads a model from the specified JSON data.
 * @param {JSON} data JSON model datai
 */
Model.prototype.load = function(data)
{
	// Resolves one to many mapping between vertex index and texture coordinates 
	// By adding new vertices
	var resolveTexCoords = function(indices, positions, normals, texCoords) {
	  	
		var eps = 1e-5;
	  	
		texCoordMap = {};
	  	vertexCount = positions.length / 3;
	  	newTexCoords = new Array(vertexCount * 2);
	  	
		for (var i = 0; i < indices.length; i++) 
		{
        	var u = texCoords[i * 2];
        	var v = texCoords[i * 2 + 1];        
        	var vi = indices[i];
        	var tc = texCoordMap[vi];
        	if (tc === undefined) 
			{
          		// Map first texture coordinate to this vertex index
          		texCoordMap[vi] = [u, v];
          		newTexCoords[vi * 2] = u;
          		newTexCoords[vi * 2 + 1] = v;
        	}
        	else if (Math.abs(tc[0] - u) > eps || Math.abs(tc[1] - v) > eps) 
			{
          		// Texture coordinates mismatch, so duplicate vertex with new texture coordinates
          		var nvi = positions.length / 3;
          		var vi3 = vi * 3;
          		positions.push(positions[vi3]);
          		positions.push(positions[vi3 + 1]);
          		positions.push(positions[vi3 + 2]);
          		newTexCoords.push(u);
          		newTexCoords.push(v);
          		if (normals !== undefined) 
				{
            		normals.push(normals[vi3]);
            		normals.push(normals[vi3 + 1]);
            		normals.push(normals[vi3 + 2]);
          		}
          		indices[i] = nvi;
        	}
      	}

      	return newTexCoords;
	};
    
    var self = this;

    $.each(data.objs, function() {

		var meshData = this.mesh;
      
      	// Check mesh data content
      	var hasNormals = meshData.n !== undefined;
      	var hasTexCoords = (meshData.uv !== undefined) && (meshData.uv.length > 0);

		// Calculate vertex format
      	var size = 3 + (hasNormals ? 3 : 0) + (hasTexCoords ? 2 : 0);
		var format = AttributeRole.Position + '3' + 
					(hasNormals ? '|' + AttributeRole.Normal + '3' : '') +
      				(hasTexCoords ? '|' + AttributeRole.TexCoord + '2' : '');
	
		var indices = meshData.f;
      	var positions = meshData.v;
      	var normals = meshData.n;
      	var texCoords = hasTexCoords ? meshData.uv[0] : undefined;
      
      	if (hasTexCoords) {
        	texCoords = resolveTexCoords(indices, positions, normals, texCoords);
      	}
      
      	var indexCount = indices.length;
      	var vertexCount = positions.length / 3;
      	var vertices = new Float32Array(vertexCount * size);
  		
		var offset = 0;
      	
		vertices.set(positions, offset);
      	offset += vertexCount * 3;
      	
		if (hasNormals) {
        	vertices.set(normals, offset);
        	offset += vertexCount * 3;
      	}
      	
		if (hasTexCoords) {
        	vertices.set(texCoords, offset);
        	offset += vertexCount * 2;
      	}

      	var mesh = new Mesh(vertices, indices, format, gl.TRIANGLES, true);
     	self.meshes.push(mesh);
    });
};

