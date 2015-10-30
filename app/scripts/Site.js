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
	$(window).on('beforeunload', function() { $(window).scrollTop(0); });

    //Helper
    SuperSnooper.helper = new SuperSnooper.Helper();

  	//Compile our HANDLEBARS templates, do this first for any classes that use these
    this.processTemplates();

    //API Manager (comes first as it mainly deals with events)
    SuperSnooper.api = new SuperSnooper.Utilities.APIManager(SuperSnooper.helper.urls.API);

     //Listen for API signals
    SuperSnooper.Signals.api.add(this.apiMonitor = function(_method, _vars) { this.apiEvent(_method, _vars); }.bind(this));

    //UI
    this.viewer = new SuperSnooper.Modules.ItemViewer();
    this.itemManager = new SuperSnooper.Modules.ItemManager();
    this.bar = new SuperSnooper.Modules.InfoBar(this.itemManager);
    this.lightbox = new SuperSnooper.Modules.LightBox();

    //Form manager is globally accessible, which seems kind of lazy??
    SuperSnooper.forms = new SuperSnooper.Modules.FormManager();

    //Exporter
    SuperSnooper.exporter = new SuperSnooper.Modules.ExportManager(SuperSnooper.helper.urls.API);
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


//--------------------------------------------------------------------------
//  API EVENT
//--------------------------------------------------------------------------
SuperSnooper.Site.prototype.apiEvent = function(_method, _vars) {
    if(_method === 'search-init') {
        //SEARCH init

        //Store the search terms for reference when displaying the items
        SuperSnooper.helper.searchProcess(_vars.searchTerms);

        //Reset the item manager
        this.itemManager.reset();

        //Init the search bar
        this.bar.init();

        //SEARCH started, so show the loader
        $('.loader').removeClass('hidden');
    } else if(_method === 'search-start') {

        //THIS IS CALLED EVERYTIME SOME NEW DATA IS FETCHED
    } else if(_method === 'items-add') {
        //NEW ITEMS

        //Add to the item manager
        this.itemManager.addGroup(_vars.items);

        //Update the search panel with our new text!
        this.bar.update(_vars);
    } else if(_method === 'state-set') {
        //STATE set
        if(_vars.state === 'go') {
            //GO
            $('.header__search__info__button').html('PAUSE');
            $('.loader').removeClass('hidden');
        } else if(_vars.state === 'pause') {
            //PAUSED
            $('.header__search__info__button').html('RESUME');
            $('.loader').addClass('hidden');
        } else if(_vars.state === 'stop') {
            //STOPPED
            $('.header__search__info__button').html('DONE').addClass('hidden');
            $('.loader').addClass('hidden');
        }
    }
};