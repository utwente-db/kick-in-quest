// variables
var gpsTimeoutVal = 6000;
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
	alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n');
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

