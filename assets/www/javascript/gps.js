// variables
var gpsTimeoutVal = 60000;
var lastPosition;

// Alias function
function cl(message) {
	console.log(message);
}

// Kick In Quest code
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
    navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError, {enableHighAccuracy: true, timeout: gpsTimeoutVal, maximumAge: 0 });
}

/**
 * onGPSSuccess receives a Position object
 */
function onGPSSuccess(position) {
//	var message = 'Latitude: '             + position.coords.latitude              + '<br />' +
//                  'Longitude: '          + position.coords.longitude             + '<br />' +
//                  'Altitude: '           + position.coords.altitude              + '<br />' +
//                  'Accuracy: '           + position.coords.accuracy              + '<br />' +
//                  'Altitude Accuracy: '  + position.coords.altitudeAccuracy      + '<br />' +
//                  'Heading: '            + position.coords.heading               + '<br />' +
//                  'Speed: '              + position.coords.speed                 + '<br />' +
//                  'Timestamp: '          + position.timestamp          			 + '<br />';
	// TODO write position to log
    lastPosition = position;
}

/**
 * onGPSError Callback receives a PositionError object
 */
function onGPSError(error) {
	// TODO: write error to log file as well
	// TODO: remove this alert, for debugging purposes only
	alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}

function getDistance(lat1, lon1, lat2, lon2) {
	var R = 6371; // km
	var dLat = toRad(lat2-lat1);
	var dLon = toRad(lon2-lon1);
	var lat1 = toRad(lat1);
	var lat2 = toRad(lat2);

	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c;
	
	return d;
}

function toRad(degrees){
    return degrees * Math.PI / 180;
}