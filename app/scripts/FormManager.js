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
SuperSnooper.FormManager = function() {
    //Keywords
    this.keywords = []; //stored as {master:'', variants:[]}
    this.keywordsMax = 50;
    this.searchMax = 5;

    //Capture the onsubmit event and override it
    $('#search-form').on('submit', function(e){
        this.searchInit();
        e.preventDefault();
        return false;
    }.bind(this));

    //Dummy Search Trigger
    if(SuperSnooper.DEBUG_MODE) {
        this.keywords = [{master:'thirsty', variants:[]}]; //green,vert,verte||rouge,red||blue||yellow||black||white';
        $('input#users').val('@gregfindon');
        $('input#tags').val('');
        this.searchInit();
    }

    //Wire in the EDIT button
    $('#button-edit-keywords').on('click', function() {
        this.editKeywords();
    }.bind(this));

    //Set keyword counts
    this.setKeywordCounts();

    //Hover effects on buttons
    $('.button').hover(function() { $(this).addClass('over'); }, function() { $(this).removeClass('over'); });
};

//Definition
SuperSnooper.FormManager.constructor = SuperSnooper.FormManager;


//--------------------------------------------------------------------------
//  INIT A SEARCH
//--------------------------------------------------------------------------
SuperSnooper.FormManager.prototype.searchInit = function() {
    //Get the values
    var _users = $('input#users').val();
    var _tags = $('input#tags').val();
    var _userMethod = $('input[name=name-search-type]:checked').val();
    var _error = '';
    console.log(_userMethod);

    //Sanitize everything
    _users = _users.split('@').join('').toLowerCase();
    _tags = _tags.split('#').join('').toLowerCase();

    //Check
    if(_tags === '' && _users === '') {
        //Error
        _error = 'Please enter at least one search term.';
    } else if (_users.split(',').length > this.searchMax) {
        //Too many names
        _error  = 'Please enter '  + this.searchMax + ' usernames or less.';
    } else if (_tags.split(',').length > this.searchMax) {
        //Too many tags
        _error  = 'Please enter '  + this.searchMax + ' hashtags or less.';
    } else if(_userMethod === 'mentions' && _users !== '' && _tags === '') {
        //Mentions search with nothing in the tag field is impossible to do
        _error = 'At least one hashtag is required for an @mentions search.';
    }

    //Done
    if(_error !== '') {
        //Show the ERROR
        alert(_error);
    } else {
        //Calculate what kind of search we are doing...
        if(_tags !== '' && (_userMethod !== 'owned' || _users === '')) {
            //TAG search
            console.log('TAG SEARCH');
            SuperSnooper.api.initSearch({type:'tag', search:_tags, filterType:(_users !== '') ? 'user' : '', filters:_users, keywords:this.keywords}); //
        } else {
            //USER search (should really do each user as a individiaul search...)
            console.log('USER SEARCH');
            SuperSnooper.api.initSearch({type:'user', search:_users, filterType:(_tags !== '') ? 'tag' : '', filters:_tags, keywords:this.keywords});
        }
    }
};



//--------------------------------------------------------------------------
//  EDIT THE KEYWORDS
//--------------------------------------------------------------------------
SuperSnooper.FormManager.prototype.editKeywords = function() {
    //Create the content
    var _content = SuperSnooper.templates.keywords({});

    //Open the lightbox
    SuperSnooper.display.lightBoxOpen(_content, 'keywords');

    //Inject the items in (these are filled from the top, so we loop backwards through the array)
    for(var i=0;i<this.keywords.length;i++) {
        console.log('adding');
        this.addKeyword(this.keywords[this.keywords.length - i - 1].master, this.keywords[this.keywords.length - i - 1].variants.join(','), i);
    }

    //Set positions
    this.setKeywordRowPositions();

    //Wire in the BUTTONS
    $('#button-add-keyword').on('click', function() { this.addKeyword(); }.bind(this));
    $('#button-update-search').on('click', function() { this.updateKeywords(); }.bind(this));

};


//--------------------------------------------------------------------------
//  ADD A KEYWORD
//--------------------------------------------------------------------------
SuperSnooper.FormManager.prototype.addKeyword = function(_master, _variant, _id) {
    //Vars
    _master = _master || '';
    _variant = _variant || '';

    //Work out a key id for this item
    var _keyID = (_id !== undefined) ? _id : this.keywords.length; //auto number if we need to

    //Push a new item in if no ID was defined
    if(_id === undefined) {
        this.keywords.push({'master':'', 'keywords':[]});
    }

    //Add the HTML
    var _html = SuperSnooper.templates['keyword-item']({master:_master, variants:_variant, id:_keyID});
    $('.keyword-list-items').prepend(_html);

    //Delay
    var _delay = (_id === undefined) ? 0 : 100 + (50 * (this.keywords.length - _id - 1));
    console.log(_delay + ':' + _master);
    $('#keyword-item' + _keyID).delay(_delay).animate({opacity:1}, 750);

    //Make sure the positions of all of the keyword items is set
    if(_id === undefined) {
        this.setKeywordRowPositions();
    }


    //Scroll a div to the bottom
    //var scrollTarget = $('.keyword-list-items');
    //scrollTarget.scrollTop(scrollTarget[0].scrollHeight);
};


//--------------------------------------------------------------------------
//  SET THE ROW POSITIONS
//--------------------------------------------------------------------------
SuperSnooper.FormManager.prototype.setKeywordRowPositions = function() {
    //Vars
    for(var i=0;i<this.keywords.length;i++) {
        $('#keyword-item' + i).css({top:10 + ((this.keywords.length - i - 1) * 60)});
    }
};


//--------------------------------------------------------------------------
//  UPDATE THE KEYWORDS
//--------------------------------------------------------------------------
SuperSnooper.FormManager.prototype.updateKeywords = function(_closeLightBox) {
    //Close?
    _closeLightBox = (_closeLightBox === undefined) ? true : _closeLightBox;

    //Build our keywords from the form items
    var _masters = $('.keyword-input-master');
    var _variants = $('.keyword-input-variants');
    var _itemMaster;
    var _itemVariants;

    //Update the keywords
    this.keywords = [];
    console.log(_masters.length);
    for(var i=0;i<_masters.length;i++) {
        //Sanitize the input a bit
        _itemMaster = $(_masters[i]).val().split(SuperSnooper.keywordDelimiter).join('').trim().toLowerCase();
        _itemVariants = $(_variants[i]).val().split(SuperSnooper.keywordDelimiter).join('').trim().toLowerCase();

        if(_itemMaster !== '') {
            this.keywords.push({master:_itemMaster, variants:(_itemVariants === '') ? [] : _itemVariants.split(',')});
            console.log('ADDED:' + _itemMaster);
            //this.keywords += (this.keywords !== '') ? SuperSnooper.keywordDelimiter : '';
            //this.keywords += _itemMaster, variants:;
            //this.keywords += (_itemVariants !== '') ? ',' + _itemVariants : '';
        }
    }

    //Update the counts
    this.setKeywordCounts();

    //Close the lightbox (but don't loop back)
    if(_closeLightBox) {
        SuperSnooper.display.lightBoxClose(false);
    }
};


//--------------------------------------------------------------------------
//  SET OUR KEYWORD COUNTS
//--------------------------------------------------------------------------
SuperSnooper.FormManager.prototype.setKeywordCounts = function() {
    //Count
    var _variantCount = 0;
    for(var i=0;i<this.keywords.length;i++) {
        _variantCount += this.keywords[i].variants.length;
    }

    //Values
    var _str = '<span class="keywords-stat-value">(' + this.keywords.length + ')</span> Master Word';
    _str += (this.keywords.length !== 1) ? 's ' : ' ';
    _str +=  '<span class="keywords-stat-value">(' + _variantCount +')</span> Variant';
    _str += (_variantCount !== 1) ? 's' : '';
    $('#keywords-counts').html(_str);
};


//--------------------------------------------------------------------------
//  EXTRACT KEYWORD INFO
//--------------------------------------------------------------------------
/*SuperSnooper.FormManager.prototype.expandKeywords = function() {
    var _info = {variantCount:0, words:[]};
    var _list = (this.keywords === '') ? [] : this.keywords.split(SuperSnooper.keywordDelimiter);
    var _variants;
    var _words;

    //Loop
    for(var i=0;i<_list.length;i++){
        //Variants for this word
        _words = _list[i].split(',');
        _variants = _words.splice(1, _words.length - 1);

        //Add the word to the array
        _info.words.push({master:_words[0], variants:_variants});

        //Add to the total variant length
        _info.variantCount += _variants.length;
    }

    //Return the info object
    return _info;
};*/

