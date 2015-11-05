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

    ///--------------------------------------------------------
    //  API
    //---------------------------------------------------------
    define('API_URL', 'https://api.instagram.com/v1/');
    define('COUNT', 100); //default amount of items to fetch per request, to be honest instagram decides this as 33 on the endpoints anyway, but we set it high just in case it is allowed




    //--------------------------------------------------------
    //  INCLUDES
    //--------------------------------------------------------
    //require_once('_lib/functions.php'); - not required
?>