var height = 6; //number of guesses
var width = 5; //length of the word

var row = 0; // current guess\attempt n0.
var col = 0; //current letter for that attempt

var gameOver = false;

let ANSWER_WORDS = [];
let VALID_GUESSES = [];
let secretWord = ""; 

//deserialise data from json
fetch('wordle_words.json')
  .then(res => res.json())
  //load words from json
  .then(data => {
    ANSWER_WORDS = data.answers;
    VALID_GUESSES = data.validGuesses;
    secretWord = getRandomWord(); 
    console.log("Answer words loaded:", ANSWER_WORDS.length);
    console.log("Valid guesses loaded:", VALID_GUESSES.length);
    console.log("Secret word:", secretWord);
    initialise(); // starts game after words load
  });

//gets random word 
function getRandomWord() {
    return ANSWER_WORDS[Math.floor(Math.random() * ANSWER_WORDS.length)].toUpperCase();
}

//creates tiles and event listeners for game
function initialise(){

    //create board
    for(let r = 0; r < height; r++){
        for(let c = 0; c < width; c++){
            let tile = document.createElement("span");
            tile.id = r.toString() + "-" + c.toString();
            tile.classList.add("tile");
            tile.innerText = "";
            document.getElementById("board").appendChild(tile); 
        }
    }

    document.addEventListener("keyup", (e) => {
        if(gameOver) return;

        if("KeyA" <= e.code && e.code <= "KeyZ"){
            if(col < width){
                let currTile = document.getElementById(row.toString() + '-' + col.toString());
                if(currTile.innerText == ""){
                    currTile.innerText = e.key.toUpperCase();
                    col += 1;
                }
            }
        }

        else if(e.code == "Backspace"){
            if(col > 0){
                col -= 1;
                let currTile = document.getElementById(row.toString() + '-' + col.toString());
                currTile.innerText = "";
            }
        }

        else if(e.code == "Enter" && col == width){
            // gets the current guess
            let guess = "";
            for(let c = 0; c < width; c++){
                guess += document.getElementById(row.toString() + '-' + c.toString()).innerText;
            }
            
            // checks the guess is in the word list
            if(!VALID_GUESSES.includes(guess.toLowerCase())){
                alert("Not in word list!");
                return; // don't proceed if invalid word
            }
            
            update();
            row += 1; //start at new row
            col = 0; //start at 0 for new row

            if(!gameOver && row == height){
                gameOver = true;
                document.getElementById("answer").innerText = secretWord;
            }
        }
    });
            // add keyboard event listeners
    document.querySelectorAll('.key').forEach(key => {
        key.addEventListener('click', () => {
            if(gameOver) return;
            
            let letter = key.innerText;
            
            if(letter === 'ENTER'){
                // trigger enter key logic
                if(col == width){
                    let guess = "";
                    for(let c = 0; c < width; c++){
                        guess += document.getElementById(row.toString() + '-' + c.toString()).innerText;
                    }
                    
                    if(!VALID_GUESSES.includes(guess.toLowerCase())){
                        alert("Not in word list!");
                        return;
                    }
                    
                    update();
                    row += 1;
                    col = 0;

                    if(!gameOver && row == height){
                        gameOver = true;
                        document.getElementById("answer").innerText = secretWord;
                    }
                }
            }
            else if(letter === '⌫'){
                // trigger backspace logic
                if(col > 0){
                    col -= 1;
                    let currTile = document.getElementById(row.toString() + '-' + col.toString());
                    currTile.innerText = "";
                }
            }
            else {
                // regular letter
                if(col < width){
                    let currTile = document.getElementById(row.toString() + '-' + col.toString());
                    if(currTile.innerText == ""){
                        currTile.innerText = letter;
                        col += 1;
                    }
                }
            }
        });
    })
}

//checks guess against the word 
function update(){
    let correct = 0;
    let letterCount = {}; // track how many of each letter are in the secret word
    let guessStatus = []; // store the status for each position
    
    // count letters in secret word
    for(let i = 0; i < secretWord.length; i++){
        let letter = secretWord[i];
        letterCount[letter] = (letterCount[letter] || 0) + 1;
    }
    
    // first pass: mark correct letters (right position)
    for(let c = 0; c < width; c++){
        let currTile = document.getElementById(row.toString() + '-' + c.toString()); 
        let letter = currTile.innerText;
        
        if(secretWord[c] == letter){ 
            guessStatus[c] = "correct";
            letterCount[letter]--; // consume one instance of this letter
            correct += 1;
        } else {
            guessStatus[c] = null; // mark for second pass
        }
    }
    
    // second pass: mark present letters (wrong position)
    for(let c = 0; c < width; c++){
        if(guessStatus[c] !== null) continue; // skip already marked as correct
        
        let currTile = document.getElementById(row.toString() + '-' + c.toString()); 
        let letter = currTile.innerText;
        
        // only mark as present if there are still available instances of this letter
        if(secretWord.includes(letter) && letterCount[letter] > 0){
            guessStatus[c] = "present";
            letterCount[letter]--; // consume one instance
        } else {
            guessStatus[c] = "absent";
        }
    }
    
    // apply the styling to tiles and keyboard
    for(let c = 0; c < width; c++){
        let currTile = document.getElementById(row.toString() + '-' + c.toString());
        let letter = currTile.innerText;
        currTile.classList.add(guessStatus[c]);
        updateKeyboard(letter, guessStatus[c]);
    }

    if(correct == width){
        gameOver = true;
        document.getElementById("answer").innerText = "The answer was "+secretWord;
    }
}

// function to update keyboard colors
function updateKeyboard(letter, status){
    document.querySelectorAll('.key').forEach(key => {
        if(key.innerText === letter){
            if(key.classList.contains("correct")) return;
            if(status === "present" && key.classList.contains("absent")) return;
            
            key.classList.remove("correct", "present", "absent");
            key.classList.add(status);
        }
    });
}