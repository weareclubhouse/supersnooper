<?php
    /*
    *   @site           SuperSnooper
    *   @function       Data Cacher (saves found data in a format that we can later export if needed)
    *   @author         Greg Findon
    *   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
    *   @version        0.01
    *
    *********************************************************************************************/

    /*--------------------------------------------------
    - CLASS DEFINITION
    --------------------------------------------------*/
    class DataCacher {
        /*--------------------------------------------------
        - VARS
        --------------------------------------------------*/
        private $folder; //base folder for storing cached files
        private $fileExtension; //file extensions
        private $fileID; //id for the file
        private $data; //array of objects
        private $idList; //list of IDs

        /*--------------------------------------------------
        - CONSTRUCTOR
        --------------------------------------------------*/
        public function __construct($_folder, $_extension) {
            //Save the variables
            $this -> folder = $_folder;
            $this -> fileExtension = $_extension;
        }


        /*--------------------------------------------------
        - START
        --------------------------------------------------*/
        public function start($_date, $_fileID) {
            //ID
            $this -> fileID = $this -> checkCacheFolder($_date) . $_fileID . '.' . $this -> fileExtension;

            //Blank array
            $this -> data = array();

            //If the file already exists, then read it back in
            if(file_exists($this -> fileID)) {
                //Read in the current data
                $this -> data = json_decode(file_get_contents($this -> fileID), true);
            }

            //Make a list of IDs for comparison to stop dupes
            $this -> idList = array();
            for($i = 0; $i < count($this -> data); $i++) {
                $this -> idList[$this -> data[$i]['id']] = 1;
            }
        }


        /*--------------------------------------------------
        - EXISTS
        --------------------------------------------------*/
        public function exists($_id) {
            return isset($this -> idList[$_id]);
        }


        /*--------------------------------------------------
        - ADD
        --------------------------------------------------*/
        public function add($_data) {
            //Add to the list so we don't get dupes
            $this -> idList[$_data['id']] = 1;

            //Truncated object so we aren't saving everything
            $_itemData = array(
                'id' => $_data['id'],
                'username' => $_data['user']['username'],
                'avatar' => $_data['user']['profile_picture'],
                'tags' => implode($_data['tags'], ','),
                'caption' => '',
                'image' => $_data['images']['standard_resolution']['url'],
                'tagged_in_photo' => (in_array('tagged', $_data['matchList'])) ? 'Yes' : 'No',
                'comments' => '',
                'link' => $_data['link'],
                'created_time' => $_data['created_time'],
                'count_likes' => $_data['likes']['count'],
                'count_comments' => $_data['comments']['count']
            );

            //Caption goes in regardless
            if(isset($_data['caption']) && isset($_data['caption']['text'])) {
                $_itemData['caption'] = $_data['caption']['text'];
            }

            //Push any comments in that we think are relevant to the 'matchlist'
            for($j=0;$j<count($_data['matchList']);$j++) {
                if(strpos($_data['matchList'][$j], 'comment') !== false) {
                    //Add a line break if this isn't the first one
                    $_itemData['comments'] .= ($_itemData['comments'] !== '') ? '

                    ' : '';

                    //Add the comment
                    $_itemData['comments'] .= $_data['comments']['data'][substr($_data['matchList'][$j], 7)]['text'];
                }
            }

            //Add to the current array
            array_push($this -> data, $_itemData);
        }


        /*--------------------------------------------------
        - SAVE
        --------------------------------------------------*/
        public function save() {
            $_cache = fopen($this -> fileID, 'w+');
            fwrite($_cache, json_encode($this -> data));
            fclose($_cache);
        }


        /*--------------------------------------------------
        - CHECK THE CACHE FOLDER
        --------------------------------------------------*/
        private function checkCacheFolder($_date = '') { //YYYY-MM-DD
            //Time
            if($_date === '') {
                //Use current time
                $_time = time();
                $_year = strftime('%Y', $_time);
                $_month = strftime('%m', $_time);
                $_day = strftime('%d', $_time);
            } else {
                //From date string
                $_year = substr($_date, 0, 4);
                $_month = substr($_date, 5, 2);
                $_day = substr($_date, 8, 2);
            }

            //Check each part of the folder that we need (year, month, day)
            if(!file_exists(CACHE_FOLDER . $_year)) { mkdir(CACHE_FOLDER . $_year); }
            if(!file_exists(CACHE_FOLDER . $_year . '/' . $_month)) { mkdir(CACHE_FOLDER . $_year . '/' . $_month); }
            if(!file_exists(CACHE_FOLDER . $_year . '/' . $_month . '/' . $_day)) { mkdir(CACHE_FOLDER . $_year . '/' . $_month . '/' . $_day); }
            return CACHE_FOLDER . $_year . '/' . $_month . '/' . $_day . '/';
        }
    }
?>
