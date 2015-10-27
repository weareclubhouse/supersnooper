<?php
    /*
    *   @site           SuperSnooper
    *   @function       API: Config
    *   @author         Greg Findon
    *   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
    *   @version        0.01
    *
    *********************************************************************************************/


    //--------------------------------------------------------
    //  ERRORS
    //--------------------------------------------------------
    error_reporting(E_ALL);
    ini_set('display_errors', TRUE);
    ini_set('display_startup_errors', TRUE);


    //--------------------------------------------------------
    //  TIMEZONE
    //--------------------------------------------------------
    date_default_timezone_set('UTC');


    //--------------------------------------------------------
    //  GLOBALS
    //--------------------------------------------------------
    define('CACHE_FOLDER', '_cache/');
    define('CACHE_FILE_EXTENSION', 'txt');


    //--------------------------------------------------------
    //  INCLUDES
    //--------------------------------------------------------
    require_once('_lib/functions.php');
?>