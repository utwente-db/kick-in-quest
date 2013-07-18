// Store GPS data to SD-Card
var zipFile = null;
var applicationDirectory = null;
var fileSystem = null;
var filesInZip = 0;
var extractedFiles = 0;

/*
 * INITIALIZE FILE SYSTEM - START
 */
function initFileSystem() {
	if (applicationDirectory != undefined) {
		console.warn("Attempting to initialize file system twice.");
		return;
	}
	
	window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, openFileSystem, failFS);
}

function openFileSystem(fileSystemParam) {
	fileSystem = fileSystemParam;
	openAppFileSystem();
}

function openAppFileSystem() {
	fileSystem.root.getDirectory(FILE_SYSTEM_HOME, {
			create : true,
			exclusive : false
		}, onGetAppDirectory, onGetDirectoryFail);
}

function onGetAppDirectory(directory) {
	applicationDirectory = directory;
	$(document).trigger('appDirectory:loaded');
}
/*
 * INITIALIZE FILE SYSTEM - END
 */


function createFileWriter(fileEntry, callbackFunction) {
	fileEntry.createWriter(callbackFunction, fail);
}

function failFS(evt) {
	alert("Opening file System failed with error " + evt.code);
}

function onGetDirectoryFail(evt) {
	alert("Creating directory failed with error " + evt.code);
}

// Upload GPS data to Server using HTTP POST
function uploadFile(sourceFileURI, serverURI, params, callBackFunction) {
    var options = new FileUploadOptions();
    
    options.fileKey = "data";
    options.fileName = sourceFileURI.substr(sourceFileURI.lastIndexOf('/') + 1); // only the filename
    options.mimeType = "text/plain";

    if (params == undefined) {
    	params = {};
    }
    
    options.params = params;
    
    var ft = new FileTransfer();
    ft.upload(sourceFileURI, encodeURI(serverURI), callBackFunction, onUploadFail, options);	
}

function onUploadOK(metadata) {
//	alert("Uploaded " + (Math.round(metadata.bytesSent / 102.4) / 10) + " MB");
	console.log("Code = " + metadata.responseCode);
	console.log("Response = " + metadata.response);
	console.log("Sent = " + metadata.bytesSent);
}

function onUploadFail(error) {
//	alert("An error has occurred: Code = " + error.code);
	console.log("upload error source " + error.source);
	console.log("upload error target " + error.target);
}

/*
 * DOWNLOAD FILE
 * Source: https://gist.github.com/nathanpc/2464060
 */
function downloadFile(downloadURI, destinationFileName, callBackFunction) {
	onFileSystemSuccess(downloadURI, destinationFileName, callBackFunction); // initialize the applicationDirectory for unzipping
}

function onFileSystemSuccess(downloadURI, destinationFileName, callBackFunction) {
	var fileTransfer = new FileTransfer();
	
	if (applicationDirectory == null) {
		alert("failed to create folder for application data on local storage.");
		return;
	}
	
	fileTransfer.download(downloadURI,
		applicationDirectory.fullPath + '/' + destinationFileName,
		function(file) { downloadSuccess(file, callBackFunction); },
		downloadError);
}

function downloadSuccess(theFile, callBackFunction)  {
	if (applicationDirectory != null) {
		openFileSystemRead(LOCAL_PACKAGE_FILE_NAME, callBackFunction);
	} else {
		alert("application directory was null");
	}
	
	console.log("download complete: " + theFile.toURI());
}

function openFileSystemRead(pathToFile, callBackFunction, asText) {
	if (asText == undefined) {
		asText = false;
	}
	
	applicationDirectory.getFile(pathToFile, {
		exclusive : false
	}, function(fileEntry) { readFileEntry(fileEntry, callBackFunction, asText); }, fail);
}

function readFileEntry(fileEntry, callBackFunction, asText) {
	fileEntry.file(function(file) { readFile(file, callBackFunction, asText); }, fail);
}

function readFile(file, callBackFunction, asText) {
	 var reader = new FileReader();
	 
	 reader.onload = callBackFunction;
	 
	 if (asText) {
		reader.readAsText(file); 
	 } else {
		reader.readAsDataURL(file);
	 }
}

function createZipFolders(callBackFunction) {
	 var foldersInZip = 0;
     for (filename in zipFile.files) {
         var options = zipFile.files[filename].options || {};
    	 if (options.dir)
    		 ++foldersInZip;
     }
     var createdFolders = 0;
     var onCreateDirectory = function(parent) {
    	 ++createdFolders;
    	 if (createdFolders >= foldersInZip) {
    		 writeZipFiles(callBackFunction);
    	 }
     }
     
     for (filename in zipFile.files) {
         var options = zipFile.files[filename].options || {};
    	 if (options.dir)
    		 applicationDirectory.getDirectory(filename, {create : true, exclusive : false}, onCreateDirectory, fail);
     }
}

function writeZipFiles(callBackFunction) {
	filesInZip = 0;
    for (filename in zipFile.files) {
        var options = zipFile.files[filename].options || {};
        if (!options.dir)
        	++filesInZip;
    }
    alert('fiz: ' + filesInZip);
    extractedFiles = 0;
    for (filename in zipFile.files) {
        var options = zipFile.files[filename].options || {};
	    
	    if (!options.dir) {
        	applicationDirectory.getFile(filename, 
        								 {create : true, exclusive : false}, 
        								 function(fileEntry) { 
        									 storeUnzippedFile(fileEntry, callBackFunction); 
        								 }, fail);
        }
    }
}

function storeUnzippedFile(fileEntry, callBackFunction) {
	alert('suff ' + fileEntry.fullPath);
	alert(fileEntry.toURL());
	fileEntry.createWriter(function(writer) { storeUnzippedFileWriter(writer, callBackFunction); }, fail);
}

function storeUnzippedFileWriter(writer, callBackFunction) {
	writer.onwriteend = function(evt) {
		++extractedFiles;
		alert('extracted so far: ' + extractedFiles);
		if (extractedFiles >= filesInZip) {
			alert('will call back now');
			callBackFunction();
			// Now delete the ZIP file (this is only here to save the SD-card's space, so there is more available for the coordinates).
			applicationDirectory.getFile(LOCAL_PACKAGE_FILE_NAME, {
				exclusive : false
			}, function(fileEntry) { fileEntry.remove(null, fail); }, fail);
		}
	}
	var fileName = writer.fileName.substring(writer.fileName.indexOf(FILE_SYSTEM_HOME) + FILE_SYSTEM_HOME.length + 1);
	var data = zipFile.files[fileName].data;
    alert('writing ' + fileName);
	if (fileName.indexOf('.jpg') > 0 || fileName.indexOf('.jpeg') > 0) // binary, jpeg
		data = "data:image/jpeg;base64," + JSZipBase64.encode(data);
	else if (fileName.indexOf('.png') > 0) // binary, png
		data = "data:image/png;base64," + JSZipBase64.encode(data);
	writer.write(data);
	alert('done');
}

function downloadError(error) {
	console.log("download error source " + error.source);
	console.log("download error target " + error.target);
	console.log("upload error code: " + error.code);
}

function fail(evt) {
	console.log(evt.target.error.code);
}

/*
 * END OF DOWNLOAD FILE
 */

function fileExists(path, fileExistsCallback, fileDoesNotExistCallback) {
    applicationDirectory.getFile(path, { create: false }, fileExistsCallback, fileDoesNotExistCallback);
}