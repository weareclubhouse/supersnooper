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
/*global SuperSnooper,Isotope:true*/
/*jshint camelcase: false */
/*jshint loopfunc: true */

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemManager = function() {
    //How many to add at once (this will be removed with new stretchy code)
    this.batchProcessMax = 5;

    //Items
    this.items = [];
    this.nextItem = -1;

    //Listen for API signals
    SuperSnooper.Signals.api.add(function(_method, _vars) { this.apiEvent(_method, _vars); }.bind(this));

    //Setup a temporary ISOTOPE object
    this.isotopes = {};
};

//Definition
SuperSnooper.Modules.ItemManager.constructor = SuperSnooper.Modules.ItemManager;


//--------------------------------------------------------------------------
//  API EVENT
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemManager.prototype.apiEvent = function(_method, _vars) {
    if(_method === 'search-init') {
        //SEARCH init
        this.reset();
    } else if(_method === 'items-add') {
        //NEW ITEMS
        this.addGroup(_vars.items);
    }
};

//--------------------------------------------------------------------------
//  START / RESET
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemManager.prototype.reset = function() {
    //Kill the interval if it is running
    if(this.itemAddTimer !== undefined) {
        clearInterval(this.itemAddTimer);
        this.itemAddTimer = null;
    }

    //Clear the item list
    this.items = [];
    this.nextItem = -1;

    //Isotope group
    if(SuperSnooper.helper.ISOTOPE_ENABLED) {
        this.createIsotopeGroup('main');
    }
};




//--------------------------------------------------------------------------
//  ADD SOME ITEMS OLD BATCH METHOD
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemManager.prototype.addGroup = function(_items) {

    //Add to the list
    for(var i=0;i<_items.length;i++) {
        //Add to the item list
        this.items.push({data:_items[i], item:null});
    }

    //TEMPORARY quick open of one of the items
    /*if(this.opened === undefined) {
        var _id = Math.floor(Math.random() * _items.length);
        SuperSnooper.Signals.viewer.dispatch('open', {id:_id, data:this.items[_id].data});
        this.opened = true;
    }*/


    //Is the interval running?
    if(this.itemAddTimer === undefined || this.itemAddTimer === null) {
        this.itemAddTimer = setInterval(function () { this.addNextItem(); }.bind(this), 25);
    }
};



//--------------------------------------------------------------------------
//  ADD THE NEXT ITEM (DEPREACTED FOR NOW)
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemManager.prototype.addNextItem = function() {
    //Add a batch of images
    for(var i = 0; i < this.batchProcessMax; i++) {
        //Inc
        this.nextItem++;

        //Is there a valid item?
        if(this.nextItem < this.items.length) {
            //Create the item
            var _item = this.getItemHTML(this.nextItem, this.items[this.nextItem].data);

            //Add to the HTML
            if(SuperSnooper.helper.ISOTOPE_ENABLED) {
                this.isotopes.main.insert(_item);
            } else {
                $('.result-list').append(_item);
            }
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
SuperSnooper.Modules.ItemManager.prototype.setupResultItemLinks = function() {
    var _links = $('a.result-item-wrapper');
    for(var i=0;i<_links.length;i++) {
        //Remove old listeners
        $(_links[i]).off('.items');
        $(_links[i]).on('click.items', function(_id) {
            //Dispatch an event
            SuperSnooper.Signals.viewer.dispatch('open', {id:_id, data:this.items[_id].data});
            return false;
        }.bind(this, i));
    }
};





//--------------------------------------------------------------------------
// CREATE AN ITEM TEMPLATE FROM A GIVEN SET OF INFO (RESULTS ITEM)
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemManager.prototype.getItemHTML = function(_id, _info) {
    //HTML
    var _html = SuperSnooper.templates.item({
        'title': '@' + _info.user.username,
        //'title':_date.getDate() + '.' + _date.getMonth() + '.' + _date.getFullYear() + '-' + _date.getHours() + ':' + _date.getMinutes() + ':' + _date.getSeconds(),
        'likes':SuperSnooper.helper.padString(_info.likes.count, '0', 2, true),
        'comments':SuperSnooper.helper.padString(_info.comments.count, '0', 2, true),
        'likes-count':_info.likes.count,
        'comments-count':_info.comments.count,
        'image':_info.images.low_resolution.url,
        'date':_info.created_time,
        'extra-classes':(_info.keywordMatches.words.length !== 0) ? 'result-item--keyword-match' : '',
        'id':'item' + _id
    });

    //Click handler?

    //Return cast object
    return $(_html);
};


//--------------------------------------------------------------------------
//  CREATE AN ISOTOPE GROUP
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemManager.prototype.createIsotopeGroup = function(_id) {
    //Inject the ISOTOPE template HTML
    $('.result-list').append(SuperSnooper.templates.itemlist({id:_id}));

    //Make the ISOTOPE object with the given ID (either DATE or DATE-SUBCLASS)
    this.isotopes[_id] = new Isotope(document.querySelector('.result-list-items#' + _id), {
        //LAYOUT
        masonry: {
            //isFitWidth: true
            //columnWidth: 334, //item size is 332
            //rowHeight: 332, //item size is 332

            gutter: 0
        },

        hiddenStyle: { opacity: 0 },
        visibleStyle: { opacity: 1 },

        //TRANSITION speed)
        transitionDuration: '1s',

        //SORTING
        sortBy:['comments', 'date'],
        sortAscending: false,
        getSortData : {
          date : function ( _elem ) {
            return parseInt($(_elem).attr('data-date'));
          },
          likes : function ( _elem ) {
            return parseInt($(_elem).attr('data-likes'));
          },
          comments : function ( _elem ) {
            return parseInt($(_elem).attr('data-comments'));
          }
        }
    });
};