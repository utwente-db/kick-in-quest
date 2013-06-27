// variables
var gpsTimeoutVal = 60000;
var lastPosition;
var appSDFolder = "KickInQuest";
var gpsFileName = "gpsdata.txt";
var watchID = null;
var gpsOn = false;

// Kick In Quest code
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
	startGPSTracking();
	
	// requires file.js
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, openFileSystem, failFS);
}

function startGPSTracking() {
    watchID = navigator.geolocation.watchPosition(onGPSSuccess, onGPSError, {enableHighAccuracy: true, timeout: gpsTimeoutVal, maximumAge: 0 });
}

function endGPSTracking() {
	navigator.geolocation.clearWatch(watchID);
}

/**
 * onGPSSuccess receives a Position object
 */
function onGPSSuccess(position) {
	gpsOn = true;
	lastPosition = position;
	// TODO: (optional) enable the buttons, allow answering the question
	if (fileWriter != null) {
		message = "" + position.coords.latitude + "," + position.coords.longitude + "," + position.coords.altitude + "," + position.coords.accuracy
		+ "," + position.coords.altitudeAccuracy + "," + position.coords.heading + "," + position.coords.speed + "," + position.timestamp + "\n";          		
		fileWriter.write(message);
	} else {
		alert("Readonly SD-card or file.js not loaded;\nPosition at " + position.timestamp + ":\n" + position.coords.latitude + ", " + position.coords.longitude);
	}
}

/**
 * onGPSError Callback receives a PositionError object
 */
function onGPSError(error) {
	// TODO: write error to log file as well
	// TODO: remove this alert, for debugging purposes only
	// alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
	gpsOn = false;
	// TODO: (optional) disable the buttons, make the page wait till the GPS signal is back 
}

function isGpsOn() {
	return gpsOn;
}

function getDistance(lat1, lon1, lat2, lon2) {
	var R = 6371; // radius of the earth in km
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