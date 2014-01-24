var gBackupPrefBranch = Components.classes["@mozilla.org/preferences-service;1"]
	.getService(Components.interfaces.nsIPrefBranch);

var autoBackup = {

	onOK : function() {
		setTimeout(autoBackup.start, 500);
		document.getElementById("start").removeAttribute("collapsed");
		document.getElementById("go").collapsed = true;
		document.documentElement.getButton("accept").disabled = true;
		autoBackup.time = window.arguments[1];
		autoBackup.now = window.arguments[2];
		// saveMode values:
		// 0 = save all; 1 = save just if new; 
		// 2 = save just if new with custom name, save all with unique name
		autoBackup.saveMode = gBackupPrefBranch.getIntPref("mboximport.autobackup.save_mode");
		autoBackup.type = gBackupPrefBranch.getIntPref("mboximport.autobackup.type");
		return false;
	},

	load : function() {
		var os = navigator.platform.toLowerCase();
		if (os.indexOf("mac") > -1)
			document.getElementById("macWarn").removeAttribute("collapsed");
		var label = document.getElementById("last").textContent;
		autoBackup.last = window.arguments[0];
		if (autoBackup.last > 0) {
			var last = autoBackup.last  * 1000;
			var time = new Date(last);
			var localTime = time.toLocaleString();
			document.getElementById("last").textContent = label.replace("$t", localTime);
		}
		else
			document.getElementById("last").textContent = label.replace("$t", "");
	},
	
	getDir : function() {
		try {
			var dir = gBackupPrefBranch.getCharPref("mboximport.autobackup.dir");
			var file = Components.classes["@mozilla.org/file/local;1"]
				.createInstance(Components.interfaces.nsILocalFile); 
			file.initWithPath(dir); 
			if (! file.exists() || ! file.isDirectory())
				file = null;
		}
		catch(e) {
			var file = null;
		}
		if (! file) {
			var nsIFilePicker = Components.interfaces.nsIFilePicker;
			var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
			var strbundle = document.getElementById("strings");
			fp.init(window, strbundle.getString("fpTitle"), nsIFilePicker.modeGetFolder);
			var res=fp.show();
			if (res==nsIFilePicker.returnOK) 
				file = fp.file;
			else
				return null;
			// opener.autoBackup.filePicker = true;
			autoBackup.filePicker = true;
		}
		return file;
	},

	writeLog : function(data,append) {
		var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
			.createInstance(Components.interfaces.nsIFileOutputStream);
		if (append)
			foStream.init(autoBackup.logFile, 0x02 | 0x08 | 0x10, 0664, 0); 
		else
			foStream.init(autoBackup.logFile, 0x02 | 0x08 | 0x20, 0666, 0);
		foStream.write(data,data.length);
		foStream.close();
	},

	start : function() {
		// "dir" è la directory di destinazione del backup, quella scelta dall'utente
		var dir = autoBackup.getDir();
		if (! dir)
			return;
		var strbundle = document.getElementById("backupStr");
		if (! dir.exists() || ! dir.isWritable) {
			alert(strbundle.getString("noBackup"));
			window.close();
			return;
		}
		var nameType = gBackupPrefBranch.getIntPref("mboximport.autobackup.dir_name_type");
		if (nameType == 1) {
			try {
				var dirName = gBackupPrefBranch.getCharPref("mboximport.autobackup.dir_custom_name");
			}
			catch(e) {
				var dirName = null;
			}
		}
		else
			var dirName = null;
		
		autoBackup.IETmaxRunTime = gBackupPrefBranch.getIntPref("dom.max_chrome_script_run_time");
		IETrunTimeDisable();	
		try {
			var offlineManager = Components.classes["@mozilla.org/messenger/offline-manager;1"]                 
        	                .getService(Components.interfaces.nsIMsgOfflineManager);
			offlineManager.synchronizeForOffline(false, false, false, true, msgWindow);
		}
		catch(e) {} 

		var clone = dir.clone();
		autoBackup.profDir = Components.classes["@mozilla.org/file/directory_service;1"]
	           .getService(Components.interfaces.nsIProperties)
        	   .get("ProfD", Components.interfaces.nsIFile);
		
		if (dirName && ! autoBackup.filePicker) {
			clone.append(dirName);
			if (! clone.exists())
				clone.create(1,0755);
		}
		else {		
			var date = buildContainerDirName();
			clone.append(autoBackup.profDir.leafName+"-"+date);
			clone.createUnique(1,0755);
			autoBackup.unique = true;
		}
	
		// A questo punto "clone" è la directory contenitore del backup		
			
		var str = "Backup date: "+autoBackup.now.toLocaleString()+"\r\n\r\n"+"Saved files:\r\n";
		autoBackup.logFile = clone.clone();
		autoBackup.logFile.append("Backup.log");
		autoBackup.writeLog(str,false);
		
		var oldLogFile = clone.clone();
		oldLogFile.append("BackupTime.txt");
		if (oldLogFile.exists())
			oldLogFile.remove(false);

		autoBackup.array1 = [];
		autoBackup.array2 = [];

		autoBackup.scanExternal(clone);

		if (autoBackup.type == 1) { // just mail
			var profDirMail = autoBackup.profDir.clone();
			profDirMail.append("Mail");	
			autoBackup.scanDir(profDirMail,clone,autoBackup.profDir);
			profDirMail  = autoBackup.profDir.clone();
			profDirMail.append("ImapMail");
			if (profDirMail.exists())
				autoBackup.scanDir(profDirMail,clone,autoBackup.profDir);
		}	
		else 
			autoBackup.scanDir(autoBackup.profDir, clone, autoBackup.profDir);
		autoBackup.write(0);
	},

	end : function(sec) {
		if (sec == 0)
			window.close();
		else
			window.setTimeout(autoBackup.end,1000,sec-1);
	},

	save : function(entry,destDir,root) {
		if ((autoBackup.unique && autoBackup.saveMode !=1) || autoBackup.saveMode ==0)
			var force = true;
		else
			var force = false;
		var lmt = entry.lastModifiedTime / 1000;
		if (force || lmt > autoBackup.last) {
			var entrypath = entry.parent.path;
			var filepath = destDir.path;
			// Qui si vede se il file da salvare già esiste nella directory di destinazione
			// Se esiste viene cancellato, per rimpiazzarlo con la versione più nuova che è stata trovata
			var newpath = entrypath.replace(root.path,filepath);
			var LF = Components.classes["@mozilla.org/file/local;1"]
				.createInstance(Components.interfaces.nsILocalFile);
			LF.initWithPath(newpath);
			var LFclone = LF.clone();
			LFclone.append(entry.leafName);
			if (LFclone.exists())
				LFclone.remove(false);	
			try {
				autoBackup.array1.push(entry);
				autoBackup.array2.push(LF);
			}
			catch(e)  {}
		}
	},

	// dirToScan è la directory da esaminare per vedere quali file vanno copiati
	// destDir è la directory in cui i file verranno salvati per il backup
	// root è il file "radice" dei file da salvare --> è la directory del profilo oppure la directory esterna dell'account
	scanDir : function(dirToScan,destDir,root) {
		var entries = dirToScan.directoryEntries;
		while(entries.hasMoreElements()) {
			var entry = entries.getNext();	
			entry.QueryInterface(Components.interfaces.nsIFile);
			if (entry.exists()) {
				if (entry.leafName != "lock" && entry.leafName != "parent.lock" && entry.leafName != ".parentlock") {
					if (entry.isDirectory())
						autoBackup.scanDir(entry,destDir,root);
					else 
						autoBackup.save(entry,destDir,root);
				}
			}
			else {
				var error = "\r\n***Error - non-existent file: "+entry.path+"\r\n";
				autoBackup.writeLog(error,true);
			}
		}
	},

	write : function(index) {
		try {
			autoBackup.array1[index].copyTo(autoBackup.array2[index], "");
			var logline = autoBackup.array1[index].path + "\r\n";
			autoBackup.writeLog(logline,true);
		}
		catch(e) {
			if (autoBackup.array1[index]) 
				var error = "\r\n***Error with file "+ autoBackup.array1[index].path + "\r\nError Type: "+e+"\r\n\r\n";
			else
				var error = "\r\n***Error Type: "+e+"\r\n\r\n";
			autoBackup.writeLog(error,true);
		}
		index++;
		if (autoBackup.array1.length > index) {
			var c = index / autoBackup.array1.length * 100;
			document.getElementById("pm").value = parseInt(c);
			window.setTimeout(autoBackup.write,50,index);		
		}
		else {
			document.getElementById("pm").value = 100;
			gBackupPrefBranch.setIntPref("mboximport.autobackup.last", autoBackup.time);
			IETrunTimeEnable(autoBackup.IETmaxRunTime);
			document.getElementById("start").collapsed = true;
			document.getElementById("done").removeAttribute("collapsed");
			autoBackup.end(2);
		}
	},

	scanExternal : function(destDir) {
		var file = destDir.clone();
		file.append("ExternalMailFolders");
		if (! file.exists())
			file.create(1,0775);
		var servers = Components.classes["@mozilla.org/messenger/account-manager;1"]
			.getService(Components.interfaces.nsIMsgAccountManager).allServers;
		if (servers.Count)
			var cntServers = servers.Count();
		else 
			// Thunderbird >17 return nsIArray
			var cntServers = servers.length;
		// Scan servers storage path on disk
		for (var i = 0; i < cntServers; ++i) {
			var parentDir = null;
			if (servers.Count)
				var serverFile = servers.GetElementAt(i).QueryInterface(Components.interfaces.nsIMsgIncomingServer).localPath;
			else
				var serverFile = servers.queryElementAt(i, Components.interfaces.nsIMsgIncomingServer).localPath;
			if (serverFile.parent && serverFile.parent.parent)
				parentDir = serverFile.parent.parent;
			var clone = file.clone();
			clone.append(serverFile.leafName);
			// Ora "clone" ha questo path --> <directory backup>/ExternalMailFolder/<nome della directory root usata dall'account
			if (! parentDir || ! autoBackup.profDir.equals(parentDir)) 	
				autoBackup.scanDir(serverFile,clone,serverFile);
		}
	}
};




