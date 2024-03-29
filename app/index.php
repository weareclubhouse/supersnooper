<?php
    /*
    *   @site           SuperSnooper
    *   @function       Wrapper Script
    *   @author         Greg Findon
    *   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
    *   @version        0.01
    *
    *********************************************************************************************/

    //--------------------------------
    //  ERRORS
    //--------------------------------
    error_reporting(E_ALL);
    ini_set('display_errors', 1);


    //--------------------------------
    //  CLIENT
    //--------------------------------
    $_clientID = "98133cbdcd8d4e85b25acc7f19aaba10";
    $_clientSecret = "bb9b4d3b4c64490583219e5d644c161a";


    //--------------------------------
    //  COOKIE & DEFAULT TEMPLATE
    //--------------------------------
    $_cookieID = 'snooper-user';
    $_cookieSet = (!isset($_COOKIE[$_cookieID])) ? false : true;
    $_cookieExpires = time() + (86400 * 365);
    $_pageTemplate = 'register';


    //--------------------------------
    //  URLS
    //--------------------------------

    //Auth
    $_authURL = "https://instagram.com/oauth/authorize/";

    //Redirect (basically this page)
    $_redirectURL = 'http://' . $_SERVER['SERVER_NAME'];
    ($_SERVER['SERVER_PORT'] !== '80') ? $_redirectURL .= ':' . $_SERVER['SERVER_PORT'] : null;
    $_redirectURL .=   $_SERVER['SCRIPT_NAME'];
    $_redirectURL = str_replace('index.php', '', $_redirectURL);

    //Build our URL and go to it...
    $_URL = $_authURL . "?client_id=" . $_clientID ."&redirect_uri=" . $_redirectURL . "&response_type=code";


    //-----------------------------------------------------------------------------------------------------------
    //  IF THE COOKIE IS SET, THEN JUST SHOW THE MAIN PAGE, ELSE NEED TO AUTH THE USER
    //-----------------------------------------------------------------------------------------------------------
    if($_cookieSet === true) {
        //Main template
        $_pageTemplate = 'main';
    } else {
        //--------------------------------
        //  GO!
        //--------------------------------
        if(isset($_REQUEST['code'])) {
            //--------------------------------
            //  GET TOKEN
            //--------------------------------
            //Code has been returned by the server, so let's get the TOKEN via curl
            $_params = array(
                'client_id' => $_clientID,
                'client_secret' => $_clientSecret,
                'grant_type' => 'authorization_code',
                'redirect_uri' => $_redirectURL,
                'code' => $_REQUEST['code']
            );

            $_curl = curl_init("https://api.instagram.com/oauth/access_token");
            curl_setopt($_curl, CURLOPT_POST, true);   // to send a POST request
            curl_setopt($_curl, CURLOPT_POSTFIELDS, $_params);   // indicate the data to send
            curl_setopt($_curl, CURLOPT_RETURNTRANSFER, 1);   // to return the transfer as a string of the return value of curl_exec() instead of outputting it out directly.
            curl_setopt($_curl, CURLOPT_SSL_VERIFYPEER, false);   // to stop cURL from verifying the peer's certificate.
            $_result = curl_exec($_curl);
            $_json = json_decode($_result, true);


            //Do we have an access token?
            if(isset($_json['access_token'])) {
                //Save the token
                $_file = fopen('api/_tokens/ACCESSTOKEN_' . $_json['user']['username'], 'w+');
                fwrite($_file, $_result);
                fclose($_file);

                //Set the cookie
                setcookie($_cookieID, $_json['user']['username'], $_cookieExpires, "/");

                //We could redirect back to 'self' to stop the code being exposed in the front end?
                header('Location: ' . $_redirectURL);

                //OR we could show the page?
                //$_pageTemplate = 'main';
            } else {
                //If no matching code, then redirect, else
                if(isset($_json['error_message']) && $_json['error_message'] === 'No matching code found.') {
                    //Go back round again...
                    header('Location: ' . $_URL);
                    exit;
                } else {
                    //Another kind of error, so just spit it out?
                    print_r($_result);
                    exit;
                }
            }

            //Close the CURL
            curl_close($_curl);
        }
    }

    //Display any HTML we need to
    $_contents = file_get_contents($_pageTemplate . '.html');
    $_contents = str_replace('{{AUTH_URL}}', $_URL, $_contents);
    echo($_contents);
?>

