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

    //Empty the items array
    this.items = [];

    //Setup our queries...

    //Flags
    this.isPaused = false;
    this.hasMoreData = true;
    this.postInProgress = false;

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

    //Loop through the items
    for(var i=0; i < _data.data.length; i++) {
        //Keyword matching for this item
        _data.data[i].keywordMatches = this.keywordMatch(_data.data[i], this.searchTerms.keywords);
    }

    //Push ALL of the data into the main stack (needed for looping back through later on maybe)
    this.items = this.items.concat(_data.data);

    //If this is a 'user' search we can reduce the query time by injecting the user id in as well now that we know what it is
    if(_data.userID !== undefined) { this.searchTerms.userID = _data.userID; }

    //Decide if there is more to show...
    if(_data.pagination && _data.pagination.next_max_id && (!SuperSnooper.helper.DEBUG_MODE || !SuperSnooper.helper.ONE_PAGE_ONLY)) {
        //Flag
        this.hasMoreData = true;

        //Add the next item paramater in for searching again...
        this.searchTerms.itemStartID = _data.pagination.next_max_id;
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

    //Finally dispatch an event containing the items we have deemed fit to be included!
    SuperSnooper.Signals.api.dispatch('items-add', {
        //Data
        items:_data.data, //items to show

        //Counts
        itemCountProcessed:parseInt(_data.processedCount), //how many items were found (ignoring any filters that were applied)
        itemCountTotal:(_data.itemCount !== undefined) ? parseInt(_data.itemCount) : 0, //if this was the first call there will be an 'overall' item count

        //searchTerms:this.searchTerms, //repeat of the search terms???? - not used
    });
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
//  KEYWORD MATCHING
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.keywordMatch = function(_info, _words) {
    //Matches
    var _matches = {words:[], fields:[]};

    //Expose the keywords
    var _keywords = SuperSnooper.helper.searchTerms.keywords.split(','); //SuperSnooper.forms.keywords;
    var _findWord;

    //Loop through the words
    if(_words !== '') {
        //Caption
        var i, j;
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
                //Look for the word in the field
                _findWord = _searchFields[i].value.toLowerCase().indexOf(_keywords[j].toLowerCase());

                //Found?
                if(_findWord > -1) {
                    //Extra validation check
                    if(SuperSnooper.helper.keywordValidate(_keywords[j], _findWord, _searchFields[i].value)) {
                        //Store the word (not actually used anywhere?)
                        _matches.words.push(_keywords[j]);

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