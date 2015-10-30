/*
*   @site           Super Snooper
*   @function       Helper Functions
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper:true*/


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Helper = function() {
    //Search Terms are always held here as lots of different modules need access to them (lazy, but it works)
    this.searchTerms = {};

    //Base URL
    this.urls = {};
    this.urls.base = (window.location.hostname.indexOf('localhost') !== -1) ? 'http://localhost:8080/Clubhouse/SuperSnooper/Development/app/' : 'http://www.supersnooper.io/';
    this.urls.API = this.urls.base + 'api/';

    //Vars
    this.DEBUG_MODE = (window.location.hostname.indexOf('localhost') !== -1 || window.location.href.indexOf('v2') !== -1) ? true : false;
    this.ONE_PAGE_ONLY = false;
};

//Constructor
SuperSnooper.Helper.constructor = SuperSnooper.Helper;


//--------------------------------------------------------------------------
// SAVE A SEARCH TO MAKE IT GLOBALLY AVAILABLE
//--------------------------------------------------------------------------
SuperSnooper.Helper.prototype.searchProcess = function(_terms) {
    //Calculate a few things to search
    _terms.tagMatch = (_terms.type === 'tag') ? _terms.search.split(',') : _terms.filters.split(',');
    _terms.userMatch = (_terms.type === 'tag') ? _terms.filters.split(',') : _terms.search.split(',');

    //SAve
    this.searchTerms = _terms;
};


//--------------------------------------------------------------------------
// PAD A STRING (MOVE TO A UTILITY CLASS)
//--------------------------------------------------------------------------
SuperSnooper.Helper.prototype.padString = function(_str, _pad, _length, _ignoreZero) {
    //Vars
    _str = _str + '';
    _pad = _pad || '0';
    _ignoreZero = _ignoreZero || true; //don't pad the string if it is zero
    _length = _length || 2;

    //Loop and pad
    if(_str !== '0' || !_ignoreZero) {
        while(_str.length < _length) {
            _str = _pad + _str;
        }
    }
    return _str;
};





