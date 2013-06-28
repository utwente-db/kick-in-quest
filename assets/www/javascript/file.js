// Store GPS data to SD-Card

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
	if (fileWriter.length == 0)
		fileWriter.write("Latitude,Longitude,Altitude,Accuracy,Altitude Accuracy,Heading,Speed,Timestamp\n");
	else
		fileWriter.seek(fileWriter.length);
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

// Upload GPS data to Server using HTTP POST
// TODO: test this on a real server!
// TODO: check if we want to automatically have sourceFileURI be something like /sdcard/appSDFolder/gpsFileName

function uploadFile(sourceFileURI, serverURI) {
    var options = new FileUploadOptions();
    options.fileKey="file";
    options.fileName=sourceFileURI.substr(sourceFileURI.lastIndexOf('/') + 1); // only the filename
    options.mimeType="text/plain";
    var params = {};
    options.params = params;
    var ft = new FileTransfer();
    ft.upload(sourceFileURI, encodeURI(serverURI), onUploadOK, onUploadFail, options);	
}

function onUploadOK(metadata) {
	alert("Uploaded " + (Math.round(metadata.bytesSent / 102.4) / 10) + " MB");
	console.log("Code = " + metadata.responseCode);
	console.log("Response = " + metadata.response);
	console.log("Sent = " + metadata.bytesSent);
}

function onUploadFail(error) {
	alert("An error has occurred: Code = " + error.code);
	console.log("upload error source " + error.source);
	console.log("upload error target " + error.target);
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