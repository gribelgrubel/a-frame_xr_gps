/* 

High-Level Ablauf:
- get hamburg api coordinates for feature (bzw lokale json dateien laden)
- array of polygon x, y coords (an realer Lat-Long position)
- umrechnen zu relativen Positionen zueinander, dann Mittelpunkt finden (und den wieder mit realer Lat-Long-Pos verknüpfen)
- +Bezeichnung des Features
- custom aframe component, um object mit vielzahliger anzahl an vertices zu zeichnen
- mit diesem dann die punkte auf karte einzeichnen, auch siehe hikar_tests

siehe auch:
https://stackoverflow.com/questions/44968918/add-polygon-in-a-frame
https://jsfiddle.net/gftruj/3brL5744/ 

https://chat.openai.com/c/ef5572aa-c83b-418c-8a17-834fac5e40dc 
To generate a polygon using the <a-entity> element with a custom A-Frame component, you'll need to write JavaScript code that defines how the component works, including how it processes input (in your case, an array of latitude and longitude values converted to local 3D coordinates) and how it constructs the polygon geometry. 

 */


// A-Frame custom polygon component
AFRAME.registerComponent('custom-polygon', {
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

  //Example implementation (pass serialized JSON as polygon data:)
    {/* <a-scene>
    <a-entity custom-polygon="vertices: [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0.5, y: 1, z: 0}]"></a-entity>
    </a-scene> */}



    // Convert Lat-Long to
    function convertGeoCoordsToCartesianAndCenter(coordsArray) {
      const R = 6371000; // Earth's radius in meters
      const referenceLat = coordsArray[0][1];
      const referenceLon = coordsArray[0][0];
      let cartesianCoords = [];
    
      let sumX = 0, sumY = 0;
      coordsArray.forEach(coords => {
        const lon = coords[0];
        const lat = coords[1];
        let x = (lon - referenceLon) * Math.cos((lat + referenceLat) / 2) * Math.PI / 180;
        let y = (lat - referenceLat) * Math.PI / 180;
        x *= R; // Adjust for Earth's radius
        y *= R; // Adjust for Earth's radius
        sumX += x;
        sumY += y;
        cartesianCoords.push({x, y});
      });
    
      const centerX = sumX / coordsArray.length;
      const centerY = sumY / coordsArray.length;
    
      // Adjust points relative to the center
      const adjustedCoords = cartesianCoords.map(coord => ({
        x: coord.x - centerX,
        y: coord.y - centerY
      }));
    
      const centerPoint = [centerX, centerY];
    
      // Return both the adjusted coordinates and the center point
      return {
        cartesianCoords: adjustedCoords,
        centerPoint: centerPoint
      };
    }
    
    // Example usage
    const nestedArray = [
      [10.148099218397029, 53.52241676074994],
      [10.14806121618159, 53.522398181914966],
      [10.14802116055648, 53.52238120397994],
      [10.147979242236701, 53.52236590691296],
      [10.147935657749702, 53.52235236253623],
      [10.14791081595036, 53.522347031370764],
      [10.147885426828418, 53.522342713140596],
      [10.147859604068831, 53.52233942832787]
    ];
    
    const result = convertGeoCoordsToCartesianAndCenter(nestedArray);

    console.log("Testing GeoCoord to Cartesian Coords conversion, with testarray:");
    console.log(nestedArray);

    console.log('Cartesian Coordinates:', result.cartesianCoords);
    console.log('Center Point:', result.centerPoint);

    //cartesian coorrds end

    function mapCartesianToVertices(cartesianCoordsArray, zHeight) {
      return cartesianCoordsArray.map(coord => ({
        x: coord.x,
        y: coord.y,
        z: zHeight // Use the provided z-height for all vertices
      }));
    }

    function placePolygon(polygonPoints, centerPoint) {
      const polygonEntity = document.createElement("a-entity");

      const vertices = mapCartesianToVertices(polygonPoints, 0);
      console.log(vertices);
      verticesJSON = JSON.stringify(vertices);
      console.log(verticesJSON);

      polygonEntity.setAttribute('gps-new-entity-place', {
        latitude: centerPoint[1],
        longitude: centerPoint[0]
      });
      polygonEntity.setAttribute('custom-polygon', {
        //vertices: [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0.5, y: 1, z: 0}]
        //vertices: vertices
        vertices: verticesJSON
      });

      document.querySelector("a-scene").appendChild(polygonEntity);
    }

    //Testing
    placePolygon(result.cartesianCoords,result.centerPoint);

    