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
                    // POP EFFECT when typing
                    currTile.classList.add('pop');
                    setTimeout(() => currTile.classList.remove('pop'), 100);
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
                // SHAKE EFFECT for invalid word
                for(let c = 0; c < width; c++){
                    let tile = document.getElementById(row.toString() + '-' + c.toString());
                    tile.classList.add('shake');
                }
                
                // Remove shake class after animation completes
                setTimeout(() => {
                    for(let c = 0; c < width; c++){
                        let tile = document.getElementById(row.toString() + '-' + c.toString());
                        tile.classList.remove('shake');
                    }
                }, 500); // matches animation duration
                
                return; // don't proceed if invalid word
            }
            
            update();
            row += 1; //start at new row
            col = 0; //start at 0 for new row

            if(!gameOver && row == height){
                gameOver = true;
                document.getElementById("answer").innerText = "Game Over! The answer was " + secretWord;
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

                    // checks the guess is in the word list
                    if(!VALID_GUESSES.includes(guess.toLowerCase())){
                        // SHAKE EFFECT for invalid word
                        for(let c = 0; c < width; c++){
                            let tile = document.getElementById(row.toString() + '-' + c.toString());
                            tile.classList.add('shake');
                        }
                        
                        // Remove shake class after animation completes
                        setTimeout(() => {
                            for(let c = 0; c < width; c++){
                                let tile = document.getElementById(row.toString() + '-' + c.toString());
                                tile.classList.remove('shake');
                            }
                        }, 500);
                        return;
                    }
                    
                    update();
                    row += 1;
                    col = 0;

                    if(!gameOver && row == height){
                        gameOver = true;
                        document.getElementById("answer").innerText = "Game Over! The answer was " + secretWord;
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
                        // POP EFFECT when typing
                        currTile.classList.add('pop');
                        setTimeout(() => currTile.classList.remove('pop'), 100);
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
    
    for(let c = 0; c < width; c++){
        let currTile = document.getElementById(row.toString() + '-' + c.toString());
        let letter = currTile.innerText;
        
        // Stagger the flip animation for each tile
        setTimeout(() => {
            currTile.classList.add('flip');
            
            // Add color class halfway through the flip
            setTimeout(() => {
                currTile.classList.add(guessStatus[c]);
                currTile.classList.remove('flip');
            }, 300); // halfway through the 0.6s flip animation
            
        }, c * 150); // delay each tile by 150ms
        
        updateKeyboard(letter, guessStatus[c]);
    }

    // if won, add bounce animation
    if(correct == width){
        gameOver = true;
        
        // Wait for flip animations to finish, then bounce
        setTimeout(() => {
            for(let c = 0; c < width; c++){
                let tile = document.getElementById(row.toString() + '-' + c.toString());
                
                // Stagger the bounce animation
                setTimeout(() => {
                    tile.classList.add('bounce');
                    setTimeout(() => tile.classList.remove('bounce'), 600);
                }, c * 100);
            }
            document.getElementById("answer").innerText = "🎉 You Won! The answer was " + secretWord;
        }, 1000); // wait for flips to complete
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