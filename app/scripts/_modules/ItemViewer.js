/*
*   @site           SuperSnooper
*   @function       Item Viewer
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper,signals:true*/
/*jshint camelcase: false */

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer = function() {
    //Create a signal object
    SuperSnooper.Signals.viewer = new signals.Signal();
    SuperSnooper.Signals.viewer.add(this.viewerEventListener = function(_method, _vars) { this.viewerEvent(_method, _vars); }.bind(this));

    //Listen for events on the image loader
    SuperSnooper.Signals.images.add(function(_method, _vars) { this.imageEvent(_method, _vars); }.bind(this));

    //Store the info for the item we are viewing
    this.info = {};
};

//Definition
SuperSnooper.Modules.ItemViewer.constructor = SuperSnooper.Modules.ItemViewer;


//--------------------------------------------------------------------------
//  EVENT
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer.prototype.viewerEvent = function(_method, _vars) {
    if(_method === 'open') {
        this.showImageDetails(_vars.id, _vars.data);
    }
};


//--------------------------------------------------------------------------
// SHOW AN IMAGE
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer.prototype.showImageDetails = function(_id, _info) {
    //Info about what was a match
    var i;
    var _comments = [];

    //Info
    this.info = _info;

    //Caption is displayed regardless....
    if(_info.caption && _info.caption.text) { // && (!_info.filtered || _info.filterMatches.indexOf('caption') !== -1)
        //User caption
        _comments.push({date:this.getDisplayDate(_info.created_time), user:_info.user.username, comment:this.filterText(_info.caption.text), split:false, linkUser:true});
    } else {
        //No caption,
        _comments.push({date:this.getDisplayDate(_info.created_time), user:'Image has no caption.', comment:'', split:false, linkUser:false});
    }

    //Comments
    if(_info.comments) {
        for(i=0;i<_info.comments.data.length;i++) {
            if(_info.filterMatches.indexOf('comment' + i) !== -1 || _info.keywordMatches.fields.indexOf('comment' + i) !== -1) {

                //No longer bothered with comment date... this.getDisplayDate(_info.comments.data[i].created_time);
                /*_caption += '<div class="itemview__caption">'; //date removed <div class="itemview__caption__date">' + _dateString + _timeString + '</div>
                _caption += '<a href="http://www.instagram.com/' + _info.comments.data[i].from.username + '/" target="_blank">@' + _info.comments.data[i].from.username;
                _caption += (_info.comments.data[i].from.username === _info.user.username) ? ' (Picture Owner)' : ' (Not Picture Owner)';
                _caption += '</a><br/>';
                _caption += this.filterText(_info.comments.data[i].text) + '</div>';*/

                //Add to comments list
                _comments.push({date:'', time:'', user:_info.comments.data[i].from.username, comment:this.filterText(_info.comments.data[i].text), split:true, linkUser:true});
            }
        }
    }

    //Download link
    var _downloadLink = SuperSnooper.api.url + 'get-file.php?remote-filename=' + _info.images.standard_resolution.url + '&filename=' + this.getDownloadFilename();

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
        'title':_info.user.username,
        'avatar_url':_info.user.profile_picture,
        //'image_url':_info.images.standard_resolution.url,
        'counts':{likes:SuperSnooper.helper.padString(_info.likes.count, '0', 2, true), comments:SuperSnooper.helper.padString(_info.comments.count, '0', 2, true)},
        'user-tag-status':(!_userInPhoto) ? 'itemview__phototag--hidden' : '',
        'user-tag-name':(SuperSnooper.helper.searchTerms.names !== '') ? '@' + SuperSnooper.helper.searchTerms.names : '',
        'file_download_link':_downloadLink,
        'comments':_comments
    });

    //Lightbox
    SuperSnooper.Signals.lightbox.dispatch('open', {type:'image', content:_content});

    //Image loading...
    this.loadImage(this.info.images.standard_resolution.url);
};


//--------------------------------------------------------------------------
// LOAD/SHOW THE IMAGE
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer.prototype.getDownloadFilename = function() {
    var _date = new Date(parseInt(this.info.created_time) * 1000); //_info.timestamp
    var _str = this.info.user.username + ' - ';
    _str += _date.getFullYear() + '-';
    _str += SuperSnooper.helper.padString(_date.getMonth() + 1) + '-';
    _str += SuperSnooper.helper.padString(_date.getDate()) + ' - ';
    _str += SuperSnooper.helper.padString(_date.getHours()) + '.';
    _str += SuperSnooper.helper.padString(_date.getMinutes()) + '.';
    _str += SuperSnooper.helper.padString(_date.getSeconds());

    //dancopppock - 2015-10-15 - 22.40
    return _str;
};


//--------------------------------------------------------------------------
// LOAD/SHOW THE IMAGE
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer.prototype.loadImage = function(_src) {
    if(SuperSnooper.images.status(_src) !== 'loaded') {
        //We need to load this image
        if(SuperSnooper.images.status(_src) === 'none') {
            SuperSnooper.images.load(_src);
        }

        //Show the loader
        $('.itemview .loader').removeClass('hidden');
    } else {
        //Already in the cache!
        this.revealImage(_src);
    }
};


//--------------------------------------------------------------------------
//  IMAGE EVENT
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer.prototype.imageEvent = function(_method, _vars) {
    if(_method === 'loaded' && _vars.image.src === this.info.images.standard_resolution.url) {
        //Reveal the image
        this.revealImage(_vars.image.src);
    }
};


//--------------------------------------------------------------------------
// LOAD THE IMAGE
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer.prototype.revealImage = function(_src) {
    //Set the background image on the main item
    $('.itemview .itemview__image').css({'background-image':'url("'+ _src + '")', opacity:0});
    $('.itemview .itemview__image').animate({opacity:1}, 500);

    //Hide the loader
    $('.itemview .loader').addClass('hidden');
};



//--------------------------------------------------------------------------
// GET A DISPLAY DATE FROM A TIMESTAMP
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer.prototype.getDisplayDate = function(_str) {
    //Date, then get some strings
    var _date = new Date(parseInt(_str) * 1000); //_info.timestamp
    var _dateString = SuperSnooper.helper.padString(_date.getDate()) + '-' + SuperSnooper.helper.padString(_date.getMonth() + 1) + '-' + (_date.getYear() - 100);
    var _hours = _date.getHours() % 12;
    if(_hours === 0) {
        _hours = 12;
    }
    var _timeString = SuperSnooper.helper.padString(_hours) + '.' + SuperSnooper.helper.padString(_date.getMinutes());
    _timeString += (_date.getHours() >= 12) ? 'pm' : 'am';

    //Return the object
    return  {
        date:_dateString,
        time:_timeString
    };
};


//--------------------------------------------------------------------------
// FILTER OUR TEXT
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer.prototype.filterText = function(_str) {
    //Hash Tags and Usernames
    _str = this.stringSearch(_str, SuperSnooper.helper.searchTerms.tags.split(','), /(#[\w]+)/ig, '__h001');
    _str = this.stringSearch(_str, SuperSnooper.helper.searchTerms.names.split(','), /(@[\w]+)/ig, '__h002');

    //Keywords
    _str = this.keywordSearch(_str, '__h003');

    //Return
    return _str;
};


//--------------------------------------------------------------------------
// FILTER OUR STRINGS
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer.prototype.stringSearch = function(_str, _matchList, _reg, _highlightClass) {
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
SuperSnooper.Modules.ItemViewer.prototype.keywordSearch = function(_str, _highlightClass) {
    //Loop through the search terms
    var _words = SuperSnooper.helper.searchTerms.keywords.split(',');

    for(var i=0;i < _words.length;i++) {
        //Master word
        _str = this.keywordSearchWord(_str, _words[i], _highlightClass);

        //Variants
        /*
        for(var j=0;j<SuperSnooper.helper.searchTerms.keywords[i].variants.length;j++) {
            _str = this.keywordSearchWord(_str, SuperSnooper.helper.searchTerms.keywords[i].variants[j], _highlightClass);
        }*/
    }

    //Return
    return _str;
};


//--------------------------------------------------------------------------
// FILTER FOR KEYWORDS
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer.prototype.keywordSearchWord = function(_str, _word, _highlightClass) {


    //Loop through all of our keywords and mark where they should
    _str = _str.replace(new RegExp(_word, 'i'), function(_subString, _match) { // old (^|\s) a-z\d-_
        if(_match !== -1) {
            //Found a potential match for the word (use the helper function to check for extra valid matches)
            if(SuperSnooper.helper.keywordValidate(_subString, _match, _str)) {
                return '<span class="' + _highlightClass + '">' + _subString +'</span>';
            } else {
                return _subString;
            }
        } else {
            return _subString;
        }
    }.bind(this));

    //Return it
    return _str.trim();
};