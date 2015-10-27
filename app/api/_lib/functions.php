<?php
    /*
    *   @site           SuperSnooper
    *   @function       Generic Functions
    *   @author         Greg Findon
    *   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
    *   @version        0.01
    *
    *********************************************************************************************/


    ///--------------------------------------------------------
    //  CHECK A CACHE FOLDER EXISTS FOR TODAY
    //---------------------------------------------------------
    function checkCacheFolder() {
        //Time
        $_time = time();
        $_year = strftime('%Y', $_time);
        $_month = strftime('%m', $_time);
        $_day = strftime('%d', $_time);
        if(!file_exists(CACHE_FOLDER . $_year)) { mkdir(CACHE_FOLDER . $_year); }
        if(!file_exists(CACHE_FOLDER . $_year . '/' . $_month)) { mkdir(CACHE_FOLDER . $_year . '/' . $_month); }
        if(!file_exists(CACHE_FOLDER . $_year . '/' . $_month . '/' . $_day)) { mkdir(CACHE_FOLDER . $_year . '/' . $_month . '/' . $_day); }
        return CACHE_FOLDER . $_year . '/' . $_month . '/' . $_day . '/';
    }
?>