window.onload = () => {
    console.log("loaded script.");

    let downloaded = false;

    let radius = 0.001;  // radius around current position to set bounding box size
    let maxCount = 100;  // max feature count to call and track (performance reasons)

    const el = document.querySelector("[gps-new-camera]");

    el.addEventListener("gps-camera-update-position", async(e) => {
        if(!downloaded) {
            const west = e.detail.position.longitude - radius,
                  east = e.detail.position.longitude + radius,
                  south = e.detail.position.latitude - radius;
                  north = e.detail.position.latitude + radius;
            console.log(`${west} ${south} ${east} ${north}`);
            console.log("current Position: ");
            console.log(e.detail.position);
            
            // testing with straße feinkartierung
            // ask url = `https://api.hamburg.de/datasets/v1/feinkartierung_strasse/collections/strassenflaechen/items?bbox=${west},${south},${east},${north}`
            
            const response = await fetch(`https://api.hamburg.de/datasets/v1/feinkartierung_strasse/collections/strassenflaechen/items?bbox=${west},${south},${east},${north}&limit=${maxCount}`);
            const pois = await response.json();
            console.log("Straßenflächennutzung in surroundings: ");
            console.log(pois);
            
            pois.features.forEach ( feature => {

                console.log("found feature!");
                const compoundEntity = document.createElement("a-entity");

                let featureNutzung = feature.properties.nutzung;

                let featureVerticeCoords = [];
                if (feature.geometry.type == "Polygon") {
                    featureVerticeCoords = convertGeoCoordsAndFindCenterCorrected(feature.geometry.coordinates[0]);
                    console.log(featureVerticeCoords);
                    console.log(featureVerticeCoords.centerPoint);
                } else {
                    console.log(feature.geometry.type);
                }


                compoundEntity.setAttribute('gps-new-entity-place', {
                    latitude: featureVerticeCoords.centerPoint[1],
                    longitude: featureVerticeCoords.centerPoint[0]
                });


                //const polygonEntity = createPolygon(featureVerticeCoords.cartesianCoords,featureVerticeCoords.centerPoint);
                const polygonEntity = createPolygon(featureVerticeCoords.cartesianCoords,[0,0]);    //dont take real centerPoint coords; origin gets applied to parent entity, not the child vertice data
                console.log(polygonEntity);

                // Change color according to featureNutzung (returns hex string); BUT if no valid hex, polygon is invisible!!
                try { polygonEntity.setAttribute('material', { color: setFeatureColor(featureNutzung) } ); }
                catch(error) {
                    console.log(error);
                }
                
               /*
                try { polygonEntity.setAttribute('material', { color: 'blue' } ); }
                catch(error) {
                    console.log(error);
                }
                */

                polygonEntity.setAttribute("rotation", {x: -90, y:0, z:0});

                console.log(polygonEntity);

                compoundEntity.appendChild(polygonEntity);



                const box = document.createElement("a-box");
                box.setAttribute("scale", {
                    x: 2,
                    y: 2,
                    z: 2
                });
                box.setAttribute('material', { color: setFeatureColor(featureNutzung) } );
                box.setAttribute("position", {
                    x : 0,
                    y : 6,
                    z: 0
                } );
                const text = document.createElement("a-text");
                const textScale = 10;
                text.setAttribute("look-at", "[gps-new-camera]");
                text.setAttribute("scale", {
                    x: textScale,
                    y: textScale,
                    z: textScale
                });
                text.setAttribute("value", featureNutzung);
                text.setAttribute("align", "center");

                const text_strasse = document.createElement("a-text");
                text_strasse.setAttribute("look-at", "[gps-new-camera]");
                text_strasse.setAttribute("scale", {
                    x: textScale/2,
                    y: textScale/2,
                    z: textScale/2
                });
                text_strasse.setAttribute("position", {
                    x : 0,
                    y : -1.5,
                    z: 0
                } );
                text_strasse.setAttribute("value", feature.properties.strassenname);
                text_strasse.setAttribute("align", "center");

                compoundEntity.appendChild(box);
                compoundEntity.appendChild(text);
                compoundEntity.appendChild(text_strasse);
                document.querySelector("a-scene").appendChild(compoundEntity);
            });
            document.querySelector(".detail").innerHTML = "API call successful, AR features added!"
        }
        downloaded = true;
    });
};




// FUNCTIONS 


function convertGeoCoordsAndFindCenterCorrected(coords) {
    const R = 6371000; // Earth's radius in meters
    let sumX = 0, sumY = 0, sumLon = 0, sumLat = 0;
    let cartesianCoords = [];
  
    // Calculate reference latitude and longitude as the average of all points
    coords.forEach(coord => {
      sumLon += coord[0];
      sumLat += coord[1];
    });
    const referenceLon = sumLon / coords.length;
    const referenceLat = sumLat / coords.length;
  
    // Convert to Cartesian coordinates
    coords.forEach(([lon, lat]) => {
      let x = (lon - referenceLon) * Math.cos((lat + referenceLat) / 2 * Math.PI / 180);
      let y = (lat - referenceLat);
      x *= R * Math.PI / 180; // Adjust for Earth's radius and convert degrees to radians
      y *= R * Math.PI / 180; // Adjust for Earth's radius and convert degrees to radians
      cartesianCoords.push({x, y});
    });
  
    // Calculate center point in Cartesian coordinates
    let centerX = 0, centerY = 0;
    cartesianCoords.forEach(coord => {
      centerX += coord.x;
      centerY += coord.y;
    });
    centerX /= cartesianCoords.length;
    centerY /= cartesianCoords.length;
  
    // Adjust points relative to the center
    cartesianCoords = cartesianCoords.map(coord => ({
      x: coord.x - centerX,
      y: coord.y - centerY
    }));
  
    // Calculate center point in geographic coordinates
    const centerPoint = [referenceLon, referenceLat];
  
    return {cartesianCoords, centerPoint};
  }

  


function mapCartesianToVertices(cartesianCoordsArray, zHeight) {
    
    //wrong axes
    
    return cartesianCoordsArray.map(coord => ({
      x: coord.x,   // right
      y: coord.y,   // up
      z: zHeight    // towards viewer (Use the provided z-height for all vertices)
    }));
    
    
    /*
    return cartesianCoordsArray.map(coord => ({
        x: coord.x, // right
        y: zHeight, // up (Use the provided z-height for all vertices)
        z: coord.y  // towards viewer (swap axes for correct axes orientation)
      }));
      */
  }
  
  function placePosMarker(posLongLat) {
    const posMarker = document.createElement("a-entity");
    posMarker.setAttribute('gps-new-entity-place', {
                      latitude: posLongLat[1]+0.01,
                      longitude: posLongLat[0]+0.01
                  });
                  const box = document.createElement("a-box");
                  box.setAttribute("scale", {
                      x: 1,
                      y: 1,
                      z: 1
                  });
                  box.setAttribute('material', { color: 'blue' } );
                  box.setAttribute("position", {
                      x : 0,
                      y : 20,
                      z: 0
                  } );
                  
                  posMarker.appendChild(box);
                  document.querySelector("a-scene").appendChild(posMarker);
                  console.log("placed posMarker at "+posLongLat);
  }
  
  
  function createPolygon(polygonPoints, centerPoint) {
    const polygonEntity = document.createElement("a-entity");
    const vertices = mapCartesianToVertices(polygonPoints, -3);     // set z-Height to -1 for testing instead of 0
    console.log(vertices);
    //verticesJSON = JSON.stringify(vertices);
    //console.log(verticesJSON);
    try {
      polygonEntity.setAttribute('gps-new-entity-place', {
        latitude: centerPoint[1],
        longitude: centerPoint[0]
      });
    } catch(error) {
      console.log("Error while trying to add centerPoint:")
      console.error(error);
    }
    try {
      polygonEntity.setAttribute('custom-polygon', {
        //vertices: [{x: 0, y: 0, z: 0}, {x: 1, y: 0, z: 0}, {x: 0.5, y: 1, z: 0}]
        //vertices: vertices
        vertices: vertices
      });
    } catch (error) {
      console.log("Error while trying to add polygon vertices:")
      console.error(error);
    }
    
    //console.log(polygonEntity);
    return polygonEntity;
    //document.querySelector("a-scene").appendChild(polygonEntity);
    //console.log("placed polygon at "+centerPoint);
  }
  
  

  function setFeatureColor(featureType) {
    switch (featureType) {
        case "Grünfläche": 
            return "#00711d";
            //return "green";
            break;
        case "Parkplatz":
            return "#006771";
            //return "lightblue";
            break;
        case "Gehweg":
            return "#345326";
            //return "darkgreen";
            break;
        case "Fahrbahn":
            return "#d4c14e";
            //return "yellow";
            break;
        default:
            return "red";
            //return "red";
    }
  }
  
  //Testing
  //placePolygon(result.cartesianCoords,result.centerPoint);
  //placePolygon(result.cartesianCoords, [10.049541015187984,53.56545329223668]);
  //placePolygon(cartesianCoords,centerPoint);
  //placePosMarker([10.049541015187984,53.56545329223668]);
  