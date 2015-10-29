/*
*   @site           Super Snooper
*   @function       Init Function
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';


//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------
var SuperSnooper = SuperSnooper || {Templates:{}, Signals:{}, Modules:{}, Utilities:{}}; //init the main prototype
var app; //reference to our base class


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Init = function() {
    //Console Fix
    if(typeof console === 'undefined') { console = { log: function() {} }; }

    //Init
    this.application = new SuperSnooper.Site();
};

//Constructor
SuperSnooper.Init.constructor = SuperSnooper.Init;


//--------------------------------------------------------------------------
//  ON LOAD FUNCTION TO INITIALISE OUR MAIN CLASS
//--------------------------------------------------------------------------
$(function() {
    //Init the app
    app = new SuperSnooper.Init();
});