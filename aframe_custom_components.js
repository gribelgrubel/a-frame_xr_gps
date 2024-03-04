
// A-Frame custom polygon component
AFRAME.registerComponent('custom-polygon-deprecated', {
    schema: {
      vertices: {
        default: [],
        parse: function (value) {
          return JSON.parse(value);
        }
      }
    },
    init: function () {
      // Create a new geometry
      // var geometry = new THREE.Geometry();  // THREE.geoometry is deprecated! see https://discourse.threejs.org/t/three-geometry-will-be-removed-from-core-with-r125/22401
      var geometry = new THREE.BufferGeometry();
      // Iterate over the vertices and add them to the geometry
      this.data.vertices.forEach(function (vertex) {
        geometry.vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
      });

      // Create the faces based on the vertices
      for (let i = 1; i < this.data.vertices.length - 1; i++) {
        geometry.faces.push(new THREE.Face3(0, i, i + 1));
      }

      geometry.computeBoundingSphere();

      // Create a mesh material (customize as needed)
      var material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });

      // Create a mesh and set its geometry and material
      var mesh = new THREE.Mesh(geometry, material);

      // Set the mesh as the object of the entity
      this.el.setObject3D('mesh', mesh);
    }
  });

  AFRAME.registerComponent('custom-polygon-convexonly', {
    schema: {
      vertices: {
        default: [],
        // Updated to correctly handle both string and object/array types
        parse: function (value) {
          if (typeof value === 'string') {
            try {
              return JSON.parse(value);
            } catch (e) {
              console.error('Parsing error:', e);
              return [];
            }
          }
          return value; // Assume it's already an array if not a string
        }
      }
    },
    init: function () {
      // Use BufferGeometry
      var geometry = new THREE.BufferGeometry();
      const vertices = [];
      const vertexCount = this.data.vertices.length;

      // Iterate over the vertices to flatten the array for BufferGeometry
      this.data.vertices.forEach(function (vertex) {
        vertices.push(vertex.x, vertex.y, vertex.z);
      });

      // Add vertices to geometry
      var verticesFloat32Array = new Float32Array(vertices);
      geometry.setAttribute('position', new THREE.BufferAttribute(verticesFloat32Array, 3));

      if (vertexCount > 2) {
        // Automatically generate a simple triangulation
        const indices = [];
        for (let i = 1; i < vertexCount - 1; i++) {
          indices.push(0, i, i + 1);
        }
        geometry.setIndex(indices);
      }

      geometry.computeVertexNormals(); // Optional, for lighting

      // Create a mesh material (customize as needed)
      var material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });

      // Create a mesh and set its geometry and material
      var mesh = new THREE.Mesh(geometry, material);

      // Set the mesh as the object of the entity
      this.el.setObject3D('mesh', mesh);
    }
  });

  AFRAME.registerComponent('custom-polygon', {
    schema: {
      vertices: {
        // Allow input as a JSON string or a JavaScript array
        parse: function (value) {
          if (typeof value === 'string') {
            console.log("received vertex data as json string:");
            console.log(value);
            return JSON.parse(value);
          }
          // Assume it's already a JavaScript array if not a string
          console.log("received vertex data as array:");
          console.log(value);
          return value;
        }
      }
    },
    init: function () {
      // Assume vertices are provided in a format suitable for creating a shape
      console.log("creating new THREE.Shape")
      const shape = new THREE.Shape();
      this.data.vertices.forEach((vertex, idx) => {
        // Move to the first vertex to start the shape
        if (idx === 0) {
          shape.moveTo(vertex.x, vertex.y);
        } else {
          shape.lineTo(vertex.x, vertex.y);
        }
      });
      // Close the shape for proper rendering
      shape.closePath();

      // Use ShapeBufferGeometry for concave shapes
      var geometry = new THREE.ShapeBufferGeometry(shape);

      // Create a mesh material (customize as needed)
      var material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });

      // Create a mesh and set its geometry and material
      var mesh = new THREE.Mesh(geometry, material);

      // Set the mesh as the object of the entity
      this.el.setObject3D('mesh', mesh);
      console.log("initialized shape");
    },
    update: function (oldData) {
      // Remove the previous mesh if the data has changed
      if (JSON.stringify(this.data.vertices) !== JSON.stringify(oldData.vertices)) {
        this.el.removeObject3D('mesh');
        this.init(); // Reinitialize to create a new mesh with the updated data
      }
    }
  });

  //Example implementation (pass serialized JSON as polygon data:)
    {/* <a-scene>
    <a-entity custom-polygon="vertices: [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0.5, y: 1, z: 0}]"></a-entity>
    </a-scene> */}

