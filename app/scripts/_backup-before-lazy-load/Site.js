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
/*global SuperSnooper,Handlebars,alert:false console:true*/

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

	//Utilities (deals with platform and window management, audio etc.)
	//SuperSnooper.utilities = new SuperSnooper.Utilities(false, false);


  	//Force to top on unload, to stop filthy autoscroll
	$(window).on('beforeunload', function() {
    	$(window).scrollTop(0);
  	});

  	//Compile our HANDLEBARS templates
    SuperSnooper.templates = {};
    var _templates = $('script');
    for(var i=0;i<_templates.length;i++) {
        if($(_templates[i]).attr('id') && $(_templates[i]).attr('id').indexOf('-template') !== -1) {
            SuperSnooper.templates[$(_templates[i]).attr('id').split('-template').join('')] = Handlebars.compile($(_templates[i]).html());
        }
    }

    //API Manager
    var _apiURL = (window.location.hostname.indexOf('localhost') !== -1) ? 'http://localhost:8080/Clubhouse/SuperSnooper/Development/app/api/' : 'http://clients.weareclubhouse.com/projects/supersnooper/api/';
    SuperSnooper.api = new SuperSnooper.APIManager(_apiURL);

    //Wire the submit button in
    $('.button.search').on('click', function(e) {
        this.searchInit();
        e.preventDefault();
    }.bind(this));


    //Search
    /*
    SuperSnooper.api.initSearch([
    	//{type:'tag', search:'france', filterType:'', filters:'', keywords:'green,vert|red,rouge'}, //black,noir|red,rouge
        {type:'tag', search:'supercolor', filterType:'user', filters:'adidasHK', keywords:'Yellow|Red|Orange|Blue|Light Blue|Dark Blue|Green|Light Green|Dark Green|Black|Purple|Pink|Light Pink|Turquoise|Gold|Brown', days:1}, //
        //{type:'user', search:'dan_coppock', filterType:'', filters:'', keywords:'', days:7},
    	//{type:'user', search:'nickmulley', filterType:'', filters:'', keywords:''},
        //{type:'tag', search:'adidaswomen', filterType:'', filters:'', keywords:''},
    ]);*/

};

//Definition
SuperSnooper.Site.constructor = SuperSnooper.Site;


//--------------------------------------------------------------------------
//  INIT A SEARCH
//--------------------------------------------------------------------------
SuperSnooper.Site.prototype.searchInit = function() {
    //Get the values
    var _users = $('input#users').val();
    var _tags = $('input#tags').val();
    var _error = '';
    var _searches = [];

    //Sanitize everything
    _users = _users.split('@').join('').toLowerCase();
    _tags = _tags.split('#').join('').toLowerCase();

    //Check
    if(_tags === '' && _users === '') {
        //Error
        _error = 'Please enter at least one search term.';
    } else {

    }

    //Done
    if(_error !== '') {
        //Show the ERROR
        alert(_error);
    } else {
        //GO!!!
        if(_tags !== '') {
            //TAG search
            console.log('TAG BASED SEARCH!');
            _searches.push({type:'tag', search:_tags, filterType:(_users !== '') ? 'user' : '', filters:_users, keywords:''}); //green,vert|red,rouge
        } else {
            //USER search (should really do each user as a individiaul search...)
            console.log('USER BASED SEARCH!');
            _searches.push({type:'user', search:_users, filterType:(_tags !== '') ? 'tag' : '', filters:_tags, keywords:''});
        }

        //Search!
        SuperSnooper.api.initSearch(_searches);
    }
};