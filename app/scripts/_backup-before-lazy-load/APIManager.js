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

    //Vars
    this.threads = [];
    this.threadMax = 2; //more threads mean we can connect with lots of requests, although I think it might mean we get errors

    //Make our threads
    for(var i=0;i<this.threadMax;i++) {
        this.threads.push(new SuperSnooper.APIThread(_url));
    }

    //Group delimiter
    this.groupDelimiter = '__';

    //Isotope list
    this.isotopes = {};

    //Search List
    this.searches = {
        'to-do': [],
        'complete': [],
        'in-progress': [],
    };

    //Items returned
    this.items = [];

    //Temporary flag!
    this.matchAllTagsOnTagSearch = true;
};

//Definition
SuperSnooper.APIManager.constructor = SuperSnooper.APIManager;


//--------------------------------------------------------------------------
//  INIT SEARCH
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.initSearch = function(_list) {
    //Halt all the threads
    for(var i=0;i<this.threads.length;i++) {
        this.threads[i].halt();
    }

    //Clear the HTML content
    $('.result-list').html('');

    //Calculate a minimum timestamp for each of the searches
    var _now = new Date();
    var _past;
    for(i=0;i<_list.length;i++) { //year, month, day, hours, minutes, seconds, milliseconds
        _past = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() - (_list[i].days - 1));
        _list[i].timeLimit = _past.getTime() / 1000;

        //Number the searches for ID purposes
        _list[i].id = i;
    }


    //Store the search list
    this.searches = {
        'to-do': _list,
        'complete': [],
        'in-progress': [],
    };
    this.items = [];

    //Debug
    console.log('Starting search: ' + _list.length + ' items using ' + this.threads.length + ' threads...');

    //Loop through our threads and give the dormant ones something to do (unless we run out of things to search for first...)
    this.initDormantThreads();
};



//--------------------------------------------------------------------------
//  INIT DORMANT THREADS
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.initDormantThreads = function() {
    for(var i=0;i<this.threads.length;i++) {
        if(!this.threads[i].isWorking && this.searches['to-do'].length > 0) {
            //Add it to the search
            this.threads[i].initSearch(this.searches['to-do'][0]);

            //Move it to the 'in-progress' array
            this.searches['in-progress'].push(this.searches['to-do'].splice(0, 1)[0]);
        }
    }
};


//--------------------------------------------------------------------------
//  API EVENT
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.apiEvent = function(_method, _vars) {
    if(_method === 'thread-start') {
    	//RESULTS init
        this.resultBlockInit(_vars);
    } else if(_method === 'data-loaded') {
    	//RESULTS process
    	this.resultsProcess(_vars.thread, _vars.data);
    } else if(_method === 'thread-complete') {
    	//THREAD COMPLETE, so close the block off
    	this.resultsComplete(_vars);
    }
};


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
// RESULTS COMPLETE
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.resultsComplete = function(_thread) {
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
                    //--------------------------------------------------------------------------
                    // USER FILTERING
                    //--------------------------------------------------------------------------
                    // 1. Caption
                    // 2. Comments
                    // 3. Users tagged in photo

                    //Caption
                    _searchFields = [];
                    _match = false;
                    if(_items[i].caption && _items[i].caption.text) {
                        _searchFields.push(_items[i].caption.text.toLowerCase());
                    }

                    //Add in any comments...
                    if(_items[i].comments.data.length > 0) {
                        for(j=0;j<_items[i].comments.data.length;j++) {
                            _searchFields.push(_items[i].comments.data[j].text.toLowerCase());
                        }
                    }

                    //Add in the users that are in the photo as an array (could just add as individual items really?)
                    if(_items[i].users_in_photo.length > 0) {
                        _usersInPhoto = [];
                        for(j=0;j<_items[i].users_in_photo.length;j++) {
                            _usersInPhoto.push('@' + _items[i].users_in_photo[j].user.username.toLowerCase());
                        }
                        _searchFields.push(_usersInPhoto);
                    }

                    //Loop through all filters
                    for(j=0;j<_thread.filters.length;j++) {
                        //What are we looking for?
                        _match = false;
                        _searchValue = '@' + _thread.filters[j].toLowerCase();

                        //Go through all of the search fields...
                        for(k=0;k<_searchFields.length;k++) {
                            //Does search value existin our field?
                            if(_searchFields[k].indexOf(_searchValue) !== -1) {
                                _match = true;
                            }

                            //If matched, then add it to the list (make sure we trim off the '@')
                            if(_match === true && _items[i].subGroups.indexOf(_searchValue.substr(1)) === -1) {
                                _items[i].subGroups.push(_searchValue.substr(1));
                            }
                        }
                    }

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


            //--------------------------------------------------------------------------
            // KEYWORD MATCHING
            //--------------------------------------------------------------------------
            if(_thread.keywords.length > 0) {
                //See if either CAPTION or COMMENTS match our criteria (if we have additional user mentioning on do we need to include that here?)

                //Caption
                _searchFields = [];
                if(_items[i].caption && _items[i].caption.text) {
                    _searchFields.push({id:'caption', value:_items[i].caption.text.toLowerCase()});
                }

                //Comments
                for(j=0;j<_items[i].comments.data.length;j++) {
                    _searchFields.push({id:'comment' + j, value:_items[i].comments.data[j].text});
                }

                //Check each keyword against the field
                for(l=0;l<_searchFields.length;l++) {
                    //Matches for this item
                    _keywordMatches = [];

                    for(j=0;j<_thread.keywords.length;j++) {
                        //Multiple words in each keyword block
                        for(k=0;k<_thread.keywords[j].length;k++) {

                            if(_searchFields[l].value.indexOf(_thread.keywords[j][k].toLowerCase()) > -1) {
                                _keywordMatches.push({str:_thread.keywords[j][k], base:_thread.keywords[j][0]});
                            }
                        }
                            //keywordsMatched
                    }

                    //Any matches?
                    if(_keywordMatches.length > 0) {
                        _items[i].keywordsMatched.push({id:_searchFields[l].id, matches:_keywordMatches});
                    }
                }
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

    //Setup the onclick function
    var _links = $('a.item-launch-link');
    for(i=0;i<_links.length;i++) {
        //Click
        $(_links[i]).on('click', function(_id) {
            this.showImageDetails(_id);
            //e.preventDefault();
            return false;
        }.bind(this, $(_links[i]).attr('data-id')));


    }

    //Hover on items
    $( 'a.item-launch-link' ).hover(
      function() {
        $( this ).addClass( 'hover' );
      }, function() {
        $( this ).removeClass( 'hover' );
      }
    );


    //Remove the loader?
    $('#loader-bar' + _thread.id).remove();

	//Move this thread from in-progress to complete
    this.searches.complete.push(this.searches['in-progress'].splice(this.findThread('in-progress', _thread.id), 1)[0]);

	//If there are still searches to do, then start the next one...
	if(this.searches['to-do'].length > 0) {
		this.initDormantThreads();
	}
};


//--------------------------------------------------------------------------
// CREATE AN ITEM TEMPLATE
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.createItemTemplate = function(_id, _threadID, _info) {
    return $(SuperSnooper.templates.item({
        'title': '@' + _info.user.username,
        //'title':_date.getDate() + '.' + _date.getMonth() + '.' + _date.getFullYear() + '-' + _date.getHours() + ':' + _date.getMinutes() + ':' + _date.getSeconds(),
        'likes':_info.likes.count,
        'comments':_info.comments.count,
        'image':_info.images.low_resolution.url,
        'date':_info.created_time,
        'circle-status':(_info.keywordsMatched.length === 0) ? 'hidden' : '',
        'data-id':_threadID + '|' + _id
    }));
};


//--------------------------------------------------------------------------
// SHOW AN IMAGE
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.showImageDetails = function(_ident) {
    //Get the info
    var _parts = _ident.split('|');
    var _info = this.items[parseInt(_parts[0])][parseInt(_parts[1])];

    //Caption Content HTML
    var _caption = '';
    var _date = '';
    var _dateString;
    if(_info.caption && _info.caption.text) {
        _date = new Date(parseInt(_info.timestamp) * 1000);
        _dateString = this.padString(_date.getDate()) + '-' + this.padString(_date.getMonth() + 1) + '-' + (_date.getYear() - 100);
        _caption += 'Original Caption<br/><div class="itemview-caption"><div class="itemview-caption-date">' + _dateString +'</div>' + _info.caption.text + '</div>';
    }

    //Download link
    var _downloadLink = SuperSnooper.api.url + 'get-file.php?remote-filename=' + _info.images.standard_resolution.url + '&filename=' + _info.user.username;

    //Create the content
    var _content  = SuperSnooper.templates['item-fullview']({
        title:'@' + _info.user.username,
        avatar_url:_info.user.profile_picture,
        image_url:_info.images.standard_resolution.url,
        likes:_info.likes.count,
        comments:_info.comments.count,
        caption_content:_caption,
        match:'Blue',
        file_download_link:_downloadLink
    });

    //Lightbox
    this.lightBoxOpen(_content);

};


//--------------------------------------------------------------------------
// SHOW A LIGHT BOX
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.lightBoxOpen = function(_content) {
    //Add the lightbox with this content
    $('body').append(SuperSnooper.templates.lightbox({content:_content}));

    //Add a close event to the light box background and close button
    $('.lightbox-fill').on('click', function(e) {
        this.lightBoxClose();
        e.preventDefault();
    }.bind(this));

    //Stop scrolling on main
    $('body').addClass('scroll-locked');

};

//--------------------------------------------------------------------------
// CLOSE THE LIGHT BOX
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.lightBoxClose = function() {
    //Drop the lightbox
    $('.lightbox-container').remove();

    //Add scrolling back on main
    $('body').removeClass('scroll-locked');
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
// PAD A STRING
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.padString = function(_str, _pad, _length) {
    _str = _str + '';
    _pad = _pad || '0';
    _length = _length || 2;
    while(_str.length < _length) {
        _str = _pad + _str;
    }
    return _str;
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


//--------------------------------------------------------------------------
// FIND A THREAD OF A GIVEN TYPE
//--------------------------------------------------------------------------
SuperSnooper.APIManager.prototype.findThread = function(_type, _id) {
    var _num = -1;
    for(var i=this.searches[_type].length - 1;i>=0;i--) {
        if(this.searches[_type][i].id === _id) {
            _num = i;
        }
    }
    return _num;
};