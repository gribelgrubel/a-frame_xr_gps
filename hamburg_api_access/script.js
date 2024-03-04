// https://api.hamburg.de/datasets/v1/versickerung/api?f=html
/* testing, see https://api.hamburg.de/datasets/v1/versickerung/api?f=html and chatgpt */

//these work, see https://api.hamburg.de/datasets/v1/versickerung/ for details and usage instructions
//let apiURL = "https://api.hamburg.de/datasets/v1/versickerung/"
//let apiData = "/collections/versickerungspotential/items"

//tests mit Straßenflächennutzung
let apiURL = "https://api.hamburg.de/datasets/v1/feinkartierung_strasse/";
let apiData = "/collections/strassenflaechen/items";

let statusElem = document.getElementById("call-status");

function makeApiCall() {
    console.log("fetching from: "+apiURL+apiData+".");

    fetch(""+apiURL+apiData, {
        
    method: 'GET', // or 'POST' if required
    headers: {
        'Content-Type': 'application/json',
        // Include authentication headers if necessary
        // 'Authorization': 'Bearer YOUR_API_KEY_OR_TOKEN'
        'Authorization': 'fe_test_fetch',   // custom value set at https://api.hamburg.de/datasets/v1/versickerung/api?f=html, get authroiazation
    }
    })
    .then(response => {
    if (response.ok) {
        return response.json(); // This returns a promise
    }
    throw new Error('Network response was not ok.');
    })
    .then(data => {
    console.log(data); // Here you can handle the JSON data
    statusElem.innerHTML = "Abfrage klappt, see console for details!"
    })
    .catch(error => {
    console.error('There was a problem with your fetch operation:', error);
    statusElem.innerHTML = "Error, see console for details"
    });
}


