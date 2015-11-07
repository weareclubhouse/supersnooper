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

    //Listen for FILTER signals
    SuperSnooper.Signals.filter.add(function(_method, _vars) { this.filterEvent(_method, _vars); }.bind(this));

    //Isotopes
    this.isotopes = {};

    //Default sort fields
    this.sortFields = ['date'];


    //Cluster.js test
    /*
    var _data = [];
    for(var i = 0; i < 1000; i++) {
        _data.push('<div class="result-item-wrapper" id="item{{id}}"><div class="result-item" style="color:#333333">' + i + '</div></div>');
    }
    this.dataCluster = new Clusterize({
        //rows:_data,
        scrollId: 'scrollArea',
        contentId: 'contentArea'
    });*/
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
//  FILTER EVENT
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemManager.prototype.filterEvent = function(_method, _vars) {
    if(_method === 'sort') {
        this.isotopes.main.isotope({'sortBy':_vars});
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

    //Sort method ID
    this.sortFields = ['date'];

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

        //Append
        //this.dataCluster.append(['<div class="result-item-wrapper" id="item{{id}}"><div class="result-item" style="color:#333333">' + i + '</div></div>']);
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
            var _item = new SuperSnooper.Modules.Item(this.nextItem, this.items[this.nextItem].data);

            //Add to the HTML
            if(SuperSnooper.helper.ISOTOPE_ENABLED) {
                //Add into our isotope code
                this.isotopes.main.isotope('insert', _item.getHTML('inner'));
                //this.dataCluster.append(['<div class="result-item-wrapper" id="item{{id}}"><div class="result-item" style="color:#333333">AN ITEM</div></div>']);
                //this.dataCluster.refresh();
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


};


//--------------------------------------------------------------------------
//  CREATE AN ISOTOPE GROUP
//--------------------------------------------------------------------------
SuperSnooper.Modules.ItemManager.prototype.createIsotopeGroup = function(_id) {
    //Inject the ISOTOPE template HTML
    $('.result-list').append(SuperSnooper.templates.itemlist({id:_id}));

    //Make the ISOTOPE object with the given ID (either DATE or DATE-SUBCLASS)
    //this.isotopes[_id] = new Isotope(document.querySelector('.result-list-items#' + _id), {

    this.isotopes[_id] = $('.result-list-items#' + _id).isotope({
        //LAYOUT
        masonry: {
            //isFitWidth: true
            //columnWidth: 334, //item size is 332
            //rowHeight: 332, //item size is 332

            gutter: 0
        },

        //SETTING THESE STOP ITEMS SCALING IN
        hiddenStyle: { opacity: 0 },
        visibleStyle: { opacity: 1 },

        //TRANSITION speed)
        transitionDuration: '0.4s',

        //SORTING
        sortBy:this.sortFields,
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
          },
          keywords : function ( _elem ) {
            return parseInt($(_elem).attr('data-keywords'));
          }
        }
    });
};