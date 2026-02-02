var height = 6; //number of guesses
var width = 5; //length of the word

var row = 0; // current guess\attempt n0.
var col = 0; //current letter for that attempt

var gameOver = false;
var hardMode = false; // hard mode toggle
var timerEnabled = false; // timer mode toggle
var timeLimit = 120; 
var timeRemaining = timeLimit;
var timerInterval = null;

// Track revealed letters for hard mode
var revealedCorrect = {}; // {position: letter}
var revealedPresent = new Set(); // letters that are present but wrong position

let ANSWER_WORDS = [];
let VALID_GUESSES = [];
let secretWord = ""; 
let isChallengeMode = false; // friend challenge mode

// Load stats from local storage
let wins = parseInt(localStorage.getItem('wordle-wins')) || 0;
let losses = parseInt(localStorage.getItem('wordle-losses')) || 0;

//deserialise data from json
fetch('wordle_words.json')
  .then(res => res.json())
  //load words from json
  .then(data => {
    ANSWER_WORDS = data.answers;
    VALID_GUESSES = data.validGuesses;
    
    // Check if there's a challenge word in URL
    const urlParams = new URLSearchParams(window.location.search);
    const challengeParam = urlParams.get('challenge');

    if(challengeParam) {
        try {
            // Decode the word from the URL so it's not spoiled
            secretWord = atob(challengeParam).toUpperCase();
            isChallengeMode = true;
            document.getElementById("challenge-info").innerText = "🎯 Challenge Mode - Beat your friend!";
        } catch(e) {
            secretWord = getRandomWord();
        }
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
        display.style.display = "block"; // forces timer to show immediately
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
            
            // Warning logic for urgency
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
                updateStats(false); // Update loss counter
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
    document.activeElement.blur(); // Fixes the Enter key refocus bug
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

    // Encode the word to Base64 so it's not visible in the URL
    const encodedWord = btoa(customWord.toLowerCase());
    const baseUrl = window.location.href.split('?')[0];
    const challengeUrl = `${baseUrl}?challenge=${encodedWord}`;
    
    navigator.clipboard.writeText(challengeUrl).then(() => {
        alert("Challenge link copied! The word is now hidden in the link. 🎯");
    });
}

//creates tiles and event listeners for game
function initialise(){
    // Update Win/Loss UI
    document.getElementById("wins-count").innerText = wins;
    document.getElementById("losses-count").innerText = losses;

    // Show splash page only once
    if (!localStorage.getItem('hasSeenRules')) {
        document.getElementById("help-modal").style.display = "flex";
    }

    // Load dark mode preference
    if(localStorage.getItem('darkMode') === 'true') {
        document.body.classList.add('dark-mode');
        document.getElementById("dark-mode-btn").innerText = "☀️ Light Mode";
    }

    //create board
    const board = document.getElementById("board");
    board.innerHTML = ""; // Clear for resets
    for(let r = 0; r < height; r++){
        for(let c = 0; c < width; c++){
            let tile = document.createElement("span");
            tile.id = r.toString() + "-" + c.toString();
            tile.classList.add("tile");
            tile.innerText = "";
            board.appendChild(tile); 
        }
    }

    // Keyboard and typing listeners
    setupEventListeners();
}

function setupEventListeners() {
    document.addEventListener("keyup", (e) => {
        if(gameOver) return;

        if("KeyA" <= e.code && e.code <= "KeyZ"){
            if(col < width){
                let currTile = document.getElementById(row.toString() + '-' + col.toString());
                if(row === 0 && col === 0) startTimer();
                
                currTile.innerText = e.key.toUpperCase();
                currTile.classList.add('pop');
                setTimeout(() => currTile.classList.remove('pop'), 100);
                col += 1;
            }
        }
        else if(e.code == "Backspace" && col > 0){
            col -= 1;
            document.getElementById(row.toString() + '-' + col.toString()).innerText = "";
        }
        else if(e.code == "Enter" && col == width){
            submitGuess();
        }
    });

    document.querySelectorAll('.key').forEach(key => {
        key.addEventListener('click', () => {
            if(gameOver) return;
            let letter = key.innerText;
            if(letter === 'ENTER' && col == width) submitGuess();
            else if(letter === '⌫' && col > 0){
                col -= 1;
                document.getElementById(row.toString() + '-' + col.toString()).innerText = "";
            }
            else if(letter.length === 1 && col < width) {
                if(row === 0 && col === 0) startTimer();
                let currTile = document.getElementById(row.toString() + '-' + col.toString());
                currTile.innerText = letter;
                currTile.classList.add('pop');
                setTimeout(() => currTile.classList.remove('pop'), 100);
                col += 1;
            }
        });
    });
}

function closeHelp() {
    localStorage.setItem('hasSeenRules', 'true');
    document.getElementById("help-modal").style.display = "none";
}

function updateStats(isWin) {
    if (isWin) wins++; else losses++;
    localStorage.setItem('wordle-wins', wins);
    localStorage.setItem('wordle-losses', losses);
    document.getElementById("wins-count").innerText = wins;
    document.getElementById("losses-count").innerText = losses;
}

// submit guess function 
function submitGuess() {
    let guess = "";
    for(let c = 0; c < width; c++){
        guess += document.getElementById(row.toString() + '-' + c.toString()).innerText;
    }
    
    if(!VALID_GUESSES.includes(guess.toLowerCase())){
        for(let c = 0; c < width; c++){
            document.getElementById(row.toString() + '-' + c.toString()).classList.add('shake');
        }
        setTimeout(() => {
            for(let c = 0; c < width; c++){
                document.getElementById(row.toString() + '-' + c.toString()).classList.remove('shake');
            }
        }, 500);
        return;
    }
    
    if(hardMode && row > 0) {
        const validation = validateHardMode(guess);
        if(!validation.valid) {
            alert("Hard Mode: " + validation.message);
            return;
        }
    }
    
    update();
    row += 1;
    col = 0;

    if(!gameOver && row == height){
        gameOver = true;
        if(timerInterval) clearInterval(timerInterval);
        updateStats(false); // Update losses
        document.getElementById("answer").innerText = "Game Over! The answer was " + secretWord;
    }
}

//checks guess against the word 
function update(){
    let correct = 0;
    let letterCount = {}; 
    let guessStatus = []; 
    
    for(let i = 0; i < secretWord.length; i++){
        let letter = secretWord[i];
        letterCount[letter] = (letterCount[letter] || 0) + 1;
    }
    
    for(let c = 0; c < width; c++){
        let currTile = document.getElementById(row.toString() + '-' + c.toString()); 
        let letter = currTile.innerText;
        if(secretWord[c] == letter){ 
            guessStatus[c] = "correct";
            letterCount[letter]--;
            correct += 1;
            if(hardMode) revealedCorrect[c] = letter;
        } else guessStatus[c] = null;
    }
    
    for(let c = 0; c < width; c++){
        if(guessStatus[c] !== null) continue;
        let currTile = document.getElementById(row.toString() + '-' + c.toString()); 
        let letter = currTile.innerText;
        if(secretWord.includes(letter) && letterCount[letter] > 0){
            guessStatus[c] = "present";
            letterCount[letter]--;
            if(hardMode) revealedPresent.add(letter);
        } else guessStatus[c] = "absent";
    }
    
    for(let c = 0; c < width; c++){
        let currTile = document.getElementById(row.toString() + '-' + c.toString());
        let letter = currTile.innerText;
        setTimeout(() => {
            currTile.classList.add('flip');
            setTimeout(() => {
                currTile.classList.add(guessStatus[c]);
                currTile.classList.remove('flip');
                updateKeyboard(letter, guessStatus[c]);
            }, 300);
        }, c * 150);
    }

    if(correct == width){
        gameOver = true;
        if(timerInterval) clearInterval(timerInterval);
        updateStats(true); // Update wins
        
        setTimeout(() => {
            for(let c = 0; c < width; c++){
                setTimeout(() => {
                    document.getElementById(row.toString() + '-' + c.toString()).classList.add('bounce');
                }, c * 100);
            }
            document.getElementById("answer").innerText = `🎉 You won! The answer was ${secretWord}`;
        }, 1000);
    }
}

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

function resetGame() {
    row = 0; col = 0; gameOver = false;
    timeRemaining = timeLimit;
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = null;
    revealedCorrect = {};
    revealedPresent = new Set();
    secretWord = getRandomWord();
    document.getElementById("answer").innerText = "";
    document.getElementById("timer-display").style.color = "";
    initialise();
    document.querySelectorAll('.key').forEach(k => k.classList.remove("correct", "present", "absent"));
}