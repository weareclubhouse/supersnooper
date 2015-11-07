/*
*   @site           SuperSnooper
*   @function       Item
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper:false console:true*/
/*jshint camelcase: false */

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Modules.Item = function(_id, _data) {
    //Two templates (wrapper and the inner content that only shows at certain times)
    this.html = {
        'wrapper':this.generateWrapperHTML(_id, _data),
        'inner':this.generateInnerHTML(_id, _data)
    };

    //Flag
    this.isActive = false;

    //Assign a link to the wrapper HTML's link
    this.html.wrapper.on('click.item', function(_id, _data, _event) {
        //Dispatch an event
        console.log('clicky');
        SuperSnooper.Signals.viewer.dispatch('open', {id:_id, data:_data});
        _event.preventDefault();
        return false;
    }.bind(this, _id, _data));


    //background-image:url({{image}});
};

//Definition
SuperSnooper.Modules.Item.constructor = SuperSnooper.Modules.Item;


//--------------------------------------------------------------------------
//  GET THE WRAPPER HTML
//--------------------------------------------------------------------------
SuperSnooper.Modules.Item.prototype.getHTML = function(_id) {
    return this.html[_id];
};


//--------------------------------------------------------------------------
// WRAPPER CONTENT
//--------------------------------------------------------------------------
SuperSnooper.Modules.Item.prototype.generateWrapperHTML = function(_id, _info) { //itemWrapper
    //HTML
    var _html = SuperSnooper.templates.itemWrapper({
        'likes-count':_info.likes.count,
        'keywords-count':_info.keywordMatches.words.length,
        'comments-count':_info.comments.count,
        'date':_info.created_time,
        'id':'item' + _id,
        'image':_info.images.low_resolution.url,
        'extra-classes':(_info.keywordMatches.words.length !== 0) ? 'result-item--keyword-match' : '',
    });

    //Return cast object
    return $(_html);
};



//--------------------------------------------------------------------------
// INNER CONTENT
//--------------------------------------------------------------------------
SuperSnooper.Modules.Item.prototype.generateInnerHTML = function(_id, _info) { //itemWrapper
    //HTML
    var _html = SuperSnooper.templates.itemFull({
        'likes-count':_info.likes.count,
        'keywords-count':_info.keywordMatches.words.length,
        'comments-count':_info.comments.count,
        'date':_info.created_time,
        'id':'item' + _id,
        'image':_info.images.low_resolution.url,
        'extra-classes':(_info.keywordMatches.words.length !== 0) ? 'result-item--keyword-match' : '',
        'title': '@' + _info.user.username,
        'likes':SuperSnooper.helper.padString(_info.likes.count, '0', 2, true),
        'comments':SuperSnooper.helper.padString(_info.comments.count, '0', 2, true)
    });

    //Return cast object
    return $(_html);
};