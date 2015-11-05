/*
*   @site           SuperSnooper
*   @function       Snooper Eyes
*   @author         Greg Findon
*   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
*   @version        0.01
*
*********************************************************************************************/

//--------------------------------------------------------------------------
// JS HINT BITS
//--------------------------------------------------------------------------
'use strict';
/*global SuperSnooper,Snap:false console:true*/

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Modules.SnooperEyes = function() {
    //List of trackable images
    this.imageList = [
        //HEADER full logo
        {
            'id':'logo-header',
            'lag':5, //movement lag
            'src':'images/icon-logo.svg',
            'items':[
                {id:'XMLID_103_', originX:613.5, originY:515, radius:5, centreX:145, centreY:9}, //LEFT
                {id:'XMLID_99_', originX:671, originY:515, radius:5, centreX:170, centreY:9} //RIGHT
            ]
        }
    ];

    //Mouse move event
    this.loadedImages = [];

    //Load the images
    for(var i = 0; i < this.imageList.length;i++) {
        this.loadSVG(i);
    }

    //Mouse Move
    $(window).on('mousemove', function(_event) {
        this.mouseMove(_event);
    }.bind(this));

    //Animation!
    requestAnimationFrame(function() { this.animate(); }.bind(this));
};

//Definition
SuperSnooper.Modules.SnooperEyes.constructor = SuperSnooper.Modules.SnooperEyes;


//--------------------------------------------------------------------------
//  IMAGE LOADED
//--------------------------------------------------------------------------
SuperSnooper.Modules.SnooperEyes.prototype.imageLoaded = function(_id, _data) {
    //Make an SVG with the data in the correct place
    this.imageList[_id].image = new Snap('#' + this.imageList[_id].id);
    this.imageList[_id].imageGroup = this.imageList[_id].image.group();
    this.imageList[_id].imageGroup.append(_data);

    //Extract the items
    var _item;
    for(var i = 0; i < this.imageList[_id].items.length; i++) {
        _item = this.imageList[_id].image.select('#' + this.imageList[_id].items[i].id);
        _item.attr('cx', this.imageList[_id].items[i].originX);
        _item.attr('cy', this.imageList[_id].items[i].originY);

        //Targets
        this.imageList[_id].items[i].targetX = this.imageList[_id].items[i].originX;
        this.imageList[_id].items[i].targetY = this.imageList[_id].items[i].originY;

        //Store a reference
        this.imageList[_id].items[i].item = _item;
        this.imageList[_id].parent = $('#' + this.imageList[_id].id);
    }

    //Add the item to the loaded images list so we can track the items
    this.loadedImages.push(_id);
};


//--------------------------------------------------------------------------
//  LOAD AN SVG
//--------------------------------------------------------------------------
SuperSnooper.Modules.SnooperEyes.prototype.loadSVG = function(_id) {
    //Load our image
    Snap.load(this.imageList[_id].src, function(_id, _data) {
        //Process
        this.imageLoaded(_id, _data);
    }.bind(this, _id));
};


//--------------------------------------------------------------------------
//  IMAGE LOADED
//--------------------------------------------------------------------------
SuperSnooper.Modules.SnooperEyes.prototype.mouseMove = function(_event) {
    //Global mouse co-ords are pageX, pageY
    var _item;
    var _diffX;
    var _diffY;
    var _angle;

    for(var i = 0; i < this.loadedImages.length; i++) {
        //Item
        _item = this.imageList[this.loadedImages[i]];

        //Loop through parts
        for(var j = 0; j < _item.items.length; j++) {
            //Work out the difference and hence an angle
            _diffX = _event.pageX - (_item.parent.offset().left + _item.items[j].centreX);
            _diffY = _event.pageY - (_item.parent.offset().top + _item.items[j].centreY);
            _angle = (_diffY === 0) ? Math.atan(_diffX) : Math.atan(_diffX / _diffY); // * (180 / Math.PI);

            //Adjust angle
            if(_diffY >= 0) {
                _angle = (Math.PI / 2) - _angle;
            } else {
                _angle = ((Math.PI / 2) * 3) - _angle;
            }

            //Store the target values
            _item.items[j].targetX = _item.items[j].originX + (Math.cos(_angle) * _item.items[j].radius);
            _item.items[j].targetY = _item.items[j].originY + (Math.sin(_angle) * _item.items[j].radius);

            //SNAP?
            //_item.items[j].item.attr('cx', _item.items[j].originX + (Math.cos(_angle) * _item.items[j].radius));
            //_item.items[j].item.attr('cy', _item.items[j].originY + (Math.sin(_angle) * _item.items[j].radius));
        }
    }
};


//--------------------------------------------------------------------------
//  ANIMATE
//--------------------------------------------------------------------------
SuperSnooper.Modules.SnooperEyes.prototype.animate = function() {
    //Move anything that needs moving
    var _item;
    var _diffX;
    var _diffY;
    var _cX;
    var _cY;
    for(var i = 0; i < this.loadedImages.length; i++) {
        //Item
        _item = this.imageList[this.loadedImages[i]];

        //Loop through parts
        for(var j = 0; j < _item.items.length; j++) {
            //Differences
            _cX = parseFloat(_item.items[j].item.attr('cx'));
            _cY = parseFloat(_item.items[j].item.attr('cy'));
            _diffX = _item.items[j].targetX - _cX;
            _diffY = _item.items[j].targetY - _cY;

            //Move!
            if(_diffX !== 0 || _diffY !== 0) {
                if(Math.abs(_diffX) < 1) { _item.items[j].item.attr('cx', _item.items[j].targetX); } else { _item.items[j].item.attr('cx', _cX + (_diffX / _item.lag)); }
                if(Math.abs(_diffY) < 1) { _item.items[j].item.attr('cy', _item.items[j].targetY); } else { _item.items[j].item.attr('cy', _cY + (_diffY / _item.lag)); }
            }
        }
    }

    //Again!
    requestAnimationFrame(function() { this.animate(); }.bind(this));
};