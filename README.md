# 🟩 WORDLE

> A browser-based word guessing game built with vanilla HTML, CSS, and JavaScript.

---

## 📖 Overview

This is a fully client-side implementation of the popular word-guessing game Wordle. Players have six attempts to guess a secret five-letter word, receiving colour-coded feedback after each guess.

The project was initially inspired by a YouTube tutorial and has since been significantly expanded with additional features including Hard Mode, a countdown timer, dark mode, challenge links, and full keyboard support.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎮 Core Gameplay | 6 attempts to guess a 5-letter word with green/yellow/grey tile feedback |
| ⌨️ Dual Input | Full physical keyboard support plus an on-screen clickable keyboard |
| 🔴 Hard Mode | Revealed hints must be used in all subsequent guesses |
| ⏱️ Timer Mode | 2-minute countdown with a visual urgency warning at 30 seconds |
| 🌙 Dark Mode | Toggleable dark theme with preference saved to localStorage |
| 🎯 Challenge Mode | Generate a shareable link with a custom hidden word for friends |
| 📊 Win / Loss Tracker | Persistent stats saved across sessions via localStorage |
| 💬 How-to-Play Modal | Splash screen shown once on first visit, dismissible thereafter |
| ✨ Animations | Flip reveal, shake (invalid word), pop (typing), and bounce (win) |

---

## 🚀 Getting Started

### Prerequisites

No build tools or package managers required. The game runs entirely in the browser.

### File Structure

```
wordle-game/
├── index.html
├── wordle.css
├── wordle.js
└── wordle_words.json
```

### Running the Game

> ⚠️ Because the game fetches `wordle_words.json` via the Fetch API, opening `index.html` directly from your filesystem (`file://`) may be blocked by browser security policies.

Serve the files using a simple local server:

```bash
# Python 3
python -m http.server 8000
```

Then open **http://localhost:8000** in your browser.

---

## 🎯 How to Play

Type or click a five-letter word and press **ENTER**. Each tile flips to reveal:

- 🟩 **Green** — correct letter, correct position
- 🟨 **Yellow** — correct letter, wrong position
- ⬛ **Grey** — letter not in the word

Use the feedback to solve the word within **6 attempts**.

### Hard Mode
- Green letters must stay in the same position in every subsequent guess
- Yellow letters must appear somewhere in every subsequent guess
- Can only be toggled before the first guess

### Timer Mode
- Countdown starts the moment the first letter is typed
- Timer turns red and shakes at 30 seconds remaining
- Running out of time counts as a loss

### Challenge Mode
- Click **🎯 Challenge Friend** and enter a custom 5-letter word
- The word is Base64-encoded and embedded in a shareable URL
- Your friend opens the link and plays with your chosen word

---

## 📁 File Structure

| File | Purpose |
|---|---|
| `index.html` | Main HTML shell — board, keyboard, modals, stats bar, and control buttons |
| `wordle.css` | All styling including tile colours, animations, dark mode, and responsive layout |
| `wordle.js` | Complete game logic — guessing, validation, hard mode, timer, challenge links, and localStorage |
| `wordle_words.json` | Word lists: answers (curated) and validGuesses (extended dictionary for accepted inputs) |

---

## ⚠️ Known Limitations

- The `fetch()` call for `wordle_words.json` is blocked on `file://` origins — use a local server
- Clearing browser data resets win/loss stats and preferences stored in `localStorage`
- `index.html` contains a duplicate `id="controls"` — the first Hard Mode button is non-functional; only the second controls block is active

---

## 🙏 Acknowledgements

### Tutorial
The core game structure was inspired by a YouTube tutorial on building Wordle in vanilla JavaScript, which provided the foundation for board rendering, tile colouring logic, and keyboard event handling.

### AI Assistance
AI tools (Claude by Anthropic) were used during development for **error spotting and debugging** — identifying logic bugs, catching edge cases in hard mode validation, and reviewing code for potential issues. All game design, feature decisions, and implementation were written by the developer.

*Disclosed in the spirit of transparency and academic honesty.*

### Word Lists
Answer list and valid guess dictionary are derived from publicly available Wordle word lists.

---

## 📄 Licence

This project is for educational and personal use. Credit is appreciated but not required.

---

*Built with ❤️ using HTML · CSS · JavaScript*
