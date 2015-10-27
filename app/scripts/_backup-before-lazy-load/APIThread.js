/*
*   @site           SuperSnooper
*   @function       API Thread
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
SuperSnooper.APIThread = function(_url) {
    //Store the url
    this.url = _url;

    //Status
    this.isWorking = false;
    this.postInProgress = false;
    this.isHalted = false;

    //Day Max
    this.dayMax = 7;

    //Info object
    this.info = {};
};

//Definition
SuperSnooper.APIThread.constructor = SuperSnooper.APIThread;


//--------------------------------------------------------------------------
//  INIT SEARCH
//--------------------------------------------------------------------------
SuperSnooper.APIThread.prototype.initSearch = function(_info) {
    //Debug
    console.log('INIT SEARCH [' + _info.id + ']:' + _info.type + ',' + _info.search);

    //Store the data of this SEARCH (make sure we don't store a pointer...)
    this.info = {};
    for(var  i in _info) {
        this.info[i] = _info[i];
    }
    //this.info.id = _id; - this is set at the start


    //Flag & Count reset
    this.info.callCount = 0;
    this.info.itemCount = 0;
    this.isWorking = true;
    this.isHalted = false;

    //Fire an event (this should start the group, loader bar)
    if(!this.isHalted) {
        SuperSnooper.Signals.api.dispatch('thread-start', this.info );
    }

    //Start the call
    this.getNextDataSet();
};


//--------------------------------------------------------------------------
//  GET NEXT DATA SET
//--------------------------------------------------------------------------
SuperSnooper.APIThread.prototype.getNextDataSet = function() {
    //POST the current data
    this.postLast = $.post( this.url, this.info, function(_data ) {
        this.dataLoaded(_data);
    }.bind(this));
    this.postInProgress = true;

    //Increment the calls
    this.info.callCount++;
};


//--------------------------------------------------------------------------
//  HALT ME
//--------------------------------------------------------------------------
SuperSnooper.APIThread.prototype.halt = function() {
    //Halt flag (stops events)
    this.isHalted = true;
    this.isWorking = false;

    //Post in progress?
    if(this.postInProgress) {
        this.postLast.abort();
        this.postInProgress = false;
    }
};



//--------------------------------------------------------------------------
//  DATA LOADED OK
//--------------------------------------------------------------------------
SuperSnooper.APIThread.prototype.dataLoaded = function(_data) {
    //Flag off
    this.postInProgress = false;

    //Items to report (we don't push items that are beyond our date...)
    var _items = [];
    var _continue = true;
    var _difference;
    var _oldPostCount = 0;

    if(_data.data) {
        for(var i=0;i<_data.data.length;i++) {
            //Create our own timestamp field
            _data.data[i].timestamp = _data.data[i].created_time;
            _data.data[i].validated_by = 'post'; //reason the post was allowed through (this will usually be POST, but can be through a valid COMMENT on an older post...)

            //Time difference
            _difference = parseInt(_data.data[i].created_time) - this.info.timeLimit;

            //Is this post inside our timeframe
            if(_difference < 0) {
                //OLD POST - this might be an update one due to commenting, so we have to check that first...
                //console.log('POTENTIAL OLD POST:' + _difference);

                //Loop through the comments and look for something that validates this post inside our timeframe (it could also be LIKE I think... but we only deal in comments)
                var _validCommentDate = false;
                for(var j=0;j<_data.data[i].comments.data.length;j++) {
                    //Comment time difference
                    _difference = parseInt(_data.data[i].comments.data[j].created_time) - this.info.timeLimit;

                    //Is this valid?
                    if(_difference > 0) {
                        //Valid comment found
                        _validCommentDate = true;

                        //Update the item with this data...
                        _data.data[i].timestamp = _data.data[i].comments.data[j].created_time;
                        _data.data[i].validated_by = 'comment';
                    }
                }

                //Only increment the count if we didn't find a reason to validate this post...
                if(!_validCommentDate) {
                    //Increment the count
                    _oldPostCount++;
                } else {
                    //Post was validated by a comment
                     _items.push(_data.data[i]);
                }

                //If all the posts on this page are old, then we are DONE!
                if(_oldPostCount === _data.data.length) {
                     _continue= false;
                }
            } else {
                //We need this post since it has a valid date
                _items.push(_data.data[i]);
            }
        }
    }

    //Add to the count
    this.info.itemCount += _items.length;

    //Fire an event
    if(!this.isHalted) {
        SuperSnooper.Signals.api.dispatch('data-loaded', {thread:this.info, data:_items});
    }

    //Halt on debug version
    if(SuperSnooper.api.url.indexOf('localhost') > -1 && this.info.callCount > 3) {
        _continue = false;
    }

    //Do we think there is more data to come? //
    if(_continue && _data.pagination && _data.pagination.next_max_id) { //this.callCount < this.callCountMax && this.itemCount < this.itemCountMax &&
        //Add the next item paramater in and search again...
        this.info.itemStartID = _data.pagination.next_max_id;

        //If this is a 'user' search we can reduce the query time by injecting the user id in as well now that we know what it is
        if(_data.user && _data.user.id) {
            this.info.userID = _data.user.id;
        }

        //Get the next data set
        this.getNextDataSet();
    } else {

        //Console logging
        /*if(this.callCount >= this.callCountMax) {
             console.log('END OF CALL LIMIT:'  + this.info.id);
        } else if(_data.pagination && _data.pagination.next_max_id) {
            //too many itmes
            console.log('END OF FEED:'  + this.info.id);
        } else {
             console.log('STOPPED OVER ITEM LIMIT:' + this.info.id);
        }*/

        //Dispatch a 'thread complete event' as well (this should really move over once we have established looping)
        this.isWorking = false;
        if(!this.isHalted) {
            SuperSnooper.Signals.api.dispatch('thread-complete', this.info);
        }

        //Done
        console.log('THREAD COMPLETE:' + this.info.callCount + ' CALLS, ' + this.info.itemCount + ' ITEMS');
    }
};



