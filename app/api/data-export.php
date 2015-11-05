<?php
    /**
     *  @site           Super Snooper
    *   @function       Data Exporter
    *   @author         Amanaman
    *   @copyright      Copyright 2015, Last17.com
    *   @version        0.01
    *
    *********************************************************************************************/


      //--------------------------------------------------------
      //  REQUIRES
      //--------------------------------------------------------
      require_once('config.php');
      require_once '_lib/DataExporter.php';

      //Serious limits
      ini_set('memory_limit','256M');
      ini_set('max_execution_time', 300);


      //--------------------------------------------------------
      //  EXPORT!!!
      //--------------------------------------------------------
      if(isset($_REQUEST['cacheID']) && isset($_REQUEST['date'])) {
        $_exporter = new DataExporter();
        $_exporter -> exportData(CACHE_FOLDER . '/' . str_replace('-', '/', $_REQUEST['date']) . '/' . $_REQUEST['cacheID'] . '.txt', '_exports/' . $_REQUEST['cacheID'] , array('xls', 'xlsx'));

        //Now just ping back the file
        $_filename = '_exports/' . $_REQUEST['cacheID'] . '.xlsx';

        //Read the file
        $_contents = @file_get_contents($_filename);

        //Header
        header('Content-Description: File Transfer');
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename=' . $_REQUEST['cacheID'] . '.xlsx');
        header('Content-Transfer-Encoding: binary');
        header('Connection: Keep-Alive');
        header('Expires: 0');
        header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
        header('Pragma: public');
        header('Content-Length: ' . strlen($_contents));
        echo($_contents);
      }
?>