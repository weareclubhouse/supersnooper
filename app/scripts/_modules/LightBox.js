/*
*   @site           SuperSnooper
*   @function       Light Box
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

//--------------------------------------------------------------------------
//  VARIABLES
//--------------------------------------------------------------------------


//--------------------------------------------------------------------------
//  MAIN CLASS
//--------------------------------------------------------------------------
SuperSnooper.Modules.LightBox = function() {
    //Lightbox
    this.lightBoxContentType = '';


    //Create a signal object
    SuperSnooper.Signals.lightbox = new signals.Signal();
    SuperSnooper.Signals.lightbox.add(this.lightboxEventListener = function(_method, _vars) { this.lightBoxEvent(_method, _vars); }.bind(this));
};

//Definition
SuperSnooper.Modules.LightBox.constructor = SuperSnooper.Modules.LightBox;


//--------------------------------------------------------------------------
//  EVENT
//--------------------------------------------------------------------------
SuperSnooper.Modules.LightBox.prototype.lightBoxEvent = function(_method, _vars) {
    if(_method === 'open') {
        //OPEN
        this.open(_vars.content, _vars.type);
    } else if(_method === 'close') {
        //CLOSE (and optionally do an update on the content we are cleaning out)
        this.close((_vars.clear === undefined) ? true : _vars.clear);
    }
};


//--------------------------------------------------------------------------
// OPEN
//--------------------------------------------------------------------------
SuperSnooper.Modules.LightBox.prototype.open = function(_content, _contentType) {
    //Add the lightbox with this content
    $('body').append(SuperSnooper.templates.lightbox({content:_content}));

    //Add the open class to the lightbox (to trigger animation)
    setTimeout( function() {
    $('.lightbox-content').addClass('open');
}.bind(this), 50);

    //Add a close event to the light box background and close button
    $('.lightbox-fill').on('click', function(e) {
        this.close();
        e.preventDefault();
    }.bind(this));

    $('#button-close').on('click', function(e) {
        this.close();
        e.preventDefault();
    }.bind(this));

    //Hover effect
    $('.lightbox-content .button').hover(function() { $(this).addClass('over'); }, function() { $(this).removeClass('over'); });

    //Stop scrolling on main
    $('body').addClass('scroll-locked');

    //Store the type
    this.lightBoxContentType = _contentType;

};

//--------------------------------------------------------------------------
// CLOSE
//--------------------------------------------------------------------------
SuperSnooper.Modules.LightBox.prototype.close = function(_clearContent) {
    //Do anything extra?
    _clearContent = (_clearContent === undefined) ? true : _clearContent;

    //Blank the content type
    this.lightBoxContentType = '';

    //Drop the lightbox
    $('.lightbox-container').remove();

    //Add scrolling back on main
    $('body').removeClass('scroll-locked');
};