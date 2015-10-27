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
/*global SuperSnooper,signals,Isotope:false console:true*/
/*jshint camelcase: false */
/*jshint loopfunc: true */

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.APIManager = function(_url) {
    //Store the url
    this.url = _url;

    //Create a signal object
    SuperSnooper.Signals.api = new signals.Signal();
    SuperSnooper.Signals.api.add(this.apiMonitor = function(_method, _vars) { this.apiEvent(_method, _vars); }.bind(this));

    //Group delimiter
    this.groupDelimiter = '||';

    //Delay between pages (allows rendering to catch up really)
    this.pageDelayTime = 300;

    //Isotope list (this needs to be moved elsewhere)
    this.isotopes = {};

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
SuperSnooper.APIManager.constructor = SuperSnooper.APIManager;


//--------------------------------------------------------------------------
//  INIT SEARCH
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.initSearch = function(_terms) {
    //Clear the HTML content - this removes the isotope group, so is disabled for now
    $('.result-list').html('');

    //Store the search criteria
    this.searchTerms = _terms;

    //Kill any old post
    if(this.postInProgress === true && this.postLast) {
        this.postLast.abort();
    }

    //Setup the filters
    this.searchTerms.filterArray = this.searchTerms.filters.split(',');

    //Deal with the keywords
    var _str = '';
    for(var i=0;i<this.searchTerms.keywords.length;i++) {
        _str += (_str === '') ? '' : '|';
        _str += this.searchTerms.keywords[i].master;
        if(this.searchTerms.keywords[i].variants.length > 0) {
            _str += ',' + this.searchTerms.keywords[i].variants.join(',');
        }
    }

    this.searchTerms.keywords = _str;

    //Empty the items array
    this.items = [];

    //Flags
    this.isPaused = false;
    this.hasMoreData = true;

    //Event (display manager will make the isotope block)
    SuperSnooper.Signals.api.dispatch('search-init', {searchTerms:this.searchTerms});

    //Get next data
    this.getNextDataSet();

};



//--------------------------------------------------------------------------
//  INIT SEARCH
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.getNextDataSet = function() {
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
SuperSnooper.APIManager.prototype.dataLoaded = function(_data) {
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
    if(_data.pagination && _data.pagination.next_max_id) {
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

    //If there is more data and the user is at the bottom of the page, we should go again here
    if(this.hasMoreData && !this.isPaused) {
        this.nextPageDelay = setTimeout(function() {
            this.getNextDataSet();
        }.bind(this), this.pageDelayTime);
        //SuperSnooper.display.scrollCheck();
    }

    //Finally dispatch an event containing the items we have deemed fit to be included, what is 'itemCountTotal'?
    SuperSnooper.Signals.api.dispatch('items-add', {items:_itemsToDisplay, searchTerms:this.searchTerms, itemCountProcessed:this.items.length, itemCountTotal:0, complete:!this.hasMoreData});

};



//--------------------------------------------------------------------------
//  API EVENT
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.apiEvent = function(_method) {
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

    /*else if(_method === 'data-loaded') {
        //RESULTS process
        this.resultsProcess(_vars.thread, _vars.data);
    } else if(_method === 'thread-complete') {
        //THREAD COMPLETE, so close the block off
        this.resultsComplete(_vars);
    }*/
};


//--------------------------------------------------------------------------
//  SET MY STATE
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.setState = function(_state) {
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
SuperSnooper.APIManager.prototype.keywordMatch = function(_info, _words) {
    //Matches
    var _matches = {words:[], fields:[]};

    //Expose the keywords
    var _keywords = SuperSnooper.forms.keywords;

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
SuperSnooper.APIManager.prototype.filterForUserNames = function(_info, _filters) {


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
SuperSnooper.APIManager.prototype.filterForTags = function(_info, _filters) {


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




/*
  //Show the processing data text
    $('#loader-bar' + _thread.id + ' .result-list-bar-title').html('Processing results...');

    //Sort the items
    this.items[_thread.id].sortOn('timestamp');

    //Start
    var _items = this.items[_thread.id];
    var _groups = [];
    var _groupID;
    var _subGroups = {};
    var i, j, k, l;
    var _usersInPhoto;
    var _searchFields;
    var _searchValue;
    var _match;
    var _tags;
    var _keywords;
    var _keywordMatches;

    //Adjust filters, search etc.
    _thread.filters = _thread.filters.split(',');
    _thread.search = _thread.search.split(',');

    //Keywords
    if(_thread.keywords !== '') {
        //Temporary array
        _keywords = _thread.keywords.split('|');
        _thread.keywords = [];
        for(i=0;i<_keywords.length;i++) {
            _thread.keywords.push(_keywords[i].split(','));
        }
    }


    //Loop through the items and work out what groups we are going to have to show
    for(i=0;i<_items.length;i++) {
        //Pre-checks on the data itself
        _items[i].valid = true;

        //If this is a HASH tag search, we first check that the items match all of the criteria
        if(_thread.type === 'tag' && this.matchAllTagsOnTagSearch && _thread.search.length > 1) {
            //Build a list of tags to match
            _tags = [];
            for(j=0;j<_thread.search.length;j++) {
                if(_items[i].tags.indexOf(_thread.search[j].toLowerCase()) === -1) {
                    //Missing tag!
                   _items[i].valid = false;
                }
            }
        }

        //Pass the preliminary checks
        if(_items[i].valid === true) {

             //Date
            _items[i].date = new Date(parseInt(_items[i].timestamp) * 1000);
            _items[i].dateString = _items[i].date.getFullYear() + this.padString(_items[i].date.getMonth() + 1) + this.padString(_items[i].date.getDate()); //reverse date allows us to sort by name

            //Keyword matches
            _items[i].keywordsMatched = [];

            //Base GROUP ID (date)
            _groupID = 'resultset' + _thread.id + this.groupDelimiter + _items[i].dateString;

            //Filters
            if(_thread.filterType !== '') {
                //This is actually now within a set of subgroups...
                _items[i].subGroups = [];

                //There is a filter specified, so we need to check it out...
                if(_thread.filterType === 'user') {


                } else if(_thread.filterType === 'tag') {
                    //--------------------------------------------------------------------------
                    // TAG FILTERING (USED on USER SEARCH TO MATCH ANY OF A GIVEN SET OF TAGS)
                    //--------------------------------------------------------------------------
                }


                //--------------------------------------------------------------------------
                // MAKE SURE REQUIRED GROUPS EXIST
                //--------------------------------------------------------------------------
                if(_items[i].subGroups.length > 0) {
                    //Ensure the base group is created
                    if(_groups.indexOf(_groupID) === -1) { _groups.push(_groupID); }

                    //Subgroups
                    for(j=0;j<_items[i].subGroups.length;j++) {
                        if(_subGroups[_groupID] === undefined) { _subGroups[_groupID] = []; }
                        if(_subGroups[_groupID].indexOf(_items[i].subGroups[j]) === -1) { _subGroups[_groupID].push(_items[i].subGroups[j]); }
                    }
                }
            }  else {
                //Non filtered item, so just make sure the group exists
                if(_groups.indexOf(_groupID) === -1) { _groups.push(_groupID); }
            }



        }
    }

    //Sort base groups in reverse alphabetical order
    _groups.sort().reverse();

    //Add any groups that a rerequired...
    for(i=0;i<_groups.length;i++) {
        if(_subGroups[_groups[i]] !== undefined) {
            //Sort the list in ASCENDING alphabetical order
            _subGroups[_groups[i]].sort();
            for(j=0;j<_subGroups[_groups[i]].length;j++) {
                this.createIsotopeGroup(i, j, _groups[i] + this.groupDelimiter + _subGroups[_groups[i]][j], 'sub', (j === 0) ? true : false, _thread.filterType);
            }
        } else {
            //Basic grouping by date
            this.createIsotopeGroup(i, -1, _groups[i], 'base', true);
        }
    }

    //Now loop through our items and add them wherever they need to go!
    for(i=0;i<_items.length;i++) {
        //Insert the items into the correct isotope block(s)
        _groupID = 'resultset' + _thread.id + this.groupDelimiter + _items[i].dateString;

        if(_items[i].subGroups !== undefined) {
            //All sub groups
            for(j=0;j<_items[i].subGroups.length;j++) {
                this.isotopes[_groupID + this.groupDelimiter + _items[i].subGroups[j]].insert(this.createItemTemplate(i, _thread.id, _items[i]));
            }
        } else if(_items[i].valid) {
            //Base group
            this.isotopes[_groupID].insert(this.createItemTemplate(i, _thread.id, _items[i]));
        }
    }

    //Remove the loader?
    $('#loader-bar' + _thread.id).remove();

    //Move this thread from in-progress to complete
    this.searches.complete.push(this.searches['in-progress'].splice(this.findThread('in-progress', _thread.id), 1)[0]);

    //If there are still searches to do, then start the next one...
    if(this.searches['to-do'].length > 0) {
        this.initDormantThreads();
    }
    */



//--------------------------------------------------------------------------------------------------------------OLD STUFF BELOW HERE------------------------------------------





//--------------------------------------------------------------------------
// INIT A RESULTS BLOCK
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.resultBlockInit = function(_info) {
    //HTML from template and add to the main content
    var _list = SuperSnooper.templates.loader({
        id: _info.id,
        title: '0 items found...'
        //title:(_info.type === 'user') ? '@' + _info.search : 'Searching (#' + _info.search.split(',').join(', #') + ')...'
    });

    //Inject a bar for loading
    $('.result-list').append(_list);
};



//--------------------------------------------------------------------------
//  RESULTS PROCESS
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.resultsProcess = function(_thread, _data) {
    //Show the count on the load bar
    var _str = _thread.itemCount + ' item';
    _str += (_thread.itemCount !== 1) ? 's found...' : ' found...';
    $('#loader-bar' + _thread.id + ' .result-list-bar-title').html(_str);

    //Store the results against the right set of items
    this.items[_thread.id] = (this.items[_thread.id] === undefined) ? _data : this.items[_thread.id].concat(_data);
};



//--------------------------------------------------------------------------
// CREATE AN ISOTOPE GROUP
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.createIsotopeGroup = function(_count1, _count2, _id, _type, _isFirstOfType, _filterType) {

    //Title
    var _title;
    var _parts = _id.split(this.groupDelimiter);

    //If first of type, then we create a title bar
    if(_isFirstOfType) {
        //DATE
        _title = _parts[1].substr(6, 2) + '-' + _parts[1].substr(4, 2) + '-' + _parts[1].substr(0, 4);
        $('.result-list').append(SuperSnooper.templates.title({title:_title, extras:(_count1 !== 0) ? 'padded-top' : ''}));
    }

    //If 'sub' then create a subcategory bar
    if(_type === 'sub') {
        //SUB category
        _title = (_filterType === 'user') ? '@' + _parts[2] : '#' + _parts[2];
        $('.result-list').append(SuperSnooper.templates.subtitle({title:_title, extras:(_count2 !== 0) ? 'padded-top-small' : ''}));
    }

    //Inject the ISOTOPE template HTML
    $('.result-list').append(SuperSnooper.templates.itemlist({id:_id}));

    //Make the ISOTOPE object
    this.isotopes[_id] = new Isotope(document.querySelector('.result-list-items#' + _id), {
        //LAYOUT
        masonry: {
            //isFitWidth: true
            columnWidth: 190,
            gutter: 10
        }

        //SORTING
        /*
        sortBy:'date',
        sortAscending: false,
         getSortData : {
          // ...
          date : function ( _elem ) {
            return parseInt($(_elem).attr('data-date'));
          }
        }*/
    });

};




//--------------------------------------------------------------------------
// ARRAY SORT PROTOTYPE
//--------------------------------------------------------------------------
Array.prototype.sortOn = function(key){
    this.sort(function(a, b){
        if(a[key] < b[key]){
            return 1;
        }else if(a[key] > b[key]){
            return -1;
        }
        return 0;
    });
};

