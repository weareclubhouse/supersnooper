/*
*   @site           SuperSnooper
*   @function       Site
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper,Handlebars:false console:true*/

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Site = function() {
	//OK
	console.log('____    __    ____  _______     ___      .______       _______   ______  __       __    __  .______    __    __    ______    __    __       _______. _______ ');
	console.log('\\   \\  /  \\  /   / |   ____|   /   \\     |   _  \\     |   ____| /      ||  |     |  |  |  | |   _  \\  |  |  |  |  /  __  \\  |  |  |  |     /       ||   ____|');
	console.log(' \\   \\/    \\/   /  |  |__     /  ^  \\    |  |_)  |    |  |__   |  ,----\'|  |     |  |  |  | |  |_)  | |  |__|  | |  |  |  | |  |  |  |    |   (----`|  |__');
	console.log('  \\            /   |   __|   /  /_\\  \\   |      /     |   __|  |  |     |  |     |  |  |  | |   _  <  |   __   | |  |  |  | |  |  |  |     \\   \\    |   __|');
	console.log('   \\    /\\    /    |  |____ /  _____  \\  |  |\\  \\----.|  |____ |  `----.|  `----.|  `--\'  | |  |_)  | |  |  |  | |  `--\'  | |  `--\'  | .----)   |   |  |____');
	console.log('    \\__/  \\__/     |_______/__/     \\__\\ | _| `._____||_______| \\______||_______| \\______/  |______/  |__|  |__|  \\______/   \\______/  |_______/    |_______|');
	console.log('---------------------------------------------------');
	console.log('Super Snooper: He\'s not coming back.');
	console.log('2015 WeAreClubhouse.com');
	console.log('---------------------------------------------------');
	console.log('• App Init ✓');

  	//Force to top on unload, to stop filthy autoscroll
	$(window).on('beforeunload', function() {
    	$(window).scrollTop(0);
  	});

    //Base URL
    SuperSnooper.baseURL = (window.location.hostname.indexOf('localhost') !== -1) ? 'http://localhost:8080/Clubhouse/SuperSnooper/Development/app/' : 'http://www.supersnooper.io/';

    //Vars
    SuperSnooper.DEBUG_MODE = (window.location.hostname.indexOf('localhost') !== -1) ? true : false;

  	//Compile our HANDLEBARS templates, do this first for any classes that use these
    SuperSnooper.templates = {};
    var _templates = $('script');
    for(var i=0;i<_templates.length;i++) {
        if($(_templates[i]).attr('id') && $(_templates[i]).attr('id').indexOf('-template') !== -1) {
            SuperSnooper.templates[$(_templates[i]).attr('id').split('-template').join('')] = Handlebars.compile($(_templates[i]).html());
        }
    }

    //API Manager (comes first as it mainly deals with events)
    SuperSnooper.api = new SuperSnooper.APIManager(SuperSnooper.baseURL + 'api/');

    //Managers (Display, Forms, Exporter)
    SuperSnooper.display = new SuperSnooper.DisplayManager();
    SuperSnooper.forms = new SuperSnooper.FormManager();
    SuperSnooper.exporter = new SuperSnooper.ExportManager(SuperSnooper.baseURL + 'api/');
};

//Definition
SuperSnooper.Site.constructor = SuperSnooper.Site;