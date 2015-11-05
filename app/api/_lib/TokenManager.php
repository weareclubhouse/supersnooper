<?php
    /*
    *   @site           SuperSnooper
    *   @function       Token Manager (deals with instagram access tokens)
    *   @author         Greg Findon
    *   @copyright      Copyright 2015, WeAreClubhouse.com / last17.com
    *   @version        0.01
    *
    *********************************************************************************************/

    /*--------------------------------------------------
    - CLASS DEFINITION
    --------------------------------------------------*/
    class TokenManager {
        /*--------------------------------------------------
        - VARS
        --------------------------------------------------*/
        private $folder; //base folder for scanning
        private $tokenList;
        private $token;
        private $tokenID;


        /*--------------------------------------------------
        - CONSTRUCTOR
        --------------------------------------------------*/
        public function __construct($_folder) {
            //Save the variables
            $this -> folder = $_folder;

            //Read in the available list of tokens
            $_fileList = scandir($this -> folder);
            $this -> tokenList = array();

            for($i=0;$i<count($_fileList);$i++) {
                if(strpos($_fileList[$i], 'ACCESSTOKEN_') === 0) {
                    array_push($this -> tokenList, $this -> folder . $_fileList[$i]);
                }
            }

        }


        /*--------------------------------------------------
        - GET A TOKEN
        --------------------------------------------------*/
        private function getToken() {
            if(count($this -> tokenList) > 0) {
                //Pick a random token (we store the ID, so we can remove this token later if there is a problem with it)
                $this -> tokenID = rand(0, count($this -> tokenList) - 1);

                //Decode the token
                $this -> token = json_decode(file_get_contents($this -> tokenList[$this -> tokenID]), true);
            }
        }


        /*--------------------------------------------------
        - GET THE ACCESS TOKEN PART OF OUR CURRENT TOKEN
        --------------------------------------------------*/
        public function getAccessToken() {
            //Get a token, if there isn't one
            if(!isset($this -> token)) { $this -> getToken(); }

            //Get teh correct part of the token
            if(isset($this -> token) && isset($this -> token['access_token'])) {
                return $this -> token['access_token'];
            } else {
                //Nothing
                return 'no-token-available';
            }
        }
    }
?>
