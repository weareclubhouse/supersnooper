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
    var _downloadLink = SuperSnooper.api.url + 'get-file.php?remote-filename=' + _info.images.standard_resolution.url + '&filename=' + _info.user.username;

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
        'image_url':_info.images.standard_resolution.url,
        'counts':{likes:_info.likes.count, comments:_info.comments.count},
        'user-tag-status':(!_userInPhoto) ? 'itemview__phototag--hidden' : '',
        'user-tag-name':(SuperSnooper.helper.searchTerms.userMatch.length > 0) ? '@' + SuperSnooper.helper.searchTerms.userMatch[0] : '',
        'file_download_link':_downloadLink,
        'comments':_comments
    });

    //Lightbox
    SuperSnooper.Signals.lightbox.dispatch('open', {type:'image', content:_content});
};



//--------------------------------------------------------------------------
// GET A DISPLAY DATE FROM A TIMESTAMP
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemViewer.prototype.getDisplayDate = function(_str) {
    //Date, then get some strings
    var _date = new Date(parseInt(_str) * 1000); //_info.timestamp
    var _dateString = SuperSnooper.helper.padString(_date.getDate()) + '-' + SuperSnooper.helper.padString(_date.getMonth() + 1) + '-' + (_date.getYear() - 100);
    var _timeString = SuperSnooper.helper.padString(_date.getHours() % 12) + '.' + SuperSnooper.helper.padString(_date.getMinutes());
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
    _str = this.stringSearch(_str, SuperSnooper.helper.searchTerms.tagMatch, /(#[\w]+)/ig, '_h001');
    _str = this.stringSearch(_str, SuperSnooper.helper.searchTerms.userMatch, /(@[\w]+)/ig, '_h002');

    //Keywords
    _str = this.keywordSearch(_str, '_h003');

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
SuperSnooper.Modules.ItemViewer.prototype.keywordSearchWord = function(_str, _word, _highlightClass) {
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