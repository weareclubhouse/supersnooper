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

    //Counts
    this.counts = {
        total:0,
        snooped:0,
        matched:0
    };


    //Dates
    this.dateOldest = new Date();
    this.dateOldestTime = -1;

    //State
    this.state = '';

    //Labels
    this.buttonLabels = {
        'info':{
            'init': 'STARTING SEARCH',
            'go': 'PAUSE SEARCH', //match the names of the events from the API
            'pause': 'RESUME SEARCH',
            'stop': 'SEARCH COMPLETE'
        }
    };

    //Elements
    this.bar = $('.searchbar'); //formerly header__search
    this.infoButton = $('#searchbar-button-info');
    this.exportButton = $('#searchbar-button-export');

    //Listen for API signals
    SuperSnooper.Signals.api.add(function(_method, _vars) { this.apiEvent(_method, _vars); }.bind(this));

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
    //Show me
    this.show(true);

    //Set the status
    this.setState('init');

    //Dates
    this.dateOldest = new Date();
    this.dateOldestTime = -1;

    //Reset the 'counts'
    this.counts = {
        total:0,
        snooped:0,
        matched:0
    };

    //Blank our text...
    this.setText();
};



//--------------------------------------------------------------------------
//  SET STATE
//--------------------------------------------------------------------------
SuperSnooper.Modules.InfoBar.prototype.setState = function(_state) {
    //INFO button
    if(_state === 'init') {
        //Icon, but inactive
        this.infoButton.removeClass('button--noclick button--complete');
        this.infoButton.addClass('button--pause button--inactive');
    } else if(_state === 'stop') {
        //Stop, so make unclickable and remove the pause icon
        this.infoButton.removeClass('button--pause button--inactive');
        this.infoButton.addClass('button--noclick button--complete');
    } else {
        //Icon and clickable
        this.infoButton.removeClass('button--complete button--inactive button--noclick');
        this.infoButton.addClass('button--pause');
    }

    //Text
    this.infoButton.html(this.buttonLabels.info[_state]);

    //EXPORT button
    if(_state === 'init') {
        this.exportButton.addClass('button--inactive');
    } else {
        this.exportButton.removeClass('button--inactive');
    }

    //Store the state
    this.state = _state;
};


//--------------------------------------------------------------------------
//  API EVENT
//--------------------------------------------------------------------------
SuperSnooper.Modules.InfoBar.prototype.apiEvent = function(_method, _vars) {
    if(_method === 'search-init') {
        //SEARCH init - completely new
        this.init();
    } else if(_method === 'search-start') {
        //THIS IS CALLED EVERYTIME A NEW PAGE OF DATA IS FETCHED - don't really need to do anything?
    } else if(_method === 'items-add') {
        //NEW ITEMS

        //If we are waiting for init, then change the state
        if(this.state === 'init') { this.setState('go'); }

        //Update the search panel with our new text!
        this.update(_vars);
    } else if(_method === 'state-set') {
        //STATE set
        if(_vars.state === 'go' || _vars.state === 'pause' || _vars.state === 'stop') {
            this.setState(_vars.state);
        }
    }
};


//--------------------------------------------------------------------------
//  SHOW / HIDE
//--------------------------------------------------------------------------
SuperSnooper.Modules.InfoBar.prototype.show = function(_show) {
    if(_show) {
        this.bar.removeClass('searchbar--hidden');
    } else {
        this.bar.addClass('searchbar--hidden');
    }
};


//--------------------------------------------------------------------------
//  SEARCH BAR UPDATE
//--------------------------------------------------------------------------
SuperSnooper.Modules.InfoBar.prototype.update = function(_vars) {
    //Counts
    this.counts.matched += _vars.items.length;
    this.counts.total += _vars.itemCountTotal;
    this.counts.snooped += _vars.itemCountProcessed;

    //Oldest date update
    var _stamp;
    for(var i=0;i<_vars.items.length;i++) {
        //Timestamp for item
        _stamp = parseInt(_vars.items[i].created_time * 1000);

        //Older than previous oldest date?
        if(_stamp < this.dateOldestTime || this.dateOldestTime === -1) {
            //Older date!
            this.dateOldestTime = _stamp;
            this.dateOldest = new Date(_stamp);
        }
    }

    //Set the text
    this.setText();
};


//--------------------------------------------------------------------------
//  SET THE TEXT
//--------------------------------------------------------------------------
SuperSnooper.Modules.InfoBar.prototype.setText = function() {

    //Info text
    var _info = 'Initialising the snoop<br/>Please wait a moment...';
    if(this.state !== 'init') {
        var _date = SuperSnooper.helper.padString(this.dateOldest.getUTCDate()) + '-' + SuperSnooper.helper.padString(this.dateOldest.getUTCMonth() + 1) + '-' + (this.dateOldest.getYear() - 100);
        var _prefix = (this.state === 'stop') ? 'We‘ve ' : 'So far, we‘ve ';
        _info = '<span class="bold">' + this.counts.total.toLocaleString() + '</span> images exist.<br/>' + _prefix + ' snooped through <span class="bold">' + this.counts.snooped.toLocaleString() + '</span> dating back to <span class="bold">' + _date + '</span>';
    }
    $('.searchbar__info').html(_info);

    //Matched count
    $('.searchbar__count__value').html(this.counts.matched);
};