var fileWriter = null;

function openFileSystem(fileSystem) {
	fileSystem.root.getDirectory(appSDFolder, {
		create : true,
		exclusive : false
	}, onGetDirectorySuccess, onGetDirectoryFail);
}

function onGetDirectorySuccess(directory) {
	directory.getFile(gpsFileName, {
		create : true,
		exclusive : false
	}, createFile, failFE);
}

function createFile(fileEntry) {
	fileEntry.createWriter(createFileWriter, failW);
}

function createFileWriter(writer) {
	/*
	 * writer.onwriteend = function(evt) { alert("success writing file"); };
	 */
	fileWriter = writer;
	fileWriter.write("Latitude,Longitude,Altitude,Accuracy,Altitude Accuracy,Heading,Speed,Timestamp\n");
}

function failFS(evt) {
	alert("Opening file System failed with error " + evt.code);
	// alert(evt.code);
	// alert(evt.message);
	// alert(evt.target.error.code);
	// console.log(evt.target.error.code);
}

function failFE(evt) {
	alert("Opening file for writing failed with error " + evt.code);
}

function failW(evt) {
	alert("Creating FileWriter failed with error " + evt.code);
}

function onGetDirectoryFail(evt) {
	alert("Creating directory failed with error " + evt.code);
}


/*
 * DOWNLOAD FILE
 * Source: https://gist.github.com/nathanpc/2464060
 */
function downloadFile(downloadURI, destinationFileName) {
	window.requestFileSystem(
					LocalFileSystem.PERSISTENT,
					0, function(fileSystem) { onFileSystemSuccess(fileSystem, downloadURI, destinationFileName); }, fail);
}

function onFileSystemSuccess(fileSystem, downloadURI, destinationFileName) {
	fileSystem.root.getFile("dummy.html", { create : true, exclusive : false }, function(fileEntry) { gotFileEntry(fileEntry, downloadURI, destinationFileName); }, fail);
}

function gotFileEntry(fileEntry, downloadURI, destinationFileName) {
	var sPath = fileEntry.fullPath.replace("dummy.html", "");
	var fileTransfer = new FileTransfer();
	
	fileEntry.remove();
	fileTransfer.download(downloadURI,
					sPath + destinationFileName,
					downloadSuccess,
					downloadError);
}

function downloadSuccess(theFile)  {
	console.log("download complete: " + theFile.toURI());
	showLink(theFile.toURI());
}

function downloadError(error) {
	console.log("download error source " + error.source);
	console.log("download error target " + error.target);
	console.log("upload error code: " + error.code);
}

function showLink(url) {
	alert(url);
	var divEl = document.getElementById("ready");
	var aElem = document.createElement("a");
	aElem.setAttribute("target", "_blank");
	aElem.setAttribute("href", url);
	aElem.appendChild(document.createTextNode("Ready! Click To Open."))
	divEl.appendChild(aElem);
}

function fail(evt) {
	console.log(evt.target.error.code);
}

/*
 * END OF DOWNLOAD FILE
 */