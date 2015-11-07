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

    //Reveal
    $('body').addClass('loaded');

  	//Force to top on unload, to stop filthy autoscroll
	$(window).on('beforeunload', function() { $(window).scrollTop(0); });

    //Helper
    SuperSnooper.helper = new SuperSnooper.Helper();

  	//Compile our HANDLEBARS templates, do this first for any classes that use these
    this.processTemplates();

    //API Manager (comes first as it mainly deals with events)
    SuperSnooper.api = new SuperSnooper.Utilities.APIManager(SuperSnooper.helper.urls.API);

    //Image / Cache Manager
    SuperSnooper.images = new SuperSnooper.Utilities.ImageManager();

    //UI
    this.filters = new SuperSnooper.Modules.FilterManager();
    this.viewer = new SuperSnooper.Modules.ItemViewer();
    this.itemManager = new SuperSnooper.Modules.ItemManager();
    this.bar = new SuperSnooper.Modules.InfoBar(this.itemManager);
    this.lightbox = new SuperSnooper.Modules.LightBox();

    //Form manager is globally accessible, which seems kind of lazy??
    SuperSnooper.forms = new SuperSnooper.Modules.FormManager();

    //Exporter
    SuperSnooper.exporter = new SuperSnooper.Modules.ExportManager(SuperSnooper.helper.urls.API);

    //Preload a couple of SVGs to insert into our HTML
    SuperSnooper.eyes = new SuperSnooper.Modules.SnooperEyes();
};

//Definition
SuperSnooper.Site.constructor = SuperSnooper.Site;


//--------------------------------------------------------------------------
//  PROCESS OUR TEMPLATES
//--------------------------------------------------------------------------
SuperSnooper.Site.prototype.processTemplates = function() {
    SuperSnooper.templates = {};
    var _templates = $('script');
    for(var i=0;i<_templates.length;i++) {
        if($(_templates[i]).attr('id') && $(_templates[i]).attr('id').indexOf('-template') !== -1) {
            SuperSnooper.templates[$(_templates[i]).attr('id').split('-template').join('')] = Handlebars.compile($(_templates[i]).html());
        }
    }
};