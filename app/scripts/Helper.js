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
    if((window.location.href.indexOf('v2') !== -1)) { this.urls.base += 'v2/'; }
    this.urls.API = this.urls.base + 'api/';

    //Vars
    this.DEBUG_MODE = (window.location.hostname.indexOf('localhost') !== -1) ? true : false;
    this.ONE_PAGE_ONLY = (window.location.hostname.indexOf('localhost') !== -1) ? false : false;
    this.ISOTOPE_ENABLED = true;
};

//Constructor
SuperSnooper.Helper.constructor = SuperSnooper.Helper;


//--------------------------------------------------------------------------
// SAVE A SEARCH TO MAKE IT GLOBALLY AVAILABLE
//--------------------------------------------------------------------------
SuperSnooper.Helper.prototype.searchProcess = function(_terms) {
    //Calculate a TAG match and a USER match array so we can show colours in item text - not needed?
    //_terms.tagMatch = (_terms.type === 'tag') ? _terms.search.split(',') : _terms.filters.split(',');
    //_terms.userMatch = (_terms.type === 'tag') ? _terms.filters.split(',') : _terms.search.split(',');

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
    _ignoreZero = (_ignoreZero === undefined) ? false : _ignoreZero; //don't pad the string if it is zero
    _length = _length || 2;

    //Loop and pad
    if(_str !== '0' || !_ignoreZero) {
        while(_str.length < _length) {
            _str = _pad + _str;
        }
    }
    return _str;
};


//--------------------------------------------------------------------------
// KEYWORD VALIDATION (USED FOR DEEPER CHECKS ON IF A KEYWORD IS VALID, ItemView.js and APIManager.js)
//--------------------------------------------------------------------------
SuperSnooper.Helper.prototype.keywordValidate = function (_word, _foundIndex, _text) {
    //Flag
    var _valid = false;

    //1. Has to be first character OR have a non-alphanumeric character (that is not a # or @) in front of it
    //2. Has to have nothing (i.e. end of the text block) OR have any non-alphanumeric character after it
    var _preCharacter = (_foundIndex === 0) ? '' : _text.substr(_foundIndex - 1, 1);
    var _postCharacter = (_foundIndex + _word.length >= _text.length) ? '' : _text.substr(_foundIndex + _word.length, 1);
    if((_preCharacter === '' || _preCharacter.search(/[^a-zA-Z#@]+/) !== -1) && (_postCharacter === '' || _postCharacter.search(/[^a-zA-Z]+/) !== -1)) {
        _valid = true;
    }

    //Return the result
    return _valid;
};


//--------------------------------------------------------------------------
// GENERATE A GUID (USED FOR RESULT CACHING)
//--------------------------------------------------------------------------
SuperSnooper.Helper.prototype.guid = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + s4() + s4();
};