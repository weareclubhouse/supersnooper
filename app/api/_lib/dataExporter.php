<?php
    /*
    *   @site           SuperSnooper
    *   @function       Export Data from a result set
    *   @author         Greg Findon
    *   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
    *   @version        0.01
    *
    *********************************************************************************************/

      /************************************************
      * REQUIRES
      ************************************************/

      require_once '_lib/PHPExcel.php';


      /************************************************
      * DEFAULTS
      ************************************************/
      date_default_timezone_set('Europe/London');
      define('EOL',(PHP_SAPI == 'cli') ? PHP_EOL : '<br />');


      /************************************************
       * CLASS DEFINITION
      ************************************************/
      class dataExporter {
            /************************************************
            * VARS
            ************************************************/

            //PHP to Excel object
            private $objPHPExcel;

            //Data Main
            private $columns = array(
              'main' => array(
                array('id' => 'created_time', 'align' => 'center', 'type' => 'date', 'name' => 'Date', 'width' => 20),
                array('id' => 'id', 'align' => 'center', 'type' => 'text', 'name' => 'ID', 'width' => 20),
                array('id' => 'username', 'align' => 'center', 'type' => 'text', 'name' => 'User', 'width' => 30),
                array('id' => 'caption', 'align' => 'center', 'type' => 'text', 'name' => 'Caption', 'width' => 60),
                array('id' => 'comments', 'align' => 'center', 'type' => 'text', 'name' => 'Comments', 'width' => 60),
                array('id' => 'tagged_in_photo', 'align' => 'center', 'type' => 'text', 'name' => 'Tagged In Photo?', 'width' => 20),
                array('id' => 'avatar', 'align' => 'center', 'type' => 'link', 'name' => 'Avatar', 'width' => 30),
                array('id' => 'tags', 'align' => 'center', 'type' => 'text', 'name' => 'Tags', 'width' => 20),
                array('id' => 'link', 'align' => 'center', 'type' => 'link', 'name' => 'Link', 'width' => 20),
                array('id' => 'image', 'align' => 'center', 'type' => 'link', 'name' => 'Media', 'width' => 30),
                array('id' => 'count_likes', 'align' => 'center', 'type' => 'text', 'name' => 'Likes', 'width' => 20),
                array('id' => 'count_comments', 'align' => 'center', 'type' => 'text', 'name' => 'Comments', 'width' => 20)
              )
            );

            //Cursor position
            private $cursorBaseX = 1;
            private $cursorBaseY = 2;
            private $cursor = array('x' => 1, 'y' => 2);

            //Styling
            private $colours = array(
                  'green' => '6CBAA6',
                  'orange' => 'DC8F55',
                  'red' => 'C05353',
                  'white' => 'ffffff',
                  'black' => '000000',
                  'grey-dark' => '212121',
                  'grey-light' => 'dedede'

            );

            private $styles = array();


            //File saving
            protected $baseFilename = '';
            protected $fileTypes = array('csv');
            protected $targetFolder = '';
            protected $password = '';


            /************************************************
            * CONSTRUCTOR
            ************************************************/
            public function __construct() {

                  //Setup the styles
                  $this -> setStyles();
            }


            /************************************************
            * SET STYLES
            ************************************************/
            private function setStyles() {
                  $this -> styles['column-header-main'] = array(
                        'font' => array(
                              'name' => 'Arial', 'size' => 13, 'bold' => true,
                              'color' => array('rgb' => $this -> colours['white'])
                        ),
                        'fill'  => array(
                              'type'  => PHPExcel_Style_Fill::FILL_SOLID,
                              'color' => array('rgb' => $this -> colours['red'])
                        ),
                        'alignment' => array(
                              'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
                        )
                  );

                  $this -> styles['column-header-expenses'] = array(
                        'font' => array(
                              'name' => 'Arial', 'size' => 13, 'bold' => true,
                              'color' => array('rgb' => $this -> colours['white'])
                        ),
                        'fill'  => array(
                              'type'  => PHPExcel_Style_Fill::FILL_SOLID,
                              'color' => array('rgb' => $this -> colours['green'])
                        ),
                        'alignment' => array(
                              'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
                        )
                  );

                  //Data
                  $this -> styles['data-left'] = array(
                        'alignment' => array(
                              'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_LEFT,
                        )
                  );

                  $this -> styles['data-center'] = array(
                        'alignment' => array(
                              'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
                        )
                  );

                  $this -> styles['data-right'] = array(
                        'alignment' => array(
                              'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_RIGHT,
                        )
                  );

                  $this -> styles['data-link-left'] = array(
                        'font' => array(
                              'color' => array('rgb' => $this -> colours['red'])
                        ),
                        'alignment' => array(
                              'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_LEFT,
                        )
                  );

                  $this -> styles['data-link-center'] = array(
                        'font' => array(
                              'color' => array('rgb' => $this -> colours['red'])
                        ),
                        'alignment' => array(
                              'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_CENTER,
                        )
                  );

                  $this -> styles['data-link-right'] = array(
                        'font' => array(
                              'color' => array('rgb' => $this -> colours['red'])
                        ),
                        'alignment' => array(
                              'horizontal' => PHPExcel_Style_Alignment::HORIZONTAL_RIGHT,
                        )
                  );
            }


            /************************************************
            * EXPORT INIT
            ************************************************/
            protected function exportInit() {
                  //Reset the cursor
                  $this -> cursorReset();

                  //Make the object
                  //echo date('H:i:s') , " Created new PHPExcel object." , EOL;
                  $this -> objPHPExcel = new PHPExcel();

                  //Set to the first sheet
                  $this -> objPHPExcel -> setActiveSheetIndex(0);

                  //Set the document properties
                  $this -> setDocumentProperties();

                  //Title
                  $this -> objPHPExcel -> getActiveSheet() -> setTitle('Results');
            }


            /************************************************
            * RESET THE CURSOR
            ************************************************/
            private function cursorReset() {
                  $this -> cursor['x'] = $this -> cursorBaseX;
                  $this -> cursor['y'] = $this -> cursorBaseY;
            }



            /************************************************
            * EXPORT EXPENSES INIT
            ************************************************/
            protected function exportExpensesInit() {
                  //Start a new sheet
                  $this -> objPHPExcel->createSheet();
                  $this -> objPHPExcel -> setActiveSheetIndex(1);

                  //Reset the cursor
                  $this -> cursorReset();

                  //Title
                  $this -> objPHPExcel -> getActiveSheet() -> setTitle('Expenses');
            }


            /************************************************
            * EXPORT COMPLETE
            ************************************************/
            protected function exportComplete() {
                  //Autosize the columns - bit rubbish
                  $this -> autosizeColumns(
                        $this -> objPHPExcel -> getActiveSheet()
                  );

                  //Set to the first sheet
                  $this -> objPHPExcel -> setActiveSheetIndex(0);
            }


            /************************************************
            * CREATE A SET OF COLUMN HEADERS
            ************************************************/
            private function createColumnHeaders($_type) {
              for($i=0;$i<count($this -> columns[$_type]);$i++) {
                  $this -> createColumnHeader($this -> columns[$_type][$i]['name'], $this -> columns[$_type][$i]['width'], $_type);
                }
            }


            /************************************************
            * CREATE A COLUMN HEADER
            ************************************************/
            protected function createColumnHeader($_title, $_width, $_type) {
                  //Add the header
                  $this -> objPHPExcel -> getActiveSheet() -> setCellValueByColumnAndRow($this -> cursor['x'], $this -> cursor['y'], strtoupper($_title));

                  //Style it
                  $this -> styleCell($this -> cursor['x'], $this -> cursor['y'], 'column-header-' . $_type);

                  //Set the width
                  $this -> objPHPExcel -> getActiveSheet() -> getColumnDimensionByColumn($this -> cursor['x']) -> setWidth($_width);

                  ///Next column
                  $this -> cursor['x']++;
            }



            /************************************************
            * CREATE A DATA ROW
            ************************************************/
            protected function createDataRow($_data) {
                  //Cursor
                  $this -> cursor['x'] = $this -> cursorBaseX;
                  $this -> cursor['y']++;

                  //Make our cells

                  for($i=0;$i<count($this -> columns['main']);$i++) {

                        //Write out the data (we use set EXPLICIT to allow for variables that start with '=' which will mess everything up)
                        $_value = $this -> getFieldValue($_data, $this -> columns['main'][$i]);
                        $this -> objPHPExcel -> getActiveSheet() -> setCellValueExplicitByColumnAndRow($this -> cursor['x'], $this -> cursor['y'], $_value);

                        //Set the URL?
                        if($this -> columns['main'][$i]['type'] === 'link') {
                              //Link & different styling
                              $this -> objPHPExcel -> getActiveSheet() -> getCellByColumnAndRow($this -> cursor['x'], $this -> cursor['y']) -> getHyperlink() -> setUrl(strip_tags($_value));
                              $this -> styleCell($this -> cursor['x'], $this -> cursor['y'], 'data-link-' . $this -> columns['main'][$i]['align'] );
                        } else {
                              //Normal styling
                              $this -> styleCell($this -> cursor['x'], $this -> cursor['y'], 'data-' . $this -> columns['main'][$i]['align'] );
                        }

                        ///Next column
                        $this -> cursor['x']++;
                  }
            }


            /************************************************
            * CONVERT FIELD DATA TO SOMETHING VIEWABLE IF WE NEED TO
            ************************************************/
            protected function getFieldValue($_data, $_fieldInfo) {

                 //Text
                $_str = (isset($_data[$_fieldInfo['id']])) ? $_data[$_fieldInfo['id']] : '';

                //Caption and comments need some extra escaping...
                if($_fieldInfo['id'] == 'caption' || $_fieldInfo['id'] === 'comments') {
                  $_str = ($_str);
                }

                //Date?
                if($_fieldInfo['type'] === 'date') {
                  $_str = strftime("%d.%m.%Y - %H:%M:%S", $_data[$_fieldInfo['id']]);
                }

                //Return
                return $_str;
            }


            /************************************************
            * APPLY STYLING TO A GIVEN CELL
            ************************************************/
            private function styleCell($_x, $_y, $_styleID) {
                  //Apply some styling
                  $this -> objPHPExcel -> getActiveSheet() -> getStyleByColumnAndRow($_x, $_y) -> applyFromArray($this -> styles[$_styleID]);
            }




            /************************************************
            * AUTO SIZE THE COLUMNS
            ************************************************/
            private function autosizeColumns($_sheet) {
                  //Highest column ID
                  $_highColumnID = $this->objPHPExcel->setActiveSheetIndex(0)->getHighestColumn();
                  $_highColumnNumber = PHPExcel_Cell::columnIndexFromString($_highColumnID);
                  foreach (range(0, $_highColumnNumber) as $col) {
                        $this -> objPHPExcel->getActiveSheet() -> getColumnDimensionByColumn($col) -> setAutoSize(true);
                  }
            }



            /************************************************
            * SET THE DOCUMENT PROPERTIES
            ************************************************/
            private function setDocumentProperties() {
                  //echo date('H:i:s') , " Set document properties." , EOL;
                  $this -> objPHPExcel -> getProperties() -> setCreator("SuperSnooper.io");
                  $this -> objPHPExcel -> getProperties() -> setLastModifiedBy("SuperSnooper.io");
                  $this -> objPHPExcel -> getProperties() -> setTitle("Search Export");
                  $this -> objPHPExcel -> getProperties() -> setSubject("Search Export");
                  $this -> objPHPExcel -> getProperties() -> setDescription("Exported search file.");
                  $this -> objPHPExcel -> getProperties() -> setKeywords("super snooper search export");
                  $this -> objPHPExcel -> getProperties() -> setCategory("Search");
            }



            /************************************************
            * SAVE A GIVEN FILE FORMAT
            ************************************************/
            protected function saveFileFormat($_format) {

                  //Debug
                  //echo EOL, date('H:i:s') , " Write to '" . $_format ."' format" , EOL;
                  $_callStartTime = microtime(true);

                  //Act
                  if($_format === 'xls') {
                        $_objWriter = PHPExcel_IOFactory::createWriter($this -> objPHPExcel, 'Excel5');
                  } else if($_format === 'xlsx') {
                        $_objWriter = PHPExcel_IOFactory::createWriter($this -> objPHPExcel, 'Excel2007');
                  }

                  //Write it
                  $_objWriter -> save($this -> getFilename($_format));

                  //Debug
                  $_callEndTime = microtime(true);
                  $_callTime = $_callEndTime - $_callStartTime;
                  //echo date('H:i:s') , " File written to " , $this -> getFilename($_format) , EOL;
                  //echo 'Call time to write Workbook was ' , sprintf('%.4f',$_callTime) , " seconds" , EOL;

                  // Echo memory usage
                  //echo date('H:i:s') , ' Current memory usage: ' , (memory_get_usage(true) / 1024 / 1024) , " MB" , EOL;
            }


            /************************************************
            * EXPORT THE DATA
            ************************************************/
            public function exportData($_cacheFile, $_baseFilename, $_fileTypes) {
                  //Store the variables
                  $this -> baseFilename = $_baseFilename;
                  $this -> fileTypes = $_fileTypes;

                  //Export Init
                  $this -> exportInit();

                  //Crate some headers!
                  $this -> createColumnHeaders('main');


                  //Read in the data from the cache file
                  if(file_exists($_cacheFile)) {
                        $_info = json_decode(file_get_contents($_cacheFile), true);
                        for($i=0;$i<count($_info);$i++) {
                              $this -> createDataRow($_info[$i]);
                        }
                  }

                  //Export Complete (custom function in extended class)
                  $this -> exportComplete();

                  //Save it
                  $this -> saveData();
            }

            /************************************************
            * SAVE THE DATA
            ************************************************/
            private function saveData() {
              //Loop through our file formats and save each one
              for($i=0;$i<count($this -> fileTypes);$i++) {
                $this -> saveFileFormat($this -> fileTypes[$i]);
              }
            }


            /************************************************
            * GET A FILENAME FOR SAVING
            ************************************************/
            protected function getFilename($_format) {
              $_filename =  $this -> baseFilename . '.' . $_format;
              ($this -> targetFolder !== '') ? $_filename .= $this -> targetFolder . '/' : null;
              return $_filename;
            }


      }
?>
