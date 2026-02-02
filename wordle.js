var height = 6; //number of guesses
var width = 5; //length of the word

var row = 0; // current guess\attempt n0.
var col = 0; //current letter for that attempt

var gameOver = false;
var hardMode = false; // hard mode toggle
var timerEnabled = false; // timer mode toggle
var timeLimit = 90; // 3 minutes in seconds
var timeRemaining = timeLimit;
var timerInterval = null;

// Track revealed letters for hard mode
var revealedCorrect = {}; // {position: letter}
var revealedPresent = new Set(); // letters that are present but wrong position

let ANSWER_WORDS = [];
let VALID_GUESSES = [];
let secretWord = ""; 
let isChallengeMode = false; // friend challenge mode

//deserialise data from json
fetch('wordle_words.json')
  .then(res => res.json())
  //load words from json
  .then(data => {
    ANSWER_WORDS = data.answers;
    VALID_GUESSES = data.validGuesses;
    
    // Check if there's a challenge word in URL
    const urlParams = new URLSearchParams(window.location.search);
    const challengeWord = urlParams.get('word');
    
    if(challengeWord && challengeWord.length === 5) {
      secretWord = challengeWord.toUpperCase();
      isChallengeMode = true;
      document.getElementById("challenge-info").innerText = "🎯 Challenge Mode - Beat your friend!";
    } else {
      secretWord = getRandomWord();
    }
    
    console.log("Answer words loaded:", ANSWER_WORDS.length);
    console.log("Valid guesses loaded:", VALID_GUESSES.length);
    console.log("Secret word:", secretWord);
    initialise(); // starts game after words load
  });

//gets random word 
function getRandomWord() {
    return ANSWER_WORDS[Math.floor(Math.random() * ANSWER_WORDS.length)].toUpperCase();
}

// Toggle hard mode
function toggleHardMode() {
    if(row > 0) {
        alert("Cannot change hard mode during game!");
        return;
    }
    hardMode = !hardMode;
    const btn = document.getElementById("hard-mode-btn");
    btn.style.backgroundColor = hardMode ? "#6AAA64" : "#818384";
    btn.innerText = hardMode ? "Hard Mode: ON" : "Hard Mode: OFF";
}

// Toggle timer mode
function toggleTimer() {
    if(row > 0) {
        alert("Cannot change timer mode during game!");
        return;
    }
    timerEnabled = !timerEnabled;
    const btn = document.getElementById("timer-btn");
    const display = document.getElementById("timer-display");
    
    if(timerEnabled) {
        btn.style.backgroundColor = "#C9B458";
        btn.innerText = "Timer: ON";
        display.style.display = "block";
        timeRemaining = timeLimit;
        updateTimerDisplay();
    } else {
        btn.style.backgroundColor = "#818384";
        btn.innerText = "Timer: OFF";
        display.style.display = "none";
        if(timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
    }
}

// Start countdown timer
function startTimer() {
    if(!timerInterval && timerEnabled) { // Only start if timer mode is ON
        const display = document.getElementById("timer-display");
        display.style.display = "block"; 
  
        timerInterval = setInterval(() => {
            timeRemaining--;
            updateTimerDisplay();
            
            // Warning at 30 seconds
            if(timeRemaining === 30) {
                document.getElementById("timer-display").style.color = "#ff4444";
                document.getElementById("timer-display").classList.add("shake");
                setTimeout(() => {
                    document.getElementById("timer-display").classList.remove("shake");
                }, 500);
            }
            
            // Time's up!
            if(timeRemaining <= 0) {
                clearInterval(timerInterval);
                gameOver = true;
                document.getElementById("answer").innerText = "⏰ Time's Up! The answer was " + secretWord;
                document.getElementById("timer-display").innerText = "⏰ TIME'S UP!";
            }
        }, 1000);
    }
}

// Update timer display
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById("timer-display").innerText = 
        `⏱️ ${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    const btn = document.getElementById("dark-mode-btn");
    btn.innerText = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// Hard mode validation
function validateHardMode(guess) {
    // Check if all revealed correct letters are in correct positions
    for(let pos in revealedCorrect) {
        if(guess[pos] !== revealedCorrect[pos]) {
            return {
                valid: false,
                message: `${revealedCorrect[pos]} must be in position ${parseInt(pos) + 1}`
            };
        }
    }
    
    // Check if all revealed present letters are used
    for(let letter of revealedPresent) {
        if(!guess.includes(letter)) {
            return {
                valid: false,
                message: `Guess must contain ${letter}`
            };
        }
    }
    
    return { valid: true };
}

// creates challenge link
function createChallenge() {
    const customWord = prompt("Enter a 5-letter word for your friend:");
    if(!customWord || customWord.length !== 5) {
        alert("Please enter exactly 5 letters!");
        return;
    }
    
    if(!ANSWER_WORDS.includes(customWord.toLowerCase()) && !VALID_GUESSES.includes(customWord.toLowerCase())) {
        alert("Please enter a valid English word!");
        return;
    }
    
    // Get current URL and construct challenge URL
    let baseUrl;
    if (window.location.protocol === 'file:') {
        // For local files, use the full file path
        baseUrl = window.location.href.split('?')[0];
    } else {
        // For localhost or web servers
        baseUrl = window.location.origin + window.location.pathname;
    }
    const challengeUrl = `${baseUrl}?word=${customWord.toLowerCase()}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(challengeUrl).then(() => {
        alert("Challenge link copied to clipboard! Share it with your friend! 🎯\n\n" + challengeUrl);
    }).catch(() => {
        prompt("Copy this link to share:", challengeUrl);
    });
}

//creates tiles and event listeners for game
function initialise(){
    // Load dark mode preference
    if(localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById("dark-mode-btn").innerText = "☀️ Light Mode";
    }

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
                    // Start timer on first keystroke
                    if(row === 0 && col === 0) {
                        startTimer();
                    }
                    
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
            submitGuess();
        }
    });

    // add keyboard event listeners
    document.querySelectorAll('.key').forEach(key => {
        key.addEventListener('click', () => {
            if(gameOver) return;
            
            let letter = key.innerText;
            
            if(letter === 'ENTER'){
                if(col == width){
                    submitGuess();
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
                        // Start timer on first keystroke
                        if(row === 0 && col === 0) {
                            startTimer();
                        }
                        
                        currTile.innerText = letter;
                        // POP EFFECT when typing
                        currTile.classList.add('pop');
                        setTimeout(() => currTile.classList.remove('pop'), 100);
                        col += 1;
                    }
                }
            }
        });
    });
}

// submit guess function 
function submitGuess() {
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
        }, 500);
        
        return; // don't proceed if invalid word
    }
    
    // Hard mode validation
    if(hardMode && row > 0) {
        const validation = validateHardMode(guess);
        if(!validation.valid) {
            // SHAKE EFFECT
            for(let c = 0; c < width; c++){
                let tile = document.getElementById(row.toString() + '-' + c.toString());
                tile.classList.add('shake');
            }
            
            setTimeout(() => {
                for(let c = 0; c < width; c++){
                    let tile = document.getElementById(row.toString() + '-' + c.toString());
                    tile.classList.remove('shake');
                }
            }, 500);
            
            alert("Hard Mode: " + validation.message);
            return;
        }
    }
    
    update();
    row += 1; //start at new row
    col = 0; //start at 0 for new row

    if(!gameOver && row == height){
        gameOver = true;
        if(timerInterval) clearInterval(timerInterval);
        document.getElementById("answer").innerText = "Game Over! The answer was " + secretWord;
    }
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
            
            // Track for hard mode
            if(hardMode) {
                revealedCorrect[c] = letter;
            }
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
            
            // Track for hard mode
            if(hardMode) {
                revealedPresent.add(letter);
            }
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

    if(correct == width){
        gameOver = true;
        if(timerInterval) clearInterval(timerInterval);
        
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
            
            let timeMsg = "";
            if(timerEnabled) {
                const timeTaken = timeLimit - timeRemaining;
                const minutes = Math.floor(timeTaken / 60);
                const seconds = timeTaken % 60;
                timeMsg = ` in ${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
            
            document.getElementById("answer").innerText = `🎉 You Won${timeMsg}! The answer was ${secretWord}`;
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