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


    //--------------------------------------------------------
    //  HEADERS
    //--------------------------------------------------------
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, PUT, POST, DELETE, OPTIONS');
    header('Content-Type: application/json');


    ///--------------------------------------------------------
    //  GLOBALS
    //---------------------------------------------------------
    define('API_URL', 'https://api.instagram.com/v1/');
    define('COUNT', 100); //default amount of items to fetch per request, to be honest instagram decides this as 33 on the endpoints anyway, but we set it high just in case it is allowed


    ///--------------------------------------------------------
    //  RANDOM ACCESS TOKEN FROM OUR FILES
    //---------------------------------------------------------
    $_fileList = scandir('../auth/');
    $_tokens = array();
    for($i=0;$i<count($_fileList);$i++) {
        if(strpos($_fileList[$i], 'ACCESSTOKEN_') === 0) {
            array_push($_tokens, '../auth/' . $_fileList[$i]);
        }
    }

    //print_r($_tokens);
    if(count($_tokens) > 0) {
        $_token = json_decode(file_get_contents($_tokens[rand(0, count($_tokens) - 1)]), true);
        define('ACCESS_TOKEN', $_token['access_token']);
    } else {
        //Go to the auth page
        header('Location: ../auth/');
    }


    ///--------------------------------------------------------
    //  RESPONSE OBJECT
    //---------------------------------------------------------
    $_dataResponse = array('result' => 'OK', 'calls' => array(), 'pagination' => '', 'data-pre-filter' => array(), 'data' => array());

    ///--------------------------------------------------------
    //  DEFAULT PARAMS
    //---------------------------------------------------------
    $postVars = array(
        'type' => 'tag', //user, tag
        'search' => 'dog', //search terms (either names or tags)
        'filterType' => '', //user, tag, blank
        'filters' => '',
        'keywords' => '',
        'userID' => '',
        'tagCount' => '',
        'itemStartID' => '',
        'searchID' => '' //unique search ID for caching
    );

    foreach($postVars as $_key => $_value) {
        if(isset($_REQUEST[$_key])) {
            $postVars[$_key] = ($_REQUEST[$_key]);
        }
    }

    //Split up the filters
    if($postVars['filters'] !== '') {
        $postVars['filters'] = explode(',', $postVars['filters']);
    }

    //Split up the keywords
    if($postVars['keywords'] !== '') {
        //Split at pipe and empty the old value out
        $_keys = explode('|', $postVars['keywords']);
        $postVars['keywords'] = array();

        //Loop
        for($i=0;$i<count($_keys);$i++) {
            array_push($postVars['keywords'], explode(',', $_keys[$i]));
        }
    }


    ///--------------------------------------------------------
    //  DO WE NEED TO GET THE USER INFO?
    //---------------------------------------------------------
    if($postVars['type'] === 'user' && $postVars['userID'] === '') {
        //Lookup the user (use the first one that we find who matches)
        $_users = lookupUser($postVars['search'], 1);
        if(count($_users) > 0) {
            $_dataResponse['user'] = $_users[0];
            $postVars['userID'] = $_dataResponse['user']['id'];
        }
    } else if($postVars['type'] === 'tag' && $postVars['tagCount'] === '') {
        //Lookup the user (use the first one that we find who matches)
        $_tag = lookupTag($postVars['search'], 1);
        if(count($_tag) > 0) {
            $_dataResponse['tag'] = $_tag;
            //$postVars['tagCount'] = $_tag['media_count'];
        }
    }


    //--------------------------------------------------------
    //  DO WE NEED TO GENERATE AN ID FOR THIS SEARCH
    //---------------------------------------------------------
    if($postVars['searchID'] === '') {
        $postVars['searchID'] = uniqid();
        $_dataResponse['searchID'] = $postVars['searchID'];

    }


    ///--------------------------------------------------------
    //  CACHING (USE FOR DATA EXPORT)
    //---------------------------------------------------------

    //ID for the cache file
    $_cacheID = checkCacheFolder() . $postVars['searchID'] . '.' . CACHE_FILE_EXTENSION;
    $_cacheData = array();

    if(file_exists($_cacheID)) {
        //Read in the current data
        $_cacheData = json_decode(file_get_contents($_cacheID), true);
    }


    ///--------------------------------------------------------
    //  NOW DO THE MAIN CALL
    //---------------------------------------------------------
    if($postVars['type'] === 'user' && $postVars['userID'] !== '') {
        //Getting USER photos - https://api.instagram.com/v1/users/{user-id}/media/recent/?access_token=ACCESS-TOKEN
        //MAX_TIMESTAMP, MIN_TIMESTAMP, MIN_ID, MAX_ID are allowed here... (we could use the timestamps as well?)
        $_dataResponse['data-pre-filter'] = callAPI('users/' . $postVars['userID'] . '/media/recent/', ($postVars['itemStartID'] !== '') ? 'max_id=' . $postVars['itemStartID'] : '');
    } else if($postVars['type'] === 'tag') {
        //Getting TAG related photos - /tags/tag-name/media/recent
        //MIN_TAG_ID && MAX_TAG_ID are used here, so we need to do our own filtering to decide if there is more to fetch...
        //FIRST hashtag is the important one
        $_tags = explode(',', $postVars['search']);
        $_dataResponse['data-pre-filter'] = callAPI('tags/' . $_tags[0] . '/media/recent/', ($postVars['itemStartID'] !== '') ? 'max_tag_id=' . $postVars['itemStartID'] : '');
    }






    ///--------------------------------------------------------
    //  FILTER THE RESPONSE (SAVES US DOING IT CLIENT SIDE)
    //---------------------------------------------------------

    //Filter flags
    $_filter = ($postVars['filterType'] !== '') ? true : false; //normal filtering

    //Loop through the data
    for($i=0;$i<count($_dataResponse['data-pre-filter']);$i++) {

        //New variables
        $_dataResponse['data-pre-filter'][$i]['matchList'] = array();
        $_dataResponse['data-pre-filter'][$i]['matches'] = array();


        ///--------------------------------------------------------
        //  FLAG UP MATCHES AND WHERE THEY ARE IF THIS IS A HASH TAG SEARCH
        //---------------------------------------------------------
        if($postVars['type'] === 'tag') {
            //checkFilters($i, '#', array($postVars['search']));
        }

        ///--------------------------------------------------------
        //  FILTERING
        //---------------------------------------------------------
        if($_filter === true) {
            //Act
            if($postVars['filterType'] === 'user') {
                ///--------------------------------------------------------
                // USERS
                //---------------------------------------------------------

                //Looking for a username match anywhere!
                checkFilters($i, '@', $postVars['filters']);

                //If we found a match for the username, let's lookup where the tag was as well...
                if(count($_dataResponse['data-pre-filter'][$i]['matchList']) > 0) {
                    checkFilters($i, '#', array($postVars['search']));
                }


            } else if($postVars['filterType'] === 'tag') {
                ///--------------------------------------------------------
                //  TAGS
                //---------------------------------------------------------
                checkFilters($i, '#', $postVars['filters']);
            }

        }

        //Only add to cached list if we found some kind of a match (we only add certain fields, else the cache gets massive)
        if(count($_dataResponse['data-pre-filter'][$i]['matchList']) > 0 || $_filter === false) {
            $_itemData = array(
                'id' => $_dataResponse['data-pre-filter'][$i]['id'],
                'username' => $_dataResponse['data-pre-filter'][$i]['user']['username'],
                'avatar' => $_dataResponse['data-pre-filter'][$i]['user']['profile_picture'],
                'tags' => implode($_dataResponse['data-pre-filter'][$i]['tags'], ','),
                'caption' => '',
                'image' => $_dataResponse['data-pre-filter'][$i]['images']['standard_resolution']['url'],
                'tagged_in_photo' => (in_array('tagged', $_dataResponse['data-pre-filter'][$i]['matchList'])) ?  'Yes' : 'No',
                'comments' => '',
                'link' => $_dataResponse['data-pre-filter'][$i]['link'],
                'created_time' => $_dataResponse['data-pre-filter'][$i]['created_time'],
                'count_likes' => $_dataResponse['data-pre-filter'][$i]['likes']['count'],
                'count_comments' => $_dataResponse['data-pre-filter'][$i]['comments']['count']
            );

            //Caption goes in regardless
            if(isset($_dataResponse['data-pre-filter'][$i]['caption']) && isset($_dataResponse['data-pre-filter'][$i]['caption']['text'])) {
                $_itemData['caption'] = $_dataResponse['data-pre-filter'][$i]['caption']['text'];
            }

            //Push any comments in that we think are relevant
            for($j=0;$j<count($_dataResponse['data-pre-filter'][$i]['matchList']);$j++) {
                if(strpos($_dataResponse['data-pre-filter'][$i]['matchList'][$j], 'comment') !== false) {
                    $_itemData['comments'] .= ($_itemData['comments'] !== '') ? '

                    ' : '';
                    $_itemData['comments'] .= $_dataResponse['data-pre-filter'][$i]['comments']['data'][substr($_dataResponse['data-pre-filter'][$i]['matchList'][$j], 7)]['text'];
                }
            }

            //Add this to our cached data
            array_push($_cacheData, $_itemData);
        }



        //Add to the main list regardless (since all the data gets pushed back to front end regardless)
        array_push($_dataResponse['data'], $_dataResponse['data-pre-filter'][$i]);
    }

    //Remove the pre-filter array
    unset($_dataResponse['data-pre-filter']);


    ///--------------------------------------------------------
    //  RESPONSE
    //--------------------------------------------------------
    echo(json_encode($_dataResponse));


    ///--------------------------------------------------------
    //  WRITE THE CACHE OUT
    //--------------------------------------------------------
    $_cache = fopen($_cacheID, 'w+');
    fwrite($_cache, json_encode($_cacheData));
    fclose($_cache);


    ///--------------------------------------------------------
    //  FILTER CHECK
    //--------------------------------------------------------
    function checkFilters($_id, $_prefix, $_filters) {
        //Vars
        global $postVars, $_dataResponse;
        $_match = true;
        $_itemInfo = &$_dataResponse['data-pre-filter'][$_id]; //pointer to the data object

        //Make a matches array
        for($i=0;$i<count($_filters);$i++) {
            //What are we searching for?
            $_searchValue = $_prefix . strtolower(trim($_filters[$i]));

            //Captions
            if(strpos(strtolower($_itemInfo['caption']['text']), $_searchValue) !== false) {
                array_push($_itemInfo['matches'], 'caption|' . $_searchValue);
                (!in_array('caption', $_itemInfo['matchList'])) ? array_push($_itemInfo['matchList'], 'caption') : null;
            }

            //Comments
            if($_itemInfo['comments']['count'] > 0) {
                for($j=0;$j<count($_itemInfo['comments']['data']);$j++) {
                    if(strpos(strtolower($_itemInfo['comments']['data'][$j]['text']), $_searchValue) !== false) {
                        array_push($_itemInfo['matches'], 'comment' . $j . '|' . $_searchValue);
                        (!in_array('comment' . $j, $_itemInfo['matchList'])) ? array_push($_itemInfo['matchList'], 'comment' . $j) : null;
                    }
                }
            }

            //In picture!
            if($_prefix === '@') {
                for($j=0;$j<count($_itemInfo['users_in_photo']);$j++) {
                    if('@' . trim(strtolower($_itemInfo['users_in_photo'][$j]['user']['username'])) === $_searchValue) {
                        array_push($_itemInfo['matches'], 'tagged|' . $_searchValue);
                        (!in_array('tagged', $_itemInfo['matchList'])) ? array_push($_itemInfo['matchList'], 'tagged') : null;
                    }
                }
            }
        }

        //Return true or false for a match
        return $_match;
    }


    ///--------------------------------------------------------
    //  LOOKUP A USER FROM A NAME
    //---------------------------------------------------------
    function lookupUser($_name) {
        $_response = callAPI('users/search', 'q=' . $_name, '', 1, true, false); //don't check for pagination!
        return $_response;
    }


    ///--------------------------------------------------------
    //  LOOKUP A TAG FROM A NAME
    //---------------------------------------------------------
    function lookupTag($_name) {
        $_response = callAPI('tags/' . $_name, '', '', 1, true, false); //don't check for pagination!
        return $_response;
    }


    ///--------------------------------------------------------
    //  LOOKUP A USER FROM A NAME
    //---------------------------------------------------------
    function callAPI($_method, $_query = '', $_startID = '', $_count = -1, $_stripDataNode = true, $_checkForPagination = true) {
        //Global response object
        global $_dataResponse;

        //Default count value
        $_count = (intval($_count <= 0)) ? COUNT : intval($_count);

        //Build the URL...
        $_url = API_URL . $_method . '?' . $_query . '&access_token=' . ACCESS_TOKEN . '&count=' . $_count;

        //Start ID
        if($_startID !== '') {
            $_url .= '&next_max_id=' . $_startID;
        }

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