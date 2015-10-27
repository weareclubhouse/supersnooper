/*
*   @site           SuperSnooper
*   @function       Display Manager
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper,Isotope:true*/
/*jshint camelcase: false */
/*jshint loopfunc: true */

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager = function() {
    //Listen for API signals
    SuperSnooper.Signals.api.add(this.apiMonitor = function(_method, _vars) { this.apiEvent(_method, _vars); }.bind(this));

    //Setup a temporary ISOTOPE object
    this.isotopes = {};

    //Search
    this.searchTerms = {};
    this.dateOldestTime = 0;

    //Items
    this.items = [];
    this.nextItem = -1;
    this.batchProcessMax = 1;

    //Lightbox
    this.lightBoxContentType = '';

    //Pause button
    $('.header__search__info__button').on('click', function() {
        SuperSnooper.Signals.api.dispatch('state-toggle', {});
    }.bind(this));

};

//Definition
SuperSnooper.DisplayManager.constructor = SuperSnooper.DisplayManager;


//--------------------------------------------------------------------------
//  API EVENT
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.apiEvent = function(_method, _vars) {
    if(_method === 'search-init') {
        //SEARCH init
         this.createIsotopeGroup('dummy');

         //Store the search terms for reference when displaying the items
         this.searchTerms = _vars.searchTerms;
         this.dateOldest = new Date();
         this.dateOldestTime = this.dateOldest.getTime();

         //Calculate a few things to search agains
         this.searchTerms.tagMatch = (this.searchTerms.type === 'tag') ? this.searchTerms.search.split(',') : this.searchTerms.filters.split(',');
         this.searchTerms.userMatch = (this.searchTerms.type === 'tag') ? this.searchTerms.filters.split(',') : this.searchTerms.search.split(',');

         //Blank the item list
         this.items = [];
         this.nextItem = -1;

         //Kill the interval if it is running
         if(this.itemAddTimer !== undefined) {
            clearInterval(this.itemAddTimer);
            this.itemAddTimer = null;
         }

        //Init the search bar
        this.searchBarInit();


        //SEARCH started, so show the loader
        $('.loader').removeClass('hidden');
    } else if(_method === 'search-start') {

        //THIS IS CALLED EVERYTIME SOME NEW DATA IS FETCHED
    } else if(_method === 'items-add') {
        //NEW ITEMS added
        this.itemsAdd(_vars.items);

        //Update the search panel with our new text!
        this.searchBarUpdate(_vars);
    } else if(_method === 'state-set') {
        //STATE set
        if(_vars.state === 'go') {
            //GO
            $('.header__search__info__button').html('PAUSE');
            $('.loader').removeClass('hidden');
        } else if(_vars.state === 'pause') {
            //PAUSED
            $('.header__search__info__button').html('RESUME');
            $('.loader').addClass('hidden');
        } else if(_vars.state === 'stop') {
            //STOPPED
            $('.header__search__info__button').html('DONE').addClass('hidden');
            $('.loader').addClass('hidden');
        }
    }
};


//--------------------------------------------------------------------------
//  SEARCH BAR HIDE
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.searchBarHide = function() {
    $('.header__search').addClass('hidden');
};


//--------------------------------------------------------------------------
//  SEARCH BAR SHOW
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.searchBarInit = function() {
    //Remove the hidden state on the bar
    $('.header__search').removeClass('hidden');

    //Hide the pause button until we get our first set of results
    $('.header__search__info__button').addClass('hidden');
    $('.header__search__info__button').html('PAUSE');

    //Hide the data export button
    $('#button-data-export').addClass('inactive');

    //Set the text
    $('.header__search__label').html('Starting search...');
    $('.header__search__info__text').html('');


};

//--------------------------------------------------------------------------
//  SEARCH BAR UPDATE
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.searchBarUpdate = function(_vars) {
    //Pause button
    $('.header__search__info__button').removeClass('hidden');

    //If we actually have some data, then show the export data button
    $('#button-data-export').removeClass('inactive');

    //Calculate the oldest item
    var _stamp;
    for(var i=0;i<_vars.items.length;i++) {
        //Timestamp for item
        _stamp = parseInt(_vars.items[i].created_time * 1000);

        //Older than previous oldest date?
        if(_stamp < this.dateOldestTime) {
            //Older date!
            this.dateOldestTime = _stamp;
            this.dateOldest = new Date(_stamp);
        }
    }

    //Build our strings
    var _left = (_vars.complete) ? 'Search complete.' : 'Searching';
    var _right = (_vars.complete) ? 'We‘ve ' : 'So far, we‘ve ';
    _right += 'found <b>' + this.items.length + '</b> dating back to <b>' + this.padString(this.dateOldest.getUTCDate()) + '-' + this.padString(this.dateOldest.getUTCMonth() + 1) + '-' + (this.dateOldest.getYear() - 100) + '</b>';

    //Title text LHS
    if(!_vars.complete) {
        if(this.searchTerms.type === 'user') {
            //USER - we don't know the count here...

            //Add on text for keywords and mentions
            if(this.searchTerms.filters !==  '') {
                _left += ' for tags';
                _left += (this.searchTerms.keywords.length > 0) ? ' and keywords' : '';
            } else if(this.searchTerms.keywords.length > 0) {
                _left += ' for keywords';
            }
        } else {
            //TAG, so we need to know the count
            _left += ' <b>' + _vars.searchTerms.tagCount + '</b> tagged photos';

            //Add on text for keywords and mentions
            if(this.searchTerms.filters !==  '') {
                _left += ' for @mentions';
                _left += (this.searchTerms.keywords.length > 0) ? ' and keywords' : '';
            } else if(this.searchTerms.keywords.length > 0) {
                _left += ' for keywords';
            }

            //$('.header__search__label').html('Checked ' + _vars.itemCountProcessed + ' of ' + _vars.searchTerms.tagCount + ' tagged photos'); //_vars.itemCountProcessed
        }

        //Dots
        _left += '...';
    }

    //If
    if(this.items.length !== _vars.itemCountProcessed ) {
        //Show how many we have found
        _right += ', checked <b>' + _vars.itemCountProcessed + '</b>';
    }

    //Set the text
    $('.header__search__label').html(_left);
    $('.header__search__info__text').html(_right);

    //Dan's Notes
    /*
    HASHTAG & @MENTIONS
    Left: Searching 122,327 tagged photos for keywords and @mentions
    Right: So far, we‘ve checked 6547 dating back to 14-03-15


    User searches keywords alongside a hashtag:
    Left:Searching 122,327 tagged photos for keywords
    Right: So far, we‘ve checked 6547 dating back to 14-03-15

    User searches @Mentions alongside a hashtag:
    Left: Searching 122,327 tagged photos for @Mentions
    Right: So far, we‘ve checked 6547 dating back to 14-03-15

    @MENTIONS only
    Right: So far, we‘ve displayed 6547 dating back to 14-03-15

    HASHTAGS only
    Left: We‘ve found 122,327 tagged photos
    Right: So far, we‘ve displayed 6547 dating back to 14-03-15
    */
};


//--------------------------------------------------------------------------
//  ADD SOME ITEMS OLD BATCH METHOD
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.itemsAdd = function(_items) {
    //Add to the list
    for(var i=0;i<_items.length;i++) {
        //Add to the item list
        this.items.push(_items[i]);
    }

    //Is the interval running?
    if(this.itemAddTimer === undefined || this.itemAddTimer === null) {
        this.itemAddTimer = setInterval(function () { this.addNextItem(); }.bind(this), 25);
    }
};



//--------------------------------------------------------------------------
//  ADD SOME ITEMS
//--------------------------------------------------------------------------
/*SuperSnooper.DisplayManager.prototype.itemsAdd = function(_items) {
    //Add to the list
    var _item;
    var i;

    for(i=0;i<_items.length;i++) {
        //Add to the item list
        this.items.push(_items[i]);

        //Add
        _item = this.createResultsItem(this.items.length - 1, this.items[this.items.length - 1]);
        this.isotopes.dummy.insert(_item);
    }

    //Links
    this.setupResultItemLinks();
};*/



//--------------------------------------------------------------------------
//  ADD THE NEXT ITEM (DEPREACTED FOR NOW)
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.addNextItem = function() {
    //Add a batch of images
    for(var i=0;i<this.batchProcessMax;i++) {
        //Inc
        this.nextItem++;

        //Is there a valid item?
        if(this.nextItem < this.items.length) {
            //Create the item
            var _listID = 'dummy'; //calculate this from
            //var _id = this.items.length - 1;
            var _item = this.createResultsItem(this.nextItem, this.items[this.nextItem]);
            this.isotopes[_listID].insert(_item);


        } else {
            //Stop!
            this.nextItem--;
            clearInterval(this.itemAddTimer);
            this.itemAddTimer = null;
            //break;
        }
    }

    //Links
    this.setupResultItemLinks();


};


//--------------------------------------------------------------------------
//  SETUP THE RESULT ITEM LINKS (THIS NEEDS TO BE MORE EFFECIENT)
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.setupResultItemLinks = function() {
    var _links = $('a.result-item-wrapper');
    for(var i=0;i<_links.length;i++) {
        //Remove old listeners
        $(_links[i]).off('.items');
        $(_links[i]).on('click.items', function(_id) {
            this.showImageDetails(_id);
            return false;
        }.bind(this, i));
    }
};


//--------------------------------------------------------------------------
//  CREATE AN ISOTOPE GROUP
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.createIsotopeGroup = function(_id) {
    //Inject the ISOTOPE template HTML
    $('.result-list').append(SuperSnooper.templates.itemlist({id:_id}));

    //Make the ISOTOPE object with the given ID (either DATE or DATE-SUBCLASS)
    this.isotopes[_id] = new Isotope(document.querySelector('.result-list-items#' + _id), {
        //LAYOUT
        masonry: {
            //isFitWidth: true
            columnWidth: 190,
            gutter: 10
        },

       hiddenStyle: {
            opacity: 0
        },
        visibleStyle: {
            opacity: 1
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
// CREATE AN ITEM TEMPLATE FROM A GIVEN SET OF INFO (RESULTS ITEM)
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.createResultsItem = function(_id, _info) {
    //HTML
    var _html = SuperSnooper.templates.item({
        'title': '@' + _info.user.username,
        //'title':_date.getDate() + '.' + _date.getMonth() + '.' + _date.getFullYear() + '-' + _date.getHours() + ':' + _date.getMinutes() + ':' + _date.getSeconds(),
        'likes':this.padString(_info.likes.count),
        'comments':this.padString(_info.comments.count),
        'image':_info.images.low_resolution.url,
        'date':_info.created_time,
        'highlight-header':(_info.keywordMatches.words.length !== 0) ? 'result-item__header--keyword-match' : '',
        'highlight-footer':(_info.keywordMatches.words.length !== 0) ? 'result-item__footer--keyword-match' : '',
        'id':'item' + _id
    });

    //Click handler?

    //Return cast object
    return $(_html);
};



//--------------------------------------------------------------------------
// SHOW AN IMAGE
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.showImageDetails = function(_id) {
    //Get the info
    var _info = this.items[_id];

    //Info about what was a match
    var i;
    var _caption = '';
    var _date = new Date(parseInt(_info.created_time) * 1000); //_info.timestamp
    var _dateString = this.padString(_date.getDate()) + '-' + this.padString(_date.getMonth() + 1) + '-' + (_date.getYear() - 100);

    //Caption is displayed regardless....
    if(_info.caption && _info.caption.text) { // && (!_info.filtered || _info.filterMatches.indexOf('caption') !== -1)
        _caption = 'Original Caption';
        //_caption += (_info.filtered && _info.filterMatches.indexOf('caption') === -1) ? ' (No keyword match)' : ''; //REMOVED THIS AS WE ADDED IMAGE TAGGING
        _caption += '<br/><div class="itemview-caption"><div class="itemview-caption-date">' + _dateString +'</div>' + this.filterText(_info.caption.text) + '</div>';
    } else {
        _caption = 'No Caption';
        _caption += '<br/><div class="itemview-caption"><div class="itemview-caption-date">' + _dateString +'</div>Looks like they let the lens do the talking on this occasion!</div>';
    }

    //Comments
    var _commentsAdded = false;
    if(_info.comments) {
        for(i=0;i<_info.comments.data.length;i++) {
            if(_info.filterMatches.indexOf('comment' + i) !== -1 || _info.keywordMatches.fields.indexOf('comment' + i) !== -1) {
                //Title bar
                if(!_commentsAdded) {
                    _caption += '<br/>Comments matching search<br/>';
                    _commentsAdded = true;
                }

                _date = new Date(parseInt(_info.comments.data[i].created_time) * 1000); //_info.timestamp
                _dateString = this.padString(_date.getDate()) + '-' + this.padString(_date.getMonth() + 1) + '-' + (_date.getYear() - 100);
                _caption += '<div class="itemview-caption"><div class="itemview-caption-date">' + _dateString +'</div>';
                _caption += '<a href="http://www.instagram.com/' + _info.comments.data[i].from.username + '/" target="_blank">@' + _info.comments.data[i].from.username;
                _caption += (_info.comments.data[i].from.username === _info.user.username) ? ' (Picture Owner)' : ' (Not Picture Owner)';
                _caption += '</a><br/>';
                _caption += this.filterText(_info.comments.data[i].text) + '</div>';
            }
        }
    }

    //Download link
    var _downloadLink = SuperSnooper.api.url + 'get-file.php?remote-filename=' + _info.images.standard_resolution.url + '&filename=' + _info.user.username;

    //Keyword match label
    var _matchLabel = '';
    if(_info.keywordMatches.words.length > 0) {
        //First word
        _matchLabel = _info.keywordMatches.words[0].master.substr(0, 1).toUpperCase() + _info.keywordMatches.words[0].master.substr(1);

        //Extras?
        if(_info.keywordMatches.words.length > 1) {
            _matchLabel += ' (+' + (_info.keywordMatches.words.length - 1) + ')';
        }
    }

    //Is user in photo?
    var _userInPhoto = false;
    for(i=0;i<_info.filterMatches.length;i++) {
        if(_info.filterMatches[i].indexOf('user_in_photo') !== -1) {
            _userInPhoto = true;
            break;
        }
    }

    //Create the content
    var _content  = SuperSnooper.templates['item-fullview']({
        title:_info.user.username,
        avatar_url:_info.user.profile_picture,
        image_url:_info.images.standard_resolution.url,
        likes:_info.likes.count,
        comments:_info.comments.count,
        caption_content:_caption,
        match:'',
        'circle-status':(_info.keywordMatches.words.length === 0) ? 'hidden' : '',
        'user-tag-status':(!_userInPhoto) ? 'hidden' : '',
        'user-tag-name':(this.searchTerms.userMatch.length > 0) ? '@' + this.searchTerms.userMatch[0] : '',
        'keyword-match':_matchLabel,
        file_download_link:_downloadLink
    });

    //Lightbox
    this.lightBoxOpen(_content, 'image');

};



//--------------------------------------------------------------------------
// FILTER OUR TEXT
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.filterText = function(_str) {
    //Hash Tags and Usernames
    _str = this.stringSearch(_str, this.searchTerms.tagMatch, /(#[\w]+)/ig, '_h001');
    _str = this.stringSearch(_str, this.searchTerms.userMatch, /(@[\w]+)/ig, '_h002');

    //Keywords
    _str = this.keywordSearch(_str, '_h003');

    //Return
    return _str;
};


//--------------------------------------------------------------------------
// FILTER OUR STRINGS
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.stringSearch = function(_str, _matchList, _reg, _highlightClass) {
    //Reg Exp match
    _str = _str.replace(_reg, function(_str, _match) { // old (^|\s) a-z\d-_
        if(_match && _matchList.indexOf(_str.toLowerCase().split(' ').join('').substr(1)) !== -1) {
            return '<span class="' + _highlightClass + '">' + _str +'</span>';
        } else {
            return _str;
        }
    }.bind(this));

    //Return
    return _str;
};


//--------------------------------------------------------------------------
// FILTER FOR KEYWORDS
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.keywordSearch = function(_str, _highlightClass) {

    //Words
    var _words = SuperSnooper.forms.keywords;

    for(var i=0;i<_words.length;i++) {
        //Master word
        _str = this.keywordSearchWord(_str, _words[i].master, _highlightClass);

        //Variants
        for(var j=0;j<_words[i].variants.length;j++) {
            _str = this.keywordSearchWord(_str, _words[i].variants[j], _highlightClass);
        }
    }

    //Return
    return _str;
};


//--------------------------------------------------------------------------
// FILTER FOR KEYWORDS
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.keywordSearchWord = function(_str, _word, _highlightClass) {
    //Loop through all of our keywords and mark where they should
    _str = _str.replace(new RegExp(_word, 'i'), function(_str, _match) { // old (^|\s) a-z\d-_
        if(_match) {
            return '<span class="' + _highlightClass + '">' + _str +'</span>';
        } else {
            return _str;
        }
    }.bind(this));

    //Return it
    return _str;
};






//--------------------------------------------------------------------------
// SHOW A LIGHT BOX
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.lightBoxOpen = function(_content, _contentType) {
    //Add the lightbox with this content
    $('body').append(SuperSnooper.templates.lightbox({content:_content}));

    //Add the open class to the lightbox (to trigger animation)
    setTimeout( function() {
    $('.lightbox-content').addClass('open');
}.bind(this), 50);

    //Add a close event to the light box background and close button
    $('.lightbox-fill').on('click', function(e) {
        this.lightBoxClose();
        e.preventDefault();
    }.bind(this));

    $('#button-close').on('click', function(e) {
        this.lightBoxClose();
        e.preventDefault();
    }.bind(this));

    //Hover effect
    $('.lightbox-content .button').hover(function() { $(this).addClass('over'); }, function() { $(this).removeClass('over'); });

    //Stop scrolling on main
    $('body').addClass('scroll-locked');

    //Store the type
    this.lightBoxContentType = _contentType;

};

//--------------------------------------------------------------------------
// CLOSE THE LIGHT BOX
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.lightBoxClose = function(_clearContent) {
    //Do anything extra?
    _clearContent = (_clearContent === undefined) ? true : _clearContent;
    if(_clearContent && this.lightBoxContentType === 'keywords') {
        SuperSnooper.forms.updateKeywords(false);
    }

    //Blank the content type
    this.lightBoxContentType = '';

    //Drop the lightbox
    $('.lightbox-container').remove();

    //Add scrolling back on main
    $('body').removeClass('scroll-locked');
};






//--------------------------------------------------------------------------
// PAD A STRING (MOVE TO A UTILITY CLASS)
//--------------------------------------------------------------------------
SuperSnooper.DisplayManager.prototype.padString = function(_str, _pad, _length, _ignoreZero) {
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