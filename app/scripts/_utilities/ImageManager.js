/*
*   @site           SuperSnooper
*   @function       IMage Manager
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper,signals*/

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Utilities.ImageManager = function() {
    //Cache list based on the URL
    this.cache = {};

    //Signal for image events
    SuperSnooper.Signals.images = new signals.Signal();
};

//Definition
SuperSnooper.Utilities.ImageManager.constructor = SuperSnooper.Utilities.ImageManager;


//--------------------------------------------------------------------------
//  INIT SEARCH
//--------------------------------------------------------------------------
SuperSnooper.Utilities.ImageManager.prototype.load = function(_src) {
    //Image to load
    var _img = new Image();
    this.cache[_src] = {loaded:false, image: _img};

    //On Load
    _img.onload = function(_src) {
        //Set the flag
        this.cache[_src].loaded = true;

        //Dispatch an event
        SuperSnooper.Signals.images.dispatch('loaded', {image:this.cache[_src].image});
    }.bind(this, _src);

    // Use the following callback methods to debug
    // in case of an unexpected behavior.
    _img.onerror = function () {
        console.log('LOAD FILA!');
        //this.imageLoadResult('error', _img, _imageType);
    }.bind(this);
    _img.onabort = function () {}.bind(this);
    _img.src = _src; //trigger the load
};


//--------------------------------------------------------------------------
//  GET A STATUS ON AN IMAGE (LOADING, LOADED, NONE)
//--------------------------------------------------------------------------
SuperSnooper.Utilities.ImageManager.prototype.status = function(_src) {
    return (this.cache[_src] === undefined) ? 'none' : (this.cache[_src].loaded) ? 'loaded' : 'loading';
};