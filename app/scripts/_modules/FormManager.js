/*
*   @site           SuperSnooper
*   @function       Form Manager
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper,alert:true*/

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager = function() {
    //Tag Max
    this.tagMax = 3;

    //Allowed Keys
    this.allowedKeys = [];
    this.allowedKeys.push(65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98); //a-z
    this.allowedKeys.push(48, 49, 50, 51, 52, 53, 54, 55, 56, 57); //numbers
    this.allowedKeys.push(188, 8, 13, 16, 17, 32, 189, 9); //comma, backspace, retur, ctrl, shift, space, dash/underscore, tab
    this.allowedKeys.push(37, 39); //cursors, oops

    //Capture the onsubmit event and override it
    $('#search-form').on('submit', function(e){
        this.searchInit();
        e.preventDefault();
        return false;
    }.bind(this));

    //Loop through the input items
    this.inputInit();

    //Options!
    this.inputOptionsInit();

    //Dummy Search Trigger
    if(SuperSnooper.helper.DEBUG_MODE) {
        $('#search-names').text('gregfindon');
        $('#search-tags').text('');
        $('#search-keywords').text('');
        //this.inputOptionSelect('options-names', 1, 'mentions');
        this.searchInit();
    }

    //Animation frame to keep the 'options-tags' anchored in the right place
    this.monitorTagOptions = false;
};

//Definition
SuperSnooper.Modules.FormManager.constructor = SuperSnooper.Modules.FormManager;



//--------------------------------------------------------------------------
//  CHEK THE POSITION OF THE TAG OPTIONS
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.checkTagOptionsPosition = function() {
    if(this.monitorTagOptions) {
        //Position it
        $('#options-tags').css({'left': $('#search-tags').position().left - 33});

        //Again
        requestAnimationFrame(function() { this.checkTagOptionsPosition(); }.bind(this));
    }
};

//--------------------------------------------------------------------------
//  INPUT OPTIONS
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.inputOptionsInit = function() {
    //Groups
    this.optionGroups = {};
    var _groups = $('.search-form__optionset');
    var _options;
    var _value;
    var _valueID;
    for(var i = 0; i < _groups.length; i++) {
        //Options for this item
        _options = $(_groups[i]).find('.search-form__option');
        _value = '';
        _valueID = -1;

        //Attach a click event to each option
        for(var j = 0; j < _options.length; j++) {
            //Click event
            $(_options[j]).on('click', function(_parentID, _item, _itemValue) {
                this.inputOptionSelect(_parentID, _item, _itemValue);
            }.bind(this, $(_groups[i]).attr('id'), j, $(_options[j]).attr('data-id')));

            //Selected?
            if($(_options[j]).hasClass('search-form__option--selected')) {
                _value = $(_options[j]).attr('data-id');
                _valueID = j;
            }
        }

        //Save the group
        this.optionGroups[$(_groups[i]).attr('id')] = {items:_options, value:_value, valueID:_valueID};
    }

};


//--------------------------------------------------------------------------
//  INPUT OPTIONS
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.inputOptionSelect = function(_parentID, _itemID, _itemValue) {
    //Loop through the items and select the appropriate one
    for(var i = 0; i < this.optionGroups[_parentID].items.length; i++) {
        if(i === _itemID) {
            $(this.optionGroups[_parentID].items[i]).addClass('search-form__option--selected');
        } else {
            $(this.optionGroups[_parentID].items[i]).removeClass('search-form__option--selected');
        }
    }

    //Set the value
    this.optionGroups[_parentID].value = _itemValue;
    this.optionGroups[_parentID].valueID = _itemID;

};





//--------------------------------------------------------------------------
//  INPUT FIELDS INIT
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.inputInit = function() {
    //List
    this.inputItems = $('.search-form__column__input');

    //Loop through
    var _item;
    for(var i = 0; i < this.inputItems.length; i++) {
        //Item
        _item = $(this.inputItems[i]);

        //Unfocus (this will setup the default value)
        this.inputItemFocus(_item, false);

        //Key down event
        _item.on('keydown', function(_item, _event) { this.inputKeyDown(_item, _event); }.bind(this, _item));
        _item.on('keyup', function(_item, _event) { this.inputKeyUp(_item, _event); }.bind(this, _item));


        //On Blur / Focus events
        _item.on('blur', function(_itemBlur) { this.inputItemFocus(_itemBlur, false); }.bind(this, _item));
        _item.on('focus', function(_itemFocus) { this.inputItemFocus(_itemFocus, true); }.bind(this, _item));
        //_item.on('click', function(_itemFocus) { this.inputItemFocus(_itemFocus, true); }.bind(this, _item));
    }

    //Document event to kill the options if the user is clicking outside - not really required now
    $(window).on('click', function(_event) {
        if(!$(_event.target).hasClass('search-form__option') && !$(_event.target).hasClass('search-form__column__input')) {
            this.manageOptions(''); //close options
        }
    }.bind(this));
};


//--------------------------------------------------------------------------
//  KEY DOWN
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.inputKeyDown = function(_item, _event) {
    //Only allow certain keys through
    if(this.allowedKeys.indexOf(_event.keyCode) === -1) {
        console.log('BLOCKED KEY:' + _event.keyCode);
        _event.preventDefault();
    } else if(_event.keyCode === 13) {
        //ENTER - prevent anything happening here
        _event.preventDefault();
    } else if(_event.keyCode === 188 && _item.attr('id') === 'search-tags') {
        //TAGS, only allow a certain amount of comma inputs
        var _tags = _item.text().split(',');
        if(_tags.length >=  this.tagMax) {
            _event.preventDefault();
        }
    }

    //Do a little delayed check to remove any line breaks or tabs that might have been pasted in
    setTimeout(function() {
        this.inputTextCheck(_item);
    }.bind(this), 10);
};


//--------------------------------------------------------------------------
//  KEY UP
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.inputKeyUp = function(_item, _event) {
    //Text check for stuff we don't want
    this.inputTextCheck(_item);

    //Submit?
    if(_event.keyCode === 13) {
        this.searchInit();
        _event.preventDefault();
    }
};


//--------------------------------------------------------------------------
//  STRIP BACK THE INPUT
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.inputTextCheck = function(_item) {
    //Strip needless content
    if(_item.html().indexOf('<div>') !== -1) {
        _item.html(_item.text());
    }

    //If this is the 'tags' then check if we should now show the options
    this.manageOptions(_item.attr('id').substr(7));

};


//--------------------------------------------------------------------------
//  FOCUS / BLUR OF INPUT
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.inputItemFocus = function(_item, _focus) {
    //Act
    if(!_focus) {
        //Scroll reset
        _item.scrollLeft(0);

        //If the value is blank, then reset it to the default value
        if(_item.html() === '' || _item.html() === _item.attr('data-default')) {
            //Reset to the default value
            _item.html(_item.attr('data-default'));
            _item.addClass('search-form__column__input--default');
        } else {
            //Make sure there is no default class on
            _item.removeClass('search-form__column__input--default');
        }
    } else {
        //FOCUS
        if(_item.html() === _item.attr('data-default')) {
            //Text is the default, so blank it after a little delay
            setTimeout(function() {
                _item.html('');
                //document.execCommand('selectAll', false, null);
            }, 10);
        }

        //Remove the default class regardless
        _item.removeClass('search-form__column__input--default');
    }

    //Manage options display - not required on focus
    this.manageOptions(_item.attr('id').substr(7));
};


//--------------------------------------------------------------------------
//  IS THE USER MULTI-TAGGING
// 1. Only one comma not at the end
// 2. More the one comma
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.isMultiTaggging = function(_str) {
    _str = _str.trim();
    var _words = _str.split(',');
    if(_words.length > 2 || (_str.lastIndexOf(',') !== (_str.length - 1) && _str.lastIndexOf(',') !== -1)) {
        return true;
    } else {
        return false;
    }
};


//--------------------------------------------------------------------------
//  CHECK IF A GIVEN OPTION SO
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.manageOptions = function(_id) {
    //NAMES options
    var _namesValue = $('#search-names').text().trim().toLowerCase();
    var _names = (_id === 'names' && _namesValue !== '' && _namesValue !== $('#search-names').attr('data-default').toLowerCase()) ? true : false;

    //TAGS options
    var _tagsValue = $('#search-tags').text().trim().toLowerCase();
    var _tags = (_id === 'tags' && this.isMultiTaggging(_tagsValue)) ? true : false;

    //Show / Hide
    this.optionShow('names', _names);
    this.optionShow('tags', _tags);

    //Spacer
    if(!_names && !_tags) {
        //Collapase the spacer
        $('.search-form__options-wrapper').removeClass('search-form__options-wrapper--open');

        //Stop monitoring the tag-options position
        this.monitorTagOptions = false;
    } else {
        //Expand the spacer
        $('.search-form__options-wrapper').addClass('search-form__options-wrapper--open');

        //Make sure we are monitoring the position of the tag-options
        if(this.monitorTagOptions === false) {
            requestAnimationFrame(function() { this.checkTagOptionsPosition(); }.bind(this));
            this.monitorTagOptions = true;
        }
    }
};

//--------------------------------------------------------------------------
//  INIT A SEARCH
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.optionShow = function(_id, _show) {
    if(_show) {
        //Show the options
        $('#options-' + _id).removeClass('search-form__optionset--hidden');

        //Change the min-width on the input area to match the options width
        $('#search-' + _id).css({'min-width':($('#options-' + _id).width() - 50) +'px'});
    } else {
        //Hide the options
        $('#options-' + _id).addClass('search-form__optionset--hidden');

        //Reset the min-width on the input area
        $('#search-' + _id).css({'min-width':'10px'});
    }
};


//--------------------------------------------------------------------------
//  INIT A MONITOR ON A GIVEN OPTION FIELD
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.initOptionMonitor = function() {

};


//--------------------------------------------------------------------------
//  INIT A SEARCH
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.hideAllOptions = function() {
    //Hide all
    $('#options-tags').addClass('search-form__optionset--hidden');
    $('#options-names').addClass('search-form__optionset--hidden');

    //Collapse the spacer
};


//--------------------------------------------------------------------------
//  INIT A SEARCH
//--------------------------------------------------------------------------
SuperSnooper.Modules.FormManager.prototype.searchInit = function() {

    //Shutdown any options
    //this.manageOptions('');

    //De-focus input
    $('#search-names').blur();
    $('#search-tags').blur();
    $('#search-keywords').blur();

    //Get the values
    var _users = $('#search-names').text().trim();
    var _tags = $('#search-tags').text().trim();
    var _userMethod = this.optionGroups['options-names'].value;
    var _tagMethod = this.optionGroups['options-tags'].value;
    var _error = '';
    var _keywords = $('#search-keywords').text().trim();

    //Sanitize the users and hashtag lists
    _users = _users.split('@').join('').toLowerCase();
    _tags = _tags.split('#').join('').toLowerCase();
    _keywords = _keywords.toLowerCase();
    if(_users === $('#search-names').attr('data-default').toLowerCase()) { _users = ''; } //blank if they are the same as the default text, as this is not allowed
    if(_tags === $('#search-tags').attr('data-default').toLowerCase()) { _tags = ''; }
    if(_keywords === $('#search-keywords').attr('data-default').toLowerCase()) { _keywords = ''; }

    //Check
    if(_tags === ''  && _users === '') {
        //Error
        _error = 'Please enter at least one search term.';
    } else if (_users.split(',').length > 1) {
        //Too many names
        _error  = 'Please enter only one username.';
    } else if (_tags.split(',').length > this.tagMax) {
        //Too many tags
        _error  = 'Please enter '  + this.tagMax + ' hashtags or less.';
    } else if(_userMethod === 'mentions' && _users !== '' && _tags === '') {
        //Mentions search with nothing in the tag field is impossible to do
        _error = 'At least one hashtag is required for an @mentions search.';
    }

    //Done
    if(_error !== '') {
        //Show the ERROR
        alert(_error);
    } else {
        //Start a search
        var _date = new Date();

        //API - post everything, let the PHP deal with how it processes this
        SuperSnooper.api.initSearch({
            'names':_users,
            'tags':_tags,
            'keywords':_keywords,
            'names-method':_userMethod,
            'tags-method':_tagMethod,
            'date':_date.getFullYear() + '-' + SuperSnooper.helper.padString(_date.getMonth() + 1) + '-' + SuperSnooper.helper.padString(_date.getDate()), //used for caching purposes
            'searchID':SuperSnooper.helper.guid() + '-' + _date.getTime() //used for caching purposes
            //'itemStartID':'', //used for pagination
            //'userID' //posted back after initial lookup
            //'tagID' //posted back after lookup

        });



        /*if(_tags !== '' && (_userMethod !== 'owned' || _users === '')) {
            //TAG search
            SuperSnooper.api.initSearch({type:'tag', search:_tags, filterType:(_users !== '') ? 'user' : '', filters:_users, keywords:_keywordArray});
        } else {
            //USER search (should really do each user as a individiaul search...)
            SuperSnooper.api.initSearch({type:'user', search:_users, filterType:(_tags !== '') ? 'tag' : '', filters:_tags, keywords:_keywordArray});
        }*/
    }
};