/*
*   @site           SuperSnooper
*   @function       API Manager
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper,signals:false console:true*/
/*jshint camelcase: false */
/*jshint loopfunc: true */

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager = function(_url) {
    //Store the url
    this.url = _url;

    //Create a signal object
    SuperSnooper.Signals.api = new signals.Signal();
    SuperSnooper.Signals.api.add(this.apiMonitor = function(_method, _vars) { this.apiEvent(_method, _vars); }.bind(this));

    //Delay between pages (allows rendering to catch up really)
    this.pageDelayTime = 300;

    //Queries (list of queries we are looping through, usually 1, but maybe more if this is a multiple hashtag search)
    this.queries = [];

    //Items returned so far
    this.items = [];

    //Search terms
    this.searchTerms = {};

    //Flags
    this.hasMoreData = false;
    this.postInProgress = false;
    this.isPaused = false;

    //Temporary flag for searching
    this.matchAllTagsOnTagSearch = true;
};

//Definition
SuperSnooper.Utilities.APIManager.constructor = SuperSnooper.Utilities.APIManager;


//--------------------------------------------------------------------------
//  INIT SEARCH
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.initSearch = function(_terms) {
    //Clear the HTML content of the results list
    $('.result-list').html('');

    //Store the search terms for reference when displaying the items
    SuperSnooper.helper.searchProcess(_terms);

    //Store the search criteria
    this.searchTerms = _terms;

    //Kill any old post
    if(this.postInProgress === true && this.postLast) {
        this.postLast.abort();
    }

    //Setup the filters - this is nonsense and not needed
    //this.searchTerms.filterArray = this.searchTerms.filters.split(',');

    //Empty the items array
    this.items = [];

    //Setup our queries...

    //Flags
    this.isPaused = false;
    this.hasMoreData = true;

    //Event (picked up by Site.js)
    SuperSnooper.Signals.api.dispatch('search-init', {});

    //Get next data
    this.getNextDataSet();
};



//--------------------------------------------------------------------------
//  INIT SEARCH
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.getNextDataSet = function() {
    //POST the current data
    this.postLast = $.post( this.url, this.searchTerms, function(_data ) {
        this.dataLoaded(_data);
    }.bind(this));

    //Event
    SuperSnooper.Signals.api.dispatch('search-start', this.searchTerms);

    //Flag
    this.postInProgress = true;
};


//--------------------------------------------------------------------------
//  DATA LOADED OK
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.dataLoaded = function(_data) {
    //Flag off
    this.postInProgress = false;

    //Loop through our data and decide if the item matches our criteria
    var _itemsToDisplay = [];
    var _passed = true;
    var _search;
    var _itemInfo;

    for(var i=0;i<_data.data.length;i++) {
        //Add in our extra fields
        _data.data[i].filtered = false;
        _data.data[i].filterMatches = []; //this could be made better to accomodate multiples?

        //Get the info
        _itemInfo = _data.data[i];
        _passed = true;

        //Filtering
        if(this.searchTerms.filterType === 'user' && _passed) {
            //Search
            _search = this.filterForUserNames(_itemInfo, this.searchTerms.filterArray);

            //Set the flags
            _data.data[i].filtered = true;
            _passed = _search.result; //this.filterForUserNames(this.searchTerms.filter);

            //If passed, then add the filter matches to the object
            if(_passed) {
                 _data.data[i].filterMatches = _search.matches;
            }
        } else if(this.searchTerms.filterType === 'tag' && _passed) {
            //Search
            _search = this.filterForTags(_itemInfo, this.searchTerms.filterArray);

            //Set the flags
            _data.data[i].filtered = true;
            _passed = _search.result; //this.filterForUserNames(this.searchTerms.filter);

            //If passed, then add the filter matches to the object
            if(_passed) {
                 _data.data[i].filterMatches = _search.matches;
            }
        }

        //Keyword matching
        _data.data[i].keywordMatches = this.keywordMatch(_itemInfo, this.searchTerms.keywords);

        //Add the item to the list
        if(_passed) {
            _itemsToDisplay.push(_itemInfo);
        }
    }

    //Push ALL of the data into the main stack (needed for looping back through later on maybe)
    this.items = this.items.concat(_data.data);


    //Decide if there is more to show...
    if(_data.pagination && _data.pagination.next_max_id && (!SuperSnooper.helper.DEBUG_MODE || !SuperSnooper.helper.ONE_PAGE_ONLY)) {
        //Flag
        this.hasMoreData = true;

        //Add the next item paramater in and search again...
        this.searchTerms.itemStartID = _data.pagination.next_max_id;

        //If this is a 'user' search we can reduce the query time by injecting the user id in as well now that we know what it is, otherwise inject the tag count
        if(_data.user && _data.user.id) {
            this.searchTerms.userID = _data.user.id;
        } else if(_data.tag) {
            this.searchTerms.tagCount = _data.tag.media_count;
        }

        //If there is a SEARCH ID (which there should be, then put it in)
        if(_data.searchID) {
            this.searchTerms.searchID = _data.searchID;
        }
    } else {
        //No more data
        this.hasMoreData = false;
        this.setState('stop');
    }

    //Get more data?!?!?
    if(this.hasMoreData && !this.isPaused) {
        this.nextPageDelay = setTimeout(function() {
            this.getNextDataSet();
        }.bind(this), this.pageDelayTime);
    }

    //Finally dispatch an event containing the items we have deemed fit to be included, what is 'itemCountTotal'?
    SuperSnooper.Signals.api.dispatch('items-add', {items:_itemsToDisplay, searchTerms:this.searchTerms, itemCountProcessed:this.items.length, itemCountTotal:0, complete:!this.hasMoreData});
};



//--------------------------------------------------------------------------
//  API EVENT
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.apiEvent = function(_method) {
    if(_method === 'load-more') {
        //LOAD MORE items
        if(this.hasMoreData && !this.postInProgress) {
            this.getNextDataSet();
        }
    } else if(_method === 'state-toggle') {
        //TOGGLE my status
        if(this.hasMoreData) {
            this.setState((!this.isPaused) ? 'pause' : 'go');
        }
    } else if(_method === 'resume') {
    }
};


//--------------------------------------------------------------------------
//  SET MY STATE
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.setState = function(_state) {
    if(_state === 'pause') {
        //PAUSE flag
        if(this.nextPageDelay !== undefined && this.nextPageDelay !== null) {
            clearTimeout(this.nextPageDelay);
            this.nextPageDelay = null;
        }
        this.isPaused = true;
    } else if(_state === 'go') {
        //TURN off pause flag
        this.isPaused = false;
        if(!this.postInProgress && this.hasMoreData) {
            this.getNextDataSet();
        }
    } else if(_state === 'stop') {
        //NO MORE SEARCHING!
    }

    //Dispatch the state change
    SuperSnooper.Signals.api.dispatch('state-set', {state:_state});
};


//--------------------------------------------------------------------------
//  FILTER FOR A SET OF USERNAMES (MATCH ANY)
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.keywordMatch = function(_info, _words) {
    //Matches
    var _matches = {words:[], fields:[]};

    //Expose the keywords
    var _keywords = SuperSnooper.helper.searchTerms.keywords; //SuperSnooper.forms.keywords;

    //Loop through the words
    if(_words !== '') {
        //Caption
        var i, j, k;
        var _searchFields = [];
        if(_info.caption && _info.caption.text) {
            _searchFields.push({id:'caption', value:_info.caption.text.toLowerCase()});
        }

        //Comments
        for(i=0;i<_info.comments.data.length;i++) {
            _searchFields.push({id:'comment' + i, value:_info.comments.data[i].text});
        }

        //Check each keyword against the field
        for(i=0;i<_searchFields.length;i++) {
            for(j=0;j<_keywords.length;j++) {
                //Master word
                if(_searchFields[i].value.indexOf(_keywords[j].master.toLowerCase()) > -1) {
                    console.log('MATCH:' + _keywords[j].master + ' IN ' + _searchFields[i].id + ': ' + _searchFields[i].value);
                    _matches.words.push({word:_keywords[j].master, master:_keywords[j].master, type:'master'});

                    //If this is a comment field, then we need to add it
                    if(_searchFields[i].id.indexOf('comment') !== -1 && _matches.fields.indexOf(_searchFields[i].id) === -1) {
                        _matches.fields.push(_searchFields[i].id);
                    }
                }

                //Multiple words in each keyword block
                for(k=0;k<_keywords[j].variants.length;k++) {
                    if(_searchFields[i].value.indexOf(_keywords[j].variants[k].toLowerCase()) > -1) {
                        console.log('MATCH:' + _keywords[j].variants[k] + ' IN ' + _searchFields[i].id);
                        _matches.words.push({word:_keywords[j].variants[k], master:_keywords[j].master, type:'variant'});

                        //If this is a comment field, then we need to add it
                        if(_searchFields[i].id.indexOf('comment') !== -1 && _matches.fields.indexOf(_searchFields[i].id) === -1) {
                            _matches.fields.push(_searchFields[i].id);
                        }
                    }
                }
            }
        }
    }

    //Return
    return _matches;
};




//--------------------------------------------------------------------------
//  FILTER FOR A SET OF USERNAMES (MATCH ANY)
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.filterForUserNames = function(_info, _filters) {


    //--------------------------------------------------------------------------
    // USER FILTERING
    //--------------------------------------------------------------------------
    // 1. Caption
    // 2. Comments
    // 3. Users tagged in photo

    //Vars
    var _searchFields = []; //fields we are going to search
    var _searchValue; //what are we going to be searching for
    var _response = {result:false, matches:[]}; //response object
    var i,j;

    //CAPTION
    if(_info.caption && _info.caption.text) {
        _searchFields.push({id:'caption', text:_info.caption.text.toLowerCase()});
    }

    //COMMENTS
    if(_info.comments.data.length > 0) {
        for(i=0;i<_info.comments.data.length;i++) {
            _searchFields.push({id:'comment' + i, text:_info.comments.data[i].text.toLowerCase()});
        }
    }

    //USERS IN PHOTO
    if(_info.users_in_photo.length > 0) {
        for(i=0;i<_info.users_in_photo.length;i++) {
            _searchFields.push({id:'user_in_photo' + i, text:'@' + _info.users_in_photo[i].user.username.toLowerCase()});
        }
    }

    //Loop through all filters
    for(i=0;i<_filters.length;i++) {
        //What are we looking for?
        _searchValue = '@' + _filters[i].toLowerCase();

        //Go through all of the search fields...
        for(j=0;j<_searchFields.length;j++) {
            //Does search value existin our field?
            if(_searchFields[j].text.indexOf(_searchValue) !== -1) {
                //We have a match!
                _response.result = true;

                //Store the match (strip off the @ or the #)
                /*if(_response.matches[_filters[i].toLowerCase()] === undefined) {
                    _response.matches[_filters[i].toLowerCase()] = [];
                }*/
                _response.matches.push(_searchFields[j].id); //this could result in more than one match if we have multiple filters, need to think about this
            }

        }
    }

    //Return response
    return _response;
};



//--------------------------------------------------------------------------
//  FILTER FOR A SET OF TAGS (MATCH ANY)
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.filterForTags = function(_info, _filters) {


    //--------------------------------------------------------------------------
    // USER FILTERING
    //--------------------------------------------------------------------------
    // 1. Caption
    // 2. Comments
    // 3. Users tagged in photo

    //Vars
    var _searchFields = []; //fields we are going to search
    var _searchValue; //what are we going to be searching for
    var _response = {result:false, matches:[]}; //response object
    var i,j;

    //CAPTION
    if(_info.caption && _info.caption.text) {
        _searchFields.push({id:'caption', text:_info.caption.text.toLowerCase()});
    }

    //COMMENTS
    if(_info.comments.data.length > 0) {
        for(i=0;i<_info.comments.data.length;i++) {
            _searchFields.push({id:'comment' + i, text:_info.comments.data[i].text.toLowerCase()});
        }
    }

    //PHOTO TAGS!

    //Loop through all filters
    for(i=0;i<_filters.length;i++) {
        //What are we looking for?
        _searchValue = '#' + _filters[i].toLowerCase();

        //Go through all of the search fields...
        for(j=0;j<_searchFields.length;j++) {
            //Does search value existin our field?
            if(_searchFields[j].text.indexOf(_searchValue) !== -1) {
                //We have a match!
                _response.result = true;

                //Store the match (strip off the @ or the #)
                /*if(_response.matches[_filters[i].toLowerCase()] === undefined) {
                    _response.matches[_filters[i].toLowerCase()] = [];
                }*/
                _response.matches.push(_searchFields[j].id); //this could result in more than one match if we have multiple filters, need to think about this
            }

        }
    }

    //Return response
    return _response;
};
