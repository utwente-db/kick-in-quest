// variables
var gpsTimeoutVal = 60000;

// utility functions
//var alertWithoutLogging = alert;
//
//alert = function(message) {
//	alertWithoutLogging(message);
//	console.log(message);
//}

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
    var message = 'Position at ' + position.timestamp + ':\n' + 
    			  position.coords.latitude + ', ' + position.coords.longitude;
    
	alert(message);
}

/**
 * onGPSError Callback receives a PositionError object
 */
function onGPSError(error) {
	alert('code: '    + error.code    + '\n' +
          'message: ' + error.message + '\n');
}