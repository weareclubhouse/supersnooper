/*
*   @site           SuperSnooper
*   @function       Export Manager
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper:false console:true*/

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Modules.ExportManager = function(_url) {
    //Store the URL
    this.url = _url;

    //Put an event on the 'export data' button
    $('#button-data-export').on('click', function() {
        this.exportInit();
    }.bind(this));
};

//Definition
SuperSnooper.Modules.ExportManager.constructor = SuperSnooper.Modules.ExportManager;


//--------------------------------------------------------------------------
//  EXPORT INIT
//--------------------------------------------------------------------------
SuperSnooper.Modules.ExportManager.prototype.exportInit = function() {
    //Load
    document.location.href = this.url + 'data-export.php?cacheID=' + SuperSnooper.api.searchTerms.searchID;
};