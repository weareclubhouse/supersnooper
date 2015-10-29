/*
*   @site           SuperSnooper
*   @function       Info / Search Bar
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper:true*/
/*jshint camelcase: false */

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Modules.InfoBar = function(_itemManager) {
    //Reference the item manager
    this.itemManager = _itemManager;

    //Elements
    this.bar = $('.header__search');
    this.infoButton = $('.header__search__info__button');
    this.exportButton = $('#button-data-export');

    //Pause button event
    this.infoButton.on('click', function(_event) {
        SuperSnooper.Signals.api.dispatch('state-toggle', {});
        _event.preventDefault();
    }.bind(this));
};

//Definition
SuperSnooper.Modules.InfoBar.constructor = SuperSnooper.Modules.InfoBar;


//--------------------------------------------------------------------------
//  INIT (STARTING A SEARCH)
//--------------------------------------------------------------------------
SuperSnooper.Modules.InfoBar.prototype.init = function() {
    //Remove the hidden state on the bar
    this.bar.removeClass('hidden');

    //Hide the pause button until we get our first set of results
    this.infoButton.addClass('hidden');
    this.infoButton.html('PAUSE');

    //Hide the data export button
    this.exportButton.addClass('inactive');

    //Set the text
    $('.header__search__label').html('Starting search...');
    $('.header__search__info__text').html('');
};



//--------------------------------------------------------------------------
//  HIDE (NOT CURRENTLY USED)
//--------------------------------------------------------------------------
SuperSnooper.Modules.InfoBar.prototype.hide = function() {
    this.bar.addClass('hidden');
};


//--------------------------------------------------------------------------
//  SEARCH BAR UPDATE
//--------------------------------------------------------------------------
SuperSnooper.Modules.InfoBar.prototype.update = function(_vars) {
    //Pause button
    this.infoButton.removeClass('hidden');

    //If we actually have some data, then show the export data button
    this.exportButton.removeClass('inactive');

    //Build our strings
    var _left = (_vars.complete) ? 'Search complete.' : 'Searching';
    var _right = (_vars.complete) ? 'We‘ve ' : 'So far, we‘ve ';
    _right += 'found <b>' + this.itemManager.items.length + '</b> dating back to <b>' + SuperSnooper.helper.padString(this.itemManager.dateOldest.getUTCDate()) + '-' + SuperSnooper.helper.padString(this.itemManager.dateOldest.getUTCMonth() + 1) + '-' + (this.itemManager.dateOldest.getYear() - 100) + '</b>';

    //Title text LHS
    if(!_vars.complete) {
        if(SuperSnooper.helper.searchTerms.type === 'user') {
            //USER - we don't know the count here...

            //Add on text for keywords and mentions
            if(SuperSnooper.helper.searchTerms.filters !==  '') {
                _left += ' for tags';
                _left += (this.searchTerms.keywords.length > 0) ? ' and keywords' : '';
            } else if(SuperSnooper.helper.searchTerms.keywords.length > 0) {
                _left += ' for keywords';
            }
        } else {
            //TAG, so we need to know the count
            _left += ' <b>' + _vars.searchTerms.tagCount + '</b> tagged photos';

            //Add on text for keywords and mentions
            if(SuperSnooper.helper.searchTerms.filters !==  '') {
                _left += ' for @mentions';
                _left += (SuperSnooper.helper.searchTerms.keywords.length > 0) ? ' and keywords' : '';
            } else if(SuperSnooper.helper.searchTerms.keywords.length > 0) {
                _left += ' for keywords';
            }

            //$('.header__search__label').html('Checked ' + _vars.itemCountProcessed + ' of ' + _vars.searchTerms.tagCount + ' tagged photos'); //_vars.itemCountProcessed
        }

        //Dots
        _left += '...';
    }

    //If
    if(this.itemManager.items.length !== _vars.itemCountProcessed ) {
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