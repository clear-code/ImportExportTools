var IETprintPDFengine = {
	prefs : Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch),
	
	exit : function() {
		if (opener.IETprintPDFmain.total  > 0) 
			opener.IETprintPDFmain.print2();
		else {			
			if (IETprintPDFengine.prefs.getBoolPref("extensions.importexporttools.printPDF.restore_print_silent"))
				IETprintPDFengine.prefs.setBoolPref("print.always_print_silent", false);	
			IETprintPDFengine.prefs.setBoolPref("extensions.importexporttools.printPDF.start", false);
			opener.document.getElementById("IETabortIcon").collapsed = true;
		}
	},

	onLoad : function() {
		PrintEngineCreateGlobals();
		InitPrintEngineWindow();
		var PSSVC = Components.classes["@mozilla.org/gfx/printsettings-service;1"]
			.getService(Components.interfaces.nsIPrintSettingsService);
		var myPrintSettings = PSSVC.newPrintSettings;
		myPrintSettings.printSilent = true;
		myPrintSettings.toFileName  = opener.IETprintPDFmain.filePath;
		myPrintSettings.printToFile = true;
		myPrintSettings.outputFormat = Components.interfaces.nsIPrintSettings.kOutputFormatPDF;
		printEngine.startPrintOperation(myPrintSettings);
	}
};


if (IETprintPDFengine.prefs.getBoolPref("extensions.importexporttools.printPDF.start")) {
	OnLoadPrintEngine = IETprintPDFengine.onLoad;
	IETprintPDFengine.prefs.setBoolPref("extensions.importexporttools.printPDF.start", false);
}		

window.addEventListener("unload", IETprintPDFengine.exit, false);

