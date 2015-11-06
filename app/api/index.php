<?php
    /*
    *   @site           SuperSnooper
    *   @function       API
    *   @author         Greg Findon
    *   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
    *   @version        0.01
    *
    *********************************************************************************************/


    //--------------------------------------------------------
    //  INCLUDES
    //--------------------------------------------------------
    require_once('config.php');
    require_once('_lib/DataCacher.php');
    require_once('_lib/TokenManager.php');


    //--------------------------------------------------------
    //  HEADERS
    //--------------------------------------------------------
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
    header('Content-Type: application/json');


    ///--------------------------------------------------------
    //  RANDOM ACCESS TOKEN FROM OUR FILES
    //---------------------------------------------------------
    $tokenManager = new TokenManager('_tokens/');
    define('ACCESS_TOKEN', $tokenManager -> getAccessToken());


    ///--------------------------------------------------------
    //  RESPONSE OBJECT
    //---------------------------------------------------------
    $_dataResponse = array('result' => 'OK', 'calls' => array(), 'pagination' => '', 'data-pre-filter' => array(), 'data' => array());

    ///--------------------------------------------------------
    //  DEFAULT PARAMS
    //---------------------------------------------------------
    $postVars = array(
        //Vars from form
        'names' => '',
        'tags' => '',
        'keywords' => '', //we don't really do anything with these here
        'names-method' => '',
        'tags-method' => '',

        //Lookups (only happen at the start of the query)
        'userID' => '',

        //Caching bits
        'date' => '1970-01-01',
        'searchID' => '', //unique search ID for caching

        //Pagination
        'itemStartID' => '',

        //Method
        'searchMethod' => 'none' //none, user, tag
    );

    //Loop through the postVars array and replace any items that were POSTED/GETTED in
    foreach($postVars as $_key => $_value) {
        if(isset($_REQUEST[$_key])) {
            $postVars[$_key] = ($_REQUEST[$_key]);
        }
    }

    ///--------------------------------------------------------
    //  CALCULATE A SEARCH METHOD
    //---------------------------------------------------------
    if($postVars['names-method'] === 'owned' && $postVars['names'] !== '') {
        $postVars['searchMethod'] = 'user';
    } else if($postVars['tags'] !== '') {
        $postVars['searchMethod'] = 'tag';
    }


    ///--------------------------------------------------------
    //  DO WE NEED TO GET THE USER INFO/MEDIA COUNT, OR A TAG COUNT
    //---------------------------------------------------------
    if($postVars['itemStartID'] === '') {
        if($postVars['searchMethod'] === 'user') {
            //Lookup the user (use the first one that we find who matches)
            lookupUser($postVars['names']);
        } else if($postVars['searchMethod'] === 'tag') {
            //Lookup the tag (use the first one that we find which matches)
            lookupTag($postVars['tags']);
        }
    }


    ///--------------------------------------------------------
    // CACHING - USED FOR DATA EXPORT
    //---------------------------------------------------------
    $_cacheController = new DataCacher(CACHE_FOLDER, CACHE_FILE_EXTENSION); //init the cache controller
    $_cacheController -> start($postVars['date'], $postVars['searchID']); //start caching


    ///--------------------------------------------------------
    //  NOW DO THE MAIN CALL AND STORE IT IN A 'PRE-FILTER' OBJECT
    //---------------------------------------------------------
    if($postVars['searchMethod'] === 'user' && $postVars['userID'] !== '') {
        //Getting USER photos - https://api.instagram.com/v1/users/{user-id}/media/recent/?access_token=ACCESS-TOKEN
        $_dataResponse['data-pre-filter'] = callAPI('users/' . $postVars['userID'] . '/media/recent/', ($postVars['itemStartID'] !== '') ? 'max_id=' . $postVars['itemStartID'] : '');
    } else if($postVars['searchMethod'] === 'tag') {
        //Getting TAG related photos - /tags/tag-name/media/recent
        //FIRST hashtag is the ONLY important one for fetching the data (there will almost always only be one anyway - except on ALL tag searches)
        $_tags = explode(',', $postVars['tags']);
        $_dataResponse['data-pre-filter'] = callAPI('tags/' . $_tags[0] . '/media/recent/', ($postVars['itemStartID'] !== '') ? 'max_tag_id=' . $postVars['itemStartID'] : '');
    }


    ///--------------------------------------------------------
    //  PROCESS THE RESPONSE DATA
    //---------------------------------------------------------

    //Are we bothering to filter the returned items
    $_filter = (($postVars['searchMethod'] === 'user' && $postVars['tags'] !== '') || ($postVars['searchMethod'] === 'tag' && $postVars['names'] !== '')) ? true : false; //normal filtering
    $_preCheckPassed = true;

    //Store a total count
    $_dataResponse['processedCount'] = count($_dataResponse['data-pre-filter']);

    //Store the oldest post date, so we can feedback to the user how far we have snooped back
    $_dataResponse['dateOldest'] = '';

    //Loop through the data that we found
    for($i=0;$i<count($_dataResponse['data-pre-filter']);$i++) {

        ///--------------------------------------------------------
        //  VARS
        //---------------------------------------------------------
        $_preCheckPassed = true;


        ///--------------------------------------------------------
        //  IS THIS THE OLDEST DATE
        //---------------------------------------------------------
        if($_dataResponse['dateOldest'] === '' || intval($_dataResponse['data-pre-filter'][$i]['created_time']) < $_dataResponse['dateOldest']) {
            $_dataResponse['dateOldest'] = intval($_dataResponse['data-pre-filter'][$i]['created_time']);
        }


        ///--------------------------------------------------------
        //  MATCH VARIABLES FOR ANY SEARCHES
        //---------------------------------------------------------
        $_dataResponse['data-pre-filter'][$i]['matchList'] = array();
        $_dataResponse['data-pre-filter'][$i]['matches'] = array();


        ///--------------------------------------------------------
        //  HACK THE IMAGES TO FIT NICELY
        //---------------------------------------------------------
        $_dataResponse['data-pre-filter'][$i]['images']['standard_resolution']['url'] = str_replace('s150x150', 's640x640', $_dataResponse['data-pre-filter'][$i]['images']['thumbnail']['url']);
        $_dataResponse['data-pre-filter'][$i]['images']['low_resolution']['url'] = str_replace('s150x150', 's332x332', $_dataResponse['data-pre-filter'][$i]['images']['thumbnail']['url']);


        ///--------------------------------------------------------
        //  IF THIS IS AN 'ALL' HASH TAG SEARCH, THEN DO THAT FIRST AS A PRE-CHECK, IF THAT FAILS, THEN THIS ITEM CAN BE SKIPPED
        //---------------------------------------------------------
        if($postVars['tags'] !== '' && $postVars['tags-method'] === 'all') {
            $_preCheckPassed = checkFilters($i, '#', explode(',', $postVars['tags']), $postVars['tags-method']);
        }

        ///--------------------------------------------------------
        //  FILTERING
        //---------------------------------------------------------
        if($_preCheckPassed) {
            if($_filter === true) {
                //Filtered
                if($postVars['searchMethod'] === 'tag') {
                    ///--------------------------------------------------------
                    // BASE SEARCH IS 'TAGS', SO WE ARE LOOKING FOR A 'USERNAME' MATCH
                    //---------------------------------------------------------

                    //Looking for a username match anywhere!
                    checkFilters($i, '@', explode(',', $postVars['names']));

                    //If we found a match for the username, let's lookup the (tags) as well
                    if(count($_dataResponse['data-pre-filter'][$i]['matchList']) > 0) {
                        checkFilters($i, '#', explode(',' , $postVars['tags']));
                    }

                } else if($postVars['searchMethod'] === 'user') {
                    ///--------------------------------------------------------
                    //  BASE SEARCH IS 'USER', SO WE ARE LOOKING FOR A 'TAG' MATCH
                    //---------------------------------------------------------
                    checkFilters($i, '#', explode(',', $postVars['tags']));
                }
            } else if($postVars['tags'] !== '') {
                //Not filtered, but if we are looking for tags, we should mark them up anyway
                checkFilters($i, '#', explode(',' , $postVars['tags']));
            }

            //Only add to list if we found some kind of a match and not already in the list
            if((count($_dataResponse['data-pre-filter'][$i]['matchList']) > 0 || $_filter === false) && !$_cacheController -> exists($_dataResponse['data-pre-filter'][$i]['id'])) {
                //Add to cache
                $_cacheController -> add($_dataResponse['data-pre-filter'][$i]);

                //Add to the main list
                array_push($_dataResponse['data'], $_dataResponse['data-pre-filter'][$i]);
            }
        }
    }

    //Remove the pre-filter array, since it is a load of data we don't need to spit back out
    unset($_dataResponse['data-pre-filter']);


    ///--------------------------------------------------------
    //  RESPONSE
    //--------------------------------------------------------
    echo(json_encode($_dataResponse));


    ///--------------------------------------------------------
    //  WRITE THE CACHE OUT
    //--------------------------------------------------------
    $_cacheController -> save();


    ///--------------------------------------------------------
    //  FILTER CHECK
    //--------------------------------------------------------
    function checkFilters($_id, $_prefix, $_filters, $_method = 'any') {
        //Vars
        global $_dataResponse;
        $_match = true;
        $_itemInfo = &$_dataResponse['data-pre-filter'][$_id]; //pointer to the data object - this ensures it gets updated

        //Track how many of our items were matched (stops dupes)
        $_filtersMatched = array();

        //Make a matches array
        for($i=0;$i<count($_filters);$i++) {
            //What are we searching for?
            $_searchValue = $_prefix . strtolower(trim($_filters[$i]));


            //Check
            $_textToCheck = strtolower($_itemInfo['caption']['text']);
            $_index = strpos($_textToCheck, $_searchValue);

            //Captions - these get shown regardless, so could remove this test?
            if($_index !== false && validateMention($_searchValue, $_index, $_textToCheck)) {
                array_push($_itemInfo['matches'], 'caption|' . $_searchValue);
                (!in_array('caption', $_itemInfo['matchList'])) ? array_push($_itemInfo['matchList'], 'caption') : null;
                (!in_array($i, $_filtersMatched)) ? array_push($_filtersMatched, $i) : null;
            }

            //Comments
            if($_itemInfo['comments']['count'] > 0) {
                for($j=0;$j<count($_itemInfo['comments']['data']);$j++) {
                    //Check
                    $_textToCheck = strtolower($_itemInfo['comments']['data'][$j]['text']);
                    $_index = strpos($_textToCheck, $_searchValue);

                    if($_index !== false && validateMention($_searchValue, $_index, $_textToCheck)) {
                        array_push($_itemInfo['matches'], 'comment' . $j . '|' . $_searchValue);
                        (!in_array('comment' . $j, $_itemInfo['matchList'])) ? array_push($_itemInfo['matchList'], 'comment' . $j) : null;
                        (!in_array($i, $_filtersMatched)) ? array_push($_filtersMatched, $i) : null;
                    }
                }
            }

            //In picture
            if($_prefix === '@') {
                for($j=0;$j<count($_itemInfo['users_in_photo']);$j++) {
                    if('@' . trim(strtolower($_itemInfo['users_in_photo'][$j]['user']['username'])) === $_searchValue) {
                        array_push($_itemInfo['matches'], 'tagged|' . $_searchValue);
                        (!in_array('tagged', $_itemInfo['matchList'])) ? array_push($_itemInfo['matchList'], 'tagged') : null;
                        (!in_array($i, $_filtersMatched)) ? array_push($_filtersMatched, $i) : null;
                    }
                }
            }
        }

        //If method was ALL and the counts don't match, then this is not valid
        if($_method === 'all') {
            //Reset the arrays
            $_itemInfo['matchList'] = array();
            $_itemInfo['matches'] = array();

            //OK
            if(count($_filtersMatched) !== count($_filters)) {
                $_match = false;
            }
        }

        //Return true or false for a match
        return $_match;
    }

    ///--------------------------------------------------------
    //  VALIDATE A MENTION
    //---------------------------------------------------------
    function validateMention($_word, $_index, $_text) {
        //Character after the text
        $_postCharacter = ($_index + strlen($_word) >= strlen($_text)) ? '' : substr($_text, $_index + strlen($_word), 1);

        //If post character is blank, not an underscore and not alphanumeric character, then the match is good
        if($_postCharacter === '' || (ctype_alnum($_postCharacter) === false && $_postCharacter !== '_')) {
            return true;
        } else {
            return false;
        }
    }


    ///--------------------------------------------------------
    //  LOOKUP A USER FROM A NAME
    //---------------------------------------------------------
    function lookupUser($_name) {
        //Globals
        global $_dataResponse, $postVars;

        //Look the user up by searching for them
        $_items = callAPI('users/search', 'q=' . $_name, '', 100, true, false); //don't check for pagination!
        $_itemID = 0;

        //Attempt to match the user correctly
        if(count($_items) > 0) {
            for($i = 0; $i < count($_items);$i ++) {
                if(strtolower($_items[$i]['username']) === $_name) {
                    $_itemID = $i;
                    break;
                }
            }
        }

        //If we found a user, we now need to get the info etc.
        if(isset($_items[$_itemID])) {
            //Get the user info (so we can get their media count)
            $_info = callAPI('users/' . $_items[$_itemID]['id'] . '/', '', '', -1, true, false);

            //Store a count for items
            $_dataResponse['itemCount'] = $_info['counts']['media']; //push back an item count

            //Store the ID
            $_dataResponse['userID'] = $_items[$_itemID]['id']; //send back to the front end, so we can re-post for future calls
            $postVars['userID'] = $_dataResponse['userID']; //required for further API calls on this execution
        }
    }


    ///--------------------------------------------------------
    //  LOOKUP A TAG FROM A NAME
    //---------------------------------------------------------
    function lookupTag($_tags) {
        //Globals
        global $_dataResponse, $postVars;

        //Split the tags (there is only one set of circumstances where there will be more than one here = multiple tag search with ALL ticked)
        $_tags = explode(',', $_tags);
        $_info = callAPI('tags/' . $_tags[0], '', '', 1, true, false); //don't check for pagination!

        //Store a count
        $_dataResponse['itemCount'] = $_info['media_count'];
    }


    ///--------------------------------------------------------
    //  CALL THE API
    //---------------------------------------------------------
    function callAPI($_method, $_query = '', $_startID = '', $_count = -1, $_stripDataNode = true, $_checkForPagination = true) {
        //Global response object
        global $_dataResponse;

        //Default count value
        $_count = (intval($_count <= 0)) ? COUNT : intval($_count);

        //Build the URL...
        $_url = API_URL . $_method . '?' . $_query . '&access_token=' . ACCESS_TOKEN . '&count=' . $_count;

        //Start ID
        if($_startID !== '') { $_url .= '&next_max_id=' . $_startID; }

        //Add the URL into our list
        array_push($_dataResponse['calls'], $_url);

        //Curl
        $_curl = curl_init($_url);
        curl_setopt($_curl, CURLOPT_RETURNTRANSFER, 1);   // to return the transfer as a string of the return value of curl_exec() instead of outputting it out directly.
        curl_setopt($_curl, CURLOPT_SSL_VERIFYPEER, false);   // to stop cURL from verifying the peer's certificate.
        $_response = curl_exec($_curl);

        //Process the response
        if($_response !== false) {
            //Decode
            $_response = json_decode($_response, true);

            //Is there an error?
            if(isset($_response['meta']) && $_response['meta']['code'] !== 200) {
                //Inject the meta as an error into the global object
                $_dataResponse['error'] = $_response['meta'];

                //Blank the array (so we return no data)
                $_response = array();
            } else {
                //Pagination
                if(isset($_response['pagination']) && $_checkForPagination === true) {
                    $_dataResponse['pagination'] = $_response['pagination'];
                }

                //If we are stripping the data node, then do that!
                if($_stripDataNode === true && isset($_response['data'])) {
                    $_response = $_response['data'];
                }
            }
        } else {
            //Failed?
            $_response = array();
        }

        //Close the CURL
        curl_close($_curl);

        //Return
        return $_response;
    }
?>