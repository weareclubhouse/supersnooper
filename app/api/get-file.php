<?php
    /*----------------------------------------------
    - GO GO GO!
    ---------------------------------------------*/
    $_tempName = '_cache/' . time() . '.jpg'; //temporary name for fetched file
    $_contents = getImage($_GET['remote-filename'], $_tempName, 'stream'); //fetch the raw contents
    $_image = imagecreatefromjpeg($_tempName); //turn it into a JPG

    //Header
    header('Content-Description: File Transfer');
    header('Content-Type: image/png');
    header('Content-Disposition: attachment; filename=' . $_GET['filename'] . '.jpg');
    header('Content-Transfer-Encoding: binary');
    header('Connection: Keep-Alive');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Pragma: public');
    //header('Content-Length: ' . strlen($_contents)); - caused truncated files
    imagejpeg($_image);

    //Remove the temporary image
    unlink($_tempName);

    /*----------------------------------------------
    - FETCH A REMOTE IMAGE
    ---------------------------------------------*/
    function getImage($_url, $_name, $_method = 'stream') {
        if($_method === 'stream') {
            //Get contents
            $_imageData = file_get_contents($_url);
        } else if($_method === 'curl') {
            //Curl
            $_curl = curl_init($_url);
            curl_setopt($_curl, CURLOPT_HEADER, 0);
            curl_setopt($_curl, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt($_curl, CURLOPT_BINARYTRANSFER,1);

            //Fetch
            $_imageData = curl_exec ($_curl);

            //Close
            curl_close ($_curl);
        }

        //Save to file
        $fp = fopen($_name, 'w+');
        fwrite($fp, $_imageData);
        fclose($fp);

        //Return the data
        return $_imageData;
    }
?>
