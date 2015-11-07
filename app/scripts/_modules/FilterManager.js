/*
*   @site           SuperSnooper
*   @function       Filter / Sort Manager
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper,signals:false console:true*/

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Modules.FilterManager = function() {
    //Listen for API signals
    SuperSnooper.Signals.api.add(function(_method, _vars) { this.apiEvent(_method, _vars); }.bind(this));

    //Filter signals
    SuperSnooper.Signals.filter = new signals.Signal();

    //Target
    this.bar = $('.filters-wrapper');
    this.holderLeft = $('#filters-left');
    this.holderRight = $('#filters-right');
    this.listLeft = this.holderLeft.find('ul');
    this.listRight = this.holderRight.find('ul');

    //Filters
    this.filters = {
        'date': {label:'Date', type:'sort', data:['date']},
        'keywords': {label:'Keywords Only', type:'sort', data:['keywords', 'date']},
        'likes': {label:'Likes', type:'sort', data:['likes', 'date']},
        'comments': {label:'Comments', type:'sort', data:['comments', 'date']}
    };

    //Flag
    this.isInited = false;

    //Sort
    this.sortMethod = 'date';
};

//Definition
SuperSnooper.Modules.FilterManager.constructor = SuperSnooper.Modules.FilterManager;





//--------------------------------------------------------------------------
//  API EVENT
//--------------------------------------------------------------------------
SuperSnooper.Modules.FilterManager.prototype.apiEvent = function(_method) {
    if(_method === 'search-init') {
        //SEARCH init, so hide the bar
        this.reset();
    } else if(_method === 'items-add') {
        //NEW ITEMS - make sure the filtes are setup correctly
        if(!this.isInited) {
            this.init();
        }
    }
};


//--------------------------------------------------------------------------
//  RESET
//--------------------------------------------------------------------------
SuperSnooper.Modules.FilterManager.prototype.reset = function() {
    //Flag
    this.isInited = false;

    //Hide the individual holder
    this.holderLeft.addClass('filters--hidden');
    this.holderRight.addClass('filters--hidden');
};

//--------------------------------------------------------------------------
//  RESET
//--------------------------------------------------------------------------
SuperSnooper.Modules.FilterManager.prototype.init = function() {
    //Flag
    this.isInited = true;

    //Sort method
    this.sortMethod = 'date';

    //Vars
    var i;
    var _item;

    //Blank the filters
    this.listLeft.html('');
    this.listRight.html('');

    //Setup the LHS filters

    if(SuperSnooper.helper.searchTerms['tags-method'] === 'any' && SuperSnooper.helper.searchTerms.tags.indexOf(',') !== -1) {
        //Split the tags
        var _tags = SuperSnooper.helper.searchTerms.tags.split(',');

        for(i = 0; i < _tags.length; i++) {
            if(SuperSnooper.helper.searchTerms.keywords !== '' || i !== 'keywords') {
                //Item
                _item = $('<li class="filters__option filters__option--selected" data-id="' + _tags[i] +'">#' + _tags[i] + '</li>');

                //Event
                _item.on('click', function(_id) {
                    this.filterItems(_id);
                }.bind(this, _tags[i]));

                //Add it
                this.listLeft.append(_item);
            }
        }

        //Reveal
        this.holderLeft.removeClass('filters--hidden');
    }

    //Setup the RHS filters
    for(i in this.filters) {
        if(SuperSnooper.helper.searchTerms.keywords !== '' || i !== 'keywords') {
            //Item
            _item = $('<li class="filters__option" data-id="' + i +'">' + this.filters[i].label + '</li>');

            //If this is the date filter, then select it
            if(i === this.sortMethod) {
                _item.addClass('filters__option--selected');
            }

            //Event
            _item.on('click', function(_id) {
                this.sortItems(_id);
            }.bind(this, i));

            //Add it
            this.listRight.append(_item);
        }
    }
    this.holderRight.removeClass('filters--hidden');
};


//--------------------------------------------------------------------------
//  SORT ITEMS
//--------------------------------------------------------------------------
SuperSnooper.Modules.FilterManager.prototype.sortItems = function(_id) {
    if(this.isInited) {
        if(_id !== this.sortMethod) {
            //Dispatch a sort event!
            SuperSnooper.Signals.filter.dispatch('sort', this.filters[_id].data);

            //Loop through the list of options and set the correct one to one
            var _items = this.holderRight.find('li');
            for(var i = 0; i < _items.length; i++) {
                if($(_items[i]).attr('data-id') === _id) {
                    $(_items[i]).addClass('filters__option--selected');
                } else {
                    $(_items[i]).removeClass('filters__option--selected');
                }
            }

            //Store
            this.sortMethod = _id;
        }
    }
};