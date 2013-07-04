/*
 * requires quest.js
 * requires file.js
 * requires zip.js
 */

var id = 0;
var data;

document.addEventListener('deviceready', loadInfo, false);
$(document).bind('game:loaded', initInfoScreen);

function loadInfo() {
// TODO: Bas is doing this
//	downloadPackage();
	
	// TODO trigger 'game:loaded' after unzipping instead of doing this here
	$(document).trigger('game:loaded');
}

function initInfoScreen() {
	$.get(KICK_IN_QUEST_HOME + '/json/info.json', startInfoScreen);
}

function startInfoScreen(receivedData) {
	data = JSON.parse(receivedData);
	nextInfoItem();
}

function nextInfoItem() {
	id++;
	
	if (typeof data[id] == 'undefined') {
		document.location = 'game.html?language=' + language + '&teamId=' + teamId;
		return;
	}
	
	loadInfoPage(data[id]['infoText'], nextInfoItem, data[id]['buttonText']);
}

function downloadPackage() {
	// TODO: check first if file has been downloaded and extracted already
	// TODO: base local file path on team id for testing purposes

	// TODO: Only necessary when using ZipJS. Remove?
	// zip.workerScriptsPath = "javascript/lib/";
	
	new ZipFile(PACKAGE_FILE_PATH, extractEntries);
//	downloadFile(PACKAGE_FILE_PATH, LOCAL_PACKAGE_FILE_NAME);
//	initFileSystem(extractQuestionPackage);
}

function extractEntries(zip) {
	console.log('about to extract entries');
	
	for (var i = 0; i < zip.entries.length; i++) {
        var entry = zip.entries[i];
    	console.log(entry.name);
    }
    
    console.log('done extracting entries');
    $(document).trigger('game:loaded');
}

function extractQuestionPackage() {
	extractZipFile(fileSystem, LOCAL_PACKAGE_FILE_NAME);
}