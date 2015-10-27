<?php
    //Read the file
    $_contents = @file_get_contents($_GET['remote-filename']);

    //Header
    header('Content-Description: File Transfer');
    header('Content-Type: image/jpeg');
    header('Content-Disposition: attachment; filename=' . $_GET['filename'] . '.jpg');
    header('Content-Transfer-Encoding: binary');
    header('Connection: Keep-Alive');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Pragma: public');
    header('Content-Length: ' . strlen($_contents));
    echo($_contents);
?>
