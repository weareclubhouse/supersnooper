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
    this.queryList = [];
    this.queryCurrent = 0;

    //Items returned so far
    this.items = [];

    //Flags
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

    //Kill any old post
    if(this.postInProgress === true && this.postLast) {
        this.postLast.abort();
    }

    //Empty the items array
    this.items = [];

    //Setup our queries (this allows for multi-threaded queries)
    this.queryList = [];
    this.queryCurrent = 0;

    //Under
    if(_terms.tags !== '' && _terms['tags-method'] === 'any' && (_terms.names === '' || _terms['names-method'] === 'mentions')) {
        //Multi-threaded search
        var _tags = _terms.tags.split(',');
        for(var i = 0; i < _tags.length; i++) {
            this.queryList.push({searchTerms:{
                'names':_terms.names,
                'tags':_tags[i],
                'keywords':_terms.keywords,
                'names-method':_terms['names-method'],
                'tags-method':'any',
                'date':_terms.data,
                'searchID':_terms.searchID
            }, complete:false});
        }
    } else {
        //One thread search
        this.queryList.push({searchTerms:_terms, complete:false});
    }

    //Flags
    this.isPaused = false;
    this.postInProgress = false;

    //Event (picked up by Site.js)
    SuperSnooper.Signals.api.dispatch('search-init', {});

    //Get next data
    this.getNextDataSet(true);
};



//--------------------------------------------------------------------------
//  INIT SEARCH
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.getNextDataSet = function(_firstRun) {
    //Flags
    _firstRun = (_firstRun === undefined) ? false : _firstRun;

    //If this is not the first run, then we should switch to the next available query thread
    if(!_firstRun) { this.queryCurrent = this.getNextIncompleteThread(); }

    //POST the current data
    this.postLast = $.post( this.url, this.queryList[this.queryCurrent].searchTerms, function(_data ) {
        this.dataLoaded(_data);
    }.bind(this));

    //Dispatch an event
    //SuperSnooper.Signals.api.dispatch('search-start', this.queryList[this.queryCurrent].searchTerms);

    //Flag
    this.postInProgress = true;
};


//--------------------------------------------------------------------------
//  DATA LOADED OK
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.dataLoaded = function(_data) {
    //Flag off
    this.postInProgress = false;

    //Loop through the items and check them against the keywords
    for(var i=0; i < _data.data.length; i++) {
        //Keyword matching for this item
        _data.data[i].keywordMatches = this.keywordMatch(_data.data[i], this.queryList[this.queryCurrent].searchTerms.keywords);
    }

    //Push ALL of the data into the main stack (needed for looping back through later on maybe)
    this.items = this.items.concat(_data.data);

    //If this is a 'user' search we can reduce the query time by injecting the user id in as well now that we know what it is
    if(_data.userID !== undefined) { this.queryList[this.queryCurrent].searchTerms.userID = _data.userID; }

    //Decide if there is more to show...
    if(_data.pagination && _data.pagination.next_max_id && (!SuperSnooper.helper.DEBUG_MODE || !SuperSnooper.helper.ONE_PAGE_ONLY)) {
        //Add the next item paramater in for searching again on this thread...
        this.queryList[this.queryCurrent].searchTerms.itemStartID = _data.pagination.next_max_id;
    } else {
        //No more data on this thread
        this.queryList[this.queryCurrent].complete = true;

        //If there are now no threads that are not 'complete', theh call the stop method
        if(this.getNextIncompleteThread() === -1) {
            this.setState('stop');
        }
    }

    //If we are !PAUSED and there is a next available thread, then call it after a slight delay
    if(this.getNextIncompleteThread() !== -1 && !this.isPaused) {
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

        //Oldest date on the posts
        oldestDate:parseInt(_data.dateOldest)
    });
};


//--------------------------------------------------------------------------
//  GET THE NEXT INCOMPLETE THREAD
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.getNextIncompleteThread = function() {
    //Vars
    var _threadID = -1;
    var i;

    //Loop through the available threads 'after' the current one
    for( i = this.queryCurrent + 1; i < this.queryList.length; i++) {
        if(!this.queryList[i].complete) {
           _threadID = i;
           break;
        }
    }

    //If we didn't find anything, then loop back round and check
    if(_threadID === -1) {
        for( i = 0; i <= this.queryCurrent; i++) {
            if(!this.queryList[i].complete) {
               _threadID = i;
               break;
            }
        }
    }

    //Return
    return _threadID;
};


//--------------------------------------------------------------------------
//  API EVENT
//--------------------------------------------------------------------------
SuperSnooper.Utilities.APIManager.prototype.apiEvent = function(_method) {
    if(_method === 'state-toggle') {
        //TOGGLE my status - called by the PAUSE/RESUME button in InfoBar.js
        if(this.getNextIncompleteThread() !== -1) {
            this.setState((!this.isPaused) ? 'pause' : 'go');
        }
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

        //Get the next set of data if not already doing so
        if(!this.postInProgress && this.getNextIncompleteThread() !== -1) {
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