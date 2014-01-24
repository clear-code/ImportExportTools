var prefs = Components.classes["@mozilla.org/preferences-service;1"]
   .getService(Components.interfaces.nsIPrefBranch);

function setComplexPref(prefname,value) {
	var str = Components.classes["@mozilla.org/supports-string;1"]
		.createInstance(Components.interfaces.nsISupportsString);
	str.data = value;
	prefs.setComplexValue(prefname, Components.interfaces.nsISupportsString, str);
}

function initMboxImportPanel()  {
 	document.getElementById("MBoverwrite").checked = prefs.getBoolPref("mboximport.export.overwrite");
	document.getElementById("MBasciiname").checked = prefs.getBoolPref("mboximport.export.filenames_toascii");
	document.getElementById("MBconfrimimport").checked = prefs.getBoolPref("mboximport.confirm.before_mbox_import");
	document.getElementById("MBhtmlasdisplayed").checked = prefs.getBoolPref("mboximport.export.HTML_as_displayed");
	document.getElementById("MBcliptextplain").checked = prefs.getBoolPref("mboximport.clipboard.always_just_text");
	document.getElementById("MBsubmaxlen").value = prefs.getIntPref("mboximport.subject.max_length");
	document.getElementById("MBauthmaxlen").value = prefs.getIntPref("mboximport.author.max_length");
	document.getElementById("MBrecmaxlen").value = prefs.getIntPref("mboximport.recipients.max_length");
	document.getElementById("setTimestamp").checked = prefs.getBoolPref("mboximport.export.set_filetime");
	document.getElementById("addtimeCheckbox").checked = prefs.getBoolPref("mboximport.export.filenames_addtime");
	document.getElementById("buildMSF").checked = prefs.getBoolPref("mboximport.import.build_mbox_index"); 
	document.getElementById("addNumber").checked = prefs.getBoolPref("mboximport.import.name_add_number"); 
	
	if (prefs.getIntPref("mboximport.exportEML.filename_format") == 2)
	 	document.getElementById("customizeFilenames").checked = true;
	else
		document.getElementById("customizeFilenames").checked = false;
	
	if (prefs.getPrefType("mboximport.exportMBOX.dir") > 0)
		document.getElementById("export_mbox_dir").value = prefs.getComplexValue("mboximport.exportMBOX.dir",Components.interfaces.nsISupportsString).data;
	if (prefs.getBoolPref("mboximport.exportMBOX.use_dir")) {
		document.getElementById("use_export_mbox_dir").checked = true;
		document.getElementById("export_mbox_dir").removeAttribute("disabled");
		document.getElementById("export_mbox_dir").nextSibling.removeAttribute("disabled");
	}
	else {
		document.getElementById("use_export_mbox_dir").checked = false;
		document.getElementById("export_mbox_dir").setAttribute("disabled", "true");
		document.getElementById("export_mbox_dir").nextSibling.setAttribute("disabled", "true");
	}
	
	if (prefs.getPrefType("mboximport.exportEML.dir") > 0)
		document.getElementById("export_eml_dir").value = prefs.getComplexValue("mboximport.exportEML.dir",Components.interfaces.nsISupportsString).data;
	if (prefs.getBoolPref("mboximport.exportEML.use_dir")) {
		document.getElementById("use_export_eml_dir").checked = true;
		document.getElementById("export_eml_dir").removeAttribute("disabled");
		document.getElementById("export_eml_dir").nextSibling.removeAttribute("disabled");
	}
	else {
		document.getElementById("use_export_eml_dir").checked = false;
		document.getElementById("export_eml_dir").setAttribute("disabled", "true");
		document.getElementById("export_eml_dir").nextSibling.setAttribute("disabled", "true");
	}
	
	if (prefs.getPrefType("mboximport.exportMSG.dir") > 0)
		document.getElementById("export_msgs_dir").value =prefs.getComplexValue("mboximport.exportMSG.dir",Components.interfaces.nsISupportsString).data;
	if (prefs.getBoolPref("mboximport.exportMSG.use_dir")) {
		document.getElementById("use_export_msgs_dir").checked = true;
		document.getElementById("export_msgs_dir").removeAttribute("disabled");
		document.getElementById("export_msgs_dir").nextSibling.removeAttribute("disabled");
	}
	else {
		document.getElementById("use_export_msgs_dir").checked = false;
		document.getElementById("export_msgs_dir").setAttribute("disabled", "true");
		document.getElementById("export_msgs_dir").nextSibling.setAttribute("disabled", "true");
	}

	if (prefs.getPrefType("mboximport.export.filename_pattern") > 0) {
		var pattern = prefs.getCharPref("mboximport.export.filename_pattern");
		var patternParts = pattern.split("-");
	
		for (var i=0;i<3;i++) {
			var list = document.getElementById("part"+ (i+1).toString());
			var popup = list.firstChild;
			switch(patternParts[i]) {
				case "%d" : list.selectedItem = popup.childNodes[1];
						break;
				case "%k" :  list.selectedItem = popup.childNodes[2];
						break;
				case "%n" : list.selectedItem = popup.childNodes[3];
						break;
				case "%a" : list.selectedItem = popup.childNodes[4];
						break;
				case "%r" : list.selectedItem = popup.childNodes[5];
						break;
				case "%e" : list.selectedItem = popup.childNodes[6];
						break;
				default :  list.selectedItem = popup.childNodes[0];
			}
		}	
	}
	
	document.getElementById("addPrefix").checked = prefs.getBoolPref("mboximport.export.filename_add_prefix");
	try {
		document.getElementById("prefixText").value = prefs.getComplexValue("mboximport.export.filename_prefix",Components.interfaces.nsISupportsString).data;
	}
	catch(e) {}

	document.getElementById("cutSub").checked = prefs.getBoolPref("mboximport.export.cut_subject"); 
	document.getElementById("cutFN").checked = prefs.getBoolPref("mboximport.export.cut_filename"); 
	customNamesCheck(document.getElementById("customizeFilenames"));
	try  {
		var charset = prefs.getCharPref("mboximport.export.filename_charset");
		var textCharset = prefs.getCharPref("mboximport.export.text_plain_charset");
	}
	catch(e) {
		var charset = "";
		var textCharset = "";
	}
	document.getElementById("filenameCharset").value = charset;
	document.getElementById("textCharset").value = textCharset;
	
	document.getElementById("skipMsg").checked = prefs.getBoolPref("mboximport.export.skip_existing_msg"); 
	if (prefs.getBoolPref("mboximport.export.use_container_folder")) {
		document.getElementById("indexSetting").selectedIndex = 0;
		document.getElementById("skipMsg").disabled = true;
	}
	else 
		document.getElementById("indexSetting").selectedIndex = 1;

	// Backup section
	var freq = 	prefs.getIntPref("mboximport.autobackup.frequency");
	switch(freq) {
		case 1 :  document.getElementById("frequencyList"). selectedIndex = 0;
			document.getElementById("backupEnable").checked = true;	
			break;
		case 3 :  document.getElementById("frequencyList"). selectedIndex = 1;
			document.getElementById("backupEnable").checked = true;	
			break;
		case 7 :  document.getElementById("frequencyList"). selectedIndex = 2;
			document.getElementById("backupEnable").checked = true;	
			break;
		case 15 :  document.getElementById("frequencyList"). selectedIndex = 3;
			document.getElementById("backupEnable").checked = true;	
			break;
		case 30 :  document.getElementById("frequencyList"). selectedIndex = 4;
			document.getElementById("backupEnable").checked = true;	
			break;
		default :  document.getElementById("backupEnable").checked = false;
			document.getElementById("frequencyList").disabled = true;
	}

	try {
		document.getElementById("backupDir").value = prefs.getComplexValue("mboximport.autobackup.dir",Components.interfaces.nsISupportsString).data;
		document.getElementById("backupCustomName").value = prefs.getComplexValue("mboximport.autobackup.dir_custom_name",Components.interfaces.nsISupportsString).data;
	}
	catch(e) {}
	
	document.getElementById("backupType").selectedIndex = prefs.getIntPref("mboximport.autobackup.type");
	var dir  = prefs.getIntPref("mboximport.autobackup.dir_name_type");
	document.getElementById("backupDirName").selectedIndex = dir;
	document.getElementById("backupType").selectedIndex = prefs.getIntPref("mboximport.autobackup.type");
	document.getElementById("saveMode").selectedIndex = prefs.getIntPref("mboximport.autobackup.save_mode");

	var last = prefs.getIntPref("mboximport.autobackup.last")*1000;
	if (last > 0) {
		var time = new Date(last);
		var localTime = time.toLocaleString();
		document.getElementById("backupLast").value = localTime;
	}
	document.getElementById("modalWin").checked = prefs.getBoolPref("mboximport.autobackup.use_modal_dialog"); 
}

/*function setSaveMode(type) {
	var saveMode = prefs.getIntPref("mboximport.autobackup.save_mode");
	if (saveMode == 0 || (saveMode == 2 && type ==0))
		document.getElementById("saveMode").selectedIndex = 0;
	else
		document.getElementById("saveMode").selectedIndex = 1;
}  

function toggleType(el) {
	setSaveMode(el.selectedIndex);
}*/

function saveMboxImportPrefs()   {
	prefs.setBoolPref("mboximport.export.overwrite", document.getElementById("MBoverwrite").checked);
	prefs.setBoolPref("mboximport.export.filenames_toascii", document.getElementById("MBasciiname").checked);
	prefs.setBoolPref("mboximport.confirm.before_mbox_import", document.getElementById("MBconfrimimport").checked);
	prefs.setBoolPref("mboximport.export.HTML_as_displayed", document.getElementById("MBhtmlasdisplayed").checked);
	prefs.setBoolPref("mboximport.clipboard.always_just_text", document.getElementById("MBcliptextplain").checked);
	prefs.setIntPref("mboximport.subject.max_length", document.getElementById("MBsubmaxlen").value);
	prefs.setIntPref("mboximport.author.max_length", document.getElementById("MBauthmaxlen").value);
	prefs.setIntPref("mboximport.recipients.max_length", document.getElementById("MBrecmaxlen").value);
	prefs.setBoolPref("mboximport.export.set_filetime", document.getElementById("setTimestamp").checked);
	prefs.setBoolPref("mboximport.export.filenames_addtime", document.getElementById("addtimeCheckbox").checked);
	prefs.setBoolPref("mboximport.import.build_mbox_index",document.getElementById("buildMSF").checked);
	prefs.setBoolPref("mboximport.import.name_add_number", document.getElementById("addNumber").checked);

	if (document.getElementById("customizeFilenames").checked)
		prefs.setIntPref("mboximport.exportEML.filename_format", 2);
	else
		prefs.setIntPref("mboximport.exportEML.filename_format", 0);
	
	prefs.setBoolPref("mboximport.exportMBOX.use_dir", document.getElementById("use_export_mbox_dir").checked);
	if (document.getElementById("export_mbox_dir").value != "") 
		setComplexPref("mboximport.exportMBOX.dir", document.getElementById("export_mbox_dir").value);
	else
		prefs.deleteBranch("mboximport.exportMBOX.dir");
		
	prefs.setBoolPref("mboximport.exportEML.use_dir", document.getElementById("use_export_eml_dir").checked);
	if (document.getElementById("export_eml_dir").value != "")
		setComplexPref("mboximport.exportEML.dir", document.getElementById("export_eml_dir").value);
	else
		prefs.deleteBranch("mboximport.exportEML.dir");
	
	prefs.setBoolPref("mboximport.exportMSG.use_dir", document.getElementById("use_export_msgs_dir").checked);
	if (document.getElementById("export_msgs_dir").value != "") 
		setComplexPref("mboximport.exportMSG.dir", document.getElementById("export_msgs_dir").value);
	else
		prefs.deleteBranch("mboximport.exportMSG.dir");

	var pattern = "";
	for (u=1;u<4;u++) {
		var val = document.getElementById("part"+u.toString()).selectedItem.value;
		if (u>1 && val)
			val = "-"+val;
		pattern += val;
	}
	prefs.setCharPref("mboximport.export.filename_pattern", pattern);
	prefs.setBoolPref("mboximport.export.filename_add_prefix", document.getElementById("addPrefix").checked);
	if (document.getElementById("prefixText").value != "")
		setComplexPref("mboximport.export.filename_prefix", document.getElementById("prefixText").value);
	prefs.setBoolPref("mboximport.export.cut_subject", document.getElementById("cutSub").checked);
	prefs.setBoolPref("mboximport.export.cut_filename", document.getElementById("cutFN").checked);
	prefs.setCharPref("mboximport.export.filename_charset", document.getElementById("filenameCharset").value);
	prefs.setCharPref("mboximport.export.text_plain_charset", document.getElementById("textCharset").value);

	if (document.getElementById("indexSetting").selectedIndex == 0)
		prefs.setBoolPref("mboximport.export.use_container_folder", true);
	else
		prefs.setBoolPref("mboximport.export.use_container_folder", false);

	// Backup section
	if (! document.getElementById("backupEnable").checked)
		prefs.setIntPref("mboximport.autobackup.frequency", 0);
	else
		prefs.setIntPref("mboximport.autobackup.frequency", document.getElementById("frequencyList").selectedItem.value);
	if (document.getElementById("backupDir").value)
		setComplexPref("mboximport.autobackup.dir", document.getElementById("backupDir").value);
	else
		prefs.deleteBranch("mboximport.autobackup.dir");
	prefs.setIntPref("mboximport.autobackup.dir_name_type", document.getElementById("backupDirName").selectedIndex);
	if (document.getElementById("backupCustomName").value)
		setComplexPref("mboximport.autobackup.dir_custom_name", document.getElementById("backupCustomName").value);
	else
		prefs.deleteBranch("mboximport.autobackup.dir_custom_name");
	prefs.setBoolPref("mboximport.export.skip_existing_msg", document.getElementById("skipMsg").checked);
	prefs.setBoolPref("mboximport.autobackup.use_modal_dialog", document.getElementById("modalWin").checked);
	prefs.setIntPref("mboximport.autobackup.type", document.getElementById("backupType").selectedIndex);
	prefs.setIntPref("mboximport.autobackup.save_mode", document.getElementById("saveMode").selectedIndex);
}

function customNamesCheck(el) {
	if (! el.checked) {
		document.getElementById("addtimeCheckbox").setAttribute("disabled", "true");
		document.getElementById("part1").setAttribute("disabled", "true");
		document.getElementById("part2").setAttribute("disabled", "true");
		document.getElementById("part3").setAttribute("disabled", "true");
		document.getElementById("addPrefix").setAttribute("disabled", "true");
		document.getElementById("prefixText").setAttribute("disabled", "true");
	}
	else {
		document.getElementById("addtimeCheckbox").removeAttribute("disabled");
		document.getElementById("part1").removeAttribute("disabled");
		document.getElementById("part2").removeAttribute("disabled");
		document.getElementById("part3").removeAttribute("disabled");
		document.getElementById("addPrefix").removeAttribute("disabled");
		document.getElementById("prefixText").removeAttribute("disabled");
	}
}
	
function toggleDirCheck(el) {
	if (! el.checked) {
		el.nextSibling.setAttribute("disabled", "true");
		el.nextSibling.nextSibling.setAttribute("disabled", "true");
	}
	else {
		el.nextSibling.removeAttribute("disabled");
		el.nextSibling.nextSibling.removeAttribute("disabled");
	}
}

function toggleBackup(el) {
	document.getElementById("frequencyList").disabled = ! el.checked;
}

function toggleSkipMsg(el) {
	document.getElementById("skipMsg").disabled = (el.selectedIndex == 0);
}
	
function pickFile(el) {
	var nsIFilePicker = Components.interfaces.nsIFilePicker;
	var fp = Components.classes["@mozilla.org/filepicker;1"]
		.createInstance(nsIFilePicker);
	fp.init(window, "", nsIFilePicker.modeGetFolder);
	var res = fp.show();
 	if (res == nsIFilePicker.returnOK) {
		var box = el.previousSibling;
		box.value = fp.file.path;
	}
}
