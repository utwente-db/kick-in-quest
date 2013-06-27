var id = 0;
var data;

document.addEventListener('deviceready', loadInfo, false);

function loadInfo() {
	downloadPackage();
	
	// TODO get from SD card instead
	$.getJSON('json/info.json', startInfoScreen);
}

function startInfoScreen(receivedData) {
	data = receivedData;
	nextInfoItem();
}

function nextInfoItem() {
	id++;
	
	if (data[id] == undefined) {
		document.location = 'game.html';
	}
	
	loadInfoPage(data[id]['infoText'], nextInfoItem, data[id]['buttonText']);
}

function downloadPackage() {
	// TODO: check first if download is necessary
	// TODO: base local file name on team id for testing purposes
	
	// requires quest.js
	downloadFile(PACKAGE_FILE_PATH, LOCAL_PACKAGE_FILE_NAME);
	
	// TODO: unpack this file
}