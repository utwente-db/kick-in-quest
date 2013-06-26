var id = 0;
var data;

function loadInfo() {
	// TODO download package in the mean time
	$.getJSON('json/info.json', startInfoScreen);
}

function startInfoScreen(receivedData) {
	data = receivedData;
	nextInfoItem();
}

function nextInfoItem() {
	console.log('whelp');

	id++;
	
	if (data[id] == undefined) {
		document.location = 'game.html';
	}
	
	loadInfoPage(data[id]['infoText'], nextInfoItem, data[id]['buttonText']);
}

$(document).ready(loadInfo);