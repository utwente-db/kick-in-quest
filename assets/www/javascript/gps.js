// variables
var gpsTimeoutVal = 60000;
var watchID = null;
var fileWriter = null;

// Alias function
function cl(message) {
	console.log(message);
}

// Kick In Quest code
document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
	startGPSTracking();
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
	if (fileWriter != null) {
		message = "" + position.coords.latitude + "," + position.coords.longitude + "," + position.coords.altitude + "," + position.coords.accuracy
		+ "," + position.coords.altitudeAccuracy + "," + position.coords.heading + "," + position.coords.speed + "," + position.timestamp + "\n";          		
		fileWriter.write(message);
	} else
		alert("Readonly SD-card;\nPosition at " + position.timestamp + ":\n" + position.coords.latitude + ", " + position.coords.longitude);
}

/**
 * onGPSError Callback receives a PositionError object
 */
function onGPSError(error) {
	// TODO: write error to log file as well
	// TODO: remove this alert, for debugging purposes only
	alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
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

function openFileSystem(fileSystem) {
	fileSystem.root.getDirectory("KickInQuest", {create: true, exclusive: false}, onGetDirectorySuccess, onGetDirectoryFail);
}

function onGetDirectorySuccess(directory) {
	directory.getFile("gpsdata.txt", {create: true, exclusive: false}, createFile, failFE);
}

function createFile(fileEntry) {
	fileEntry.createWriter(createFileWriter, failW);
}

function createFileWriter(writer) {
	/*
    writer.onwriteend = function(evt) {
    	alert("success writing file");
    };
    */
	fileWriter = writer;
	fileWriter.write("Latitude,Longitude,Altitude,Accuracy,Altitude Accuracy,Heading,Speed,Timestamp\n");
}

function failFS(evt) {
	alert("Opening file System failed with error " + evt.code);
	//alert(evt.code);
	//alert(evt.message);
	//alert(evt.target.error.code);
	//console.log(evt.target.error.code);
}

function failFE(evt) {
	alert("Opening file for writing failed with error " + evt.code);
	// alert(evt.target.error.code);
	//console.log(evt.target.error.code);
}

function failW(evt) {
	alert("Creating FileWriter failed with error " + evt.code);
	//alert(evt.target.error.code);
	//console.log(evt.target.error.code);
}

function onGetDirectoryFail(evt) {
	alert("Creating directory failed with error " + evt.code);
}
