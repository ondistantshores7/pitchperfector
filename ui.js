function _class_call_check(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}
function _defineProperties(target, props) {
    for(var i = 0; i < props.length; i++){
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ("value" in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
    }
}
function _create_class(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
}
import { GAME_STATE, MAX_LEVELS } from './constants.js';
import { formatSolfegeDisplay } from './scoreUtils.js';
import { loadHighScores } from './highScores.js';
export var UI = /*#__PURE__*/ function() {
    "use strict";
    function UI(container, gameInstance) {
        var _this = this;
        _class_call_check(this, UI);
        this.container = container;
        this.game = gameInstance; // Reference to the main game logic
        this.displayMode = 'solfege'; // 'solfege' or 'pitch'
        this.isCapturingText = false;
        // Create UI container overlay
        this.uiContainer = document.createElement('div');
        this.uiContainer.style.position = 'absolute';
        this.uiContainer.style.top = '0';
        this.uiContainer.style.left = '0';
        this.uiContainer.style.width = '100%';
        this.uiContainer.style.height = '100%';
        this.uiContainer.style.display = 'flex';
        this.uiContainer.style.flexDirection = 'column';
        this.uiContainer.style.alignItems = 'center';
        this.uiContainer.style.justifyContent = 'center'; // Center content vertically again
        this.uiContainer.style.gap = '30px'; // Add gap between centered items
        this.uiContainer.style.paddingTop = '2%'; // Set padding-top very low to push elements high
        this.uiContainer.style.pointerEvents = 'none'; // Allow clicks to pass through to canvas initially
        this.uiContainer.style.zIndex = '3'; // Ensure UI is above renderer canvas (z-index 2) and confetti (z-index 1)
        this.uiContainer.style.color = '#FFF';
        this.uiContainer.style.fontFamily = '"Press Start 2P", cursive, sans-serif'; // Retro font (requires import or web safe fallback) - using sans-serif as fallback
        this.uiContainer.style.textShadow = '2px 2px #FF00FF'; // Magenta shadow for retro feel
        container.appendChild(this.uiContainer);
        // Inject font and animation CSS
        var styleSheet = document.createElement('style');
        styleSheet.textContent = "\n    @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');\n    /* Shake animation */\n    @keyframes shake {\n      10%, 90% { transform: translate3d(-1px, 0, 0); }\n      20%, 80% { transform: translate3d(2px, 0, 0); }\n      30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }\n      40%, 60% { transform: translate3d(4px, 0, 0); }\n    }\n    .shake {\n      animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;\n      transform: translate3d(0, 0, 0);\n    }\n    /* Space pulse animation */\n    @keyframes space-pulse {\n      0% { transform: scale(1); box-shadow: 3px 3px #00FFFF, 0 0 0px #FFF; }\n      50% { transform: scale(1.1); box-shadow: 3px 3px #00FFFF, 0 0 20px #FFF; }\n      100% { transform: scale(1); box-shadow: 3px 3px #00FFFF, 0 0 0px #FFF; }\n    }\n    .space-pulse {\n        animation: space-pulse 0.4s ease-out;\n    }\n    .pp-overlay {\n        position: absolute;\n        inset: 0;\n        display: none;\n        align-items: center;\n        justify-content: center;\n        background: rgba(5, 0, 16, 0.82);\n        z-index: 8;\n        pointer-events: auto;\n        padding: 20px;\n        box-sizing: border-box;\n    }\n    .pp-overlay.visible { display: flex; }\n    .pp-card {\n        width: min(520px, 92vw);\n        background: rgba(8, 0, 24, 0.95);\n        border: 3px solid #FF00FF;\n        box-shadow: 6px 6px #00FFFF;\n        padding: 24px 20px;\n        text-align: center;\n        color: #FFF;\n        font-family: \"Press Start 2P\", cursive, sans-serif;\n    }\n    .pp-help {\n        max-width: 720px;\n        font-size: 10px;\n        line-height: 1.7;\n        text-align: center;\n        color: #00FFFF;\n        text-shadow: 1px 1px #FF00FF;\n    }\n    .pp-scores {\n        min-width: 280px;\n        font-size: 10px;\n        line-height: 1.8;\n        color: #FFF;\n    }\n    .pp-initials {\n        width: 96px;\n        text-align: center;\n        font-size: 22px;\n        letter-spacing: 6px;\n        text-transform: uppercase;\n        background: #111;\n        color: #00FFFF;\n        border: 2px solid #00FFFF;\n        font-family: \"Press Start 2P\", cursive, sans-serif;\n        padding: 8px 6px;\n    }\n";
        document.head.appendChild(styleSheet);
        // --- UI Elements ---
        // Remove explicit marginTop for title, rely on flex gap
        this.titleElement = this.createText('Pitch Perfector', '40px', 'center');
        this.levelSelect = this.createDropdown(1, MAX_LEVELS, function(level) {
            return _this.game.selectLevel(level);
        });
        this.levelSelect.style.pointerEvents = 'auto'; // Enable interaction
        // Remove explicit marginTop, rely on flex gap
        // Change text and add animation trigger to the click handler
        this.startButton = this.createButton("Let's Go!", function() {
            // Play sound immediately
            _this.game.audioManager.playCorrectSound(); // Use correct sound as a "start/level up" sound
            // Add pulse class
            _this.startButton.classList.add('space-pulse');
            // Disable button briefly during animation
            _this.startButton.disabled = true;
            // Wait for animation to roughly finish before starting game
            setTimeout(function() {
                _this.game.startGame();
            // No need to re-enable or remove class here,
            // as showGameScreen() will hide it anyway.
            // If we returned to start screen, we'd reset it there.
            }, 400); // Match animation duration
        });
        // Remove explicit marginTop, rely on flex gap
        this.gameHeader = this.createDiv({
            position: 'absolute',
            top: '20px',
            width: '90%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        });
        this.gameHeader.style.pointerEvents = 'auto'; // Enable interaction for children
        this.gameHeader.style.visibility = 'hidden'; // Hide initially
        this.gameLevelSelect = this.createDropdown(1, MAX_LEVELS, function(level) {
            return _this.game.selectLevel(level);
        });
        this.gameLevelSelect.style.width = '180px'; // Set explicit width for consistency
        // --- Display Mode Toggle Button ---
        // --- Create a container for Level Select + Display Mode Toggle ---
        this.levelControlContainer = this.createDiv({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '8px' // Space between dropdown and button
        });
        // --- Display Mode Toggle Switch ---
        this.displayModeToggle = this.createDisplayModeToggle(); // New method to create the switch
        this.scoreDisplay = this.createText('Score: 0', '18px', 'right', {
            flexShrink: 0
        }); // Prevent score from shrinking
        this.gameTitleHeader = this.createText('Pitch Perfector', '20px', 'center', {
            flexGrow: 1,
            margin: '0 15px' // Add some margin around the title
        });
        // Append Dropdown and Toggle Switch to their container
        this.levelControlContainer.appendChild(this.gameLevelSelect);
        this.levelControlContainer.appendChild(this.displayModeToggle); // Add the toggle switch
        this.hudRight = this.createDiv({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '8px',
            flexShrink: 0
        });
        this.statsDisplay = this.createText('1/10', '12px', 'right');
        this.muteButton = this.createButton('Mute', function() {
            return _this.game.toggleMute();
        }, '10px');
        this.muteButton.style.padding = '6px 10px';
        this.hudRight.appendChild(this.scoreDisplay);
        this.hudRight.appendChild(this.statsDisplay);
        this.hudRight.appendChild(this.muteButton);
        // Append the container, title, and score to the main header
        this.gameHeader.appendChild(this.levelControlContainer);
        this.gameHeader.appendChild(this.gameTitleHeader);
        this.gameHeader.appendChild(this.hudRight);
        // Add keyboard number shortcut event listener
        this.keyboardShortcutHandler = this.handleKeyboardShortcut.bind(this);
        window.addEventListener('keydown', this.keyboardShortcutHandler);
        this.playPatternButton = this.createButton('Play Pattern', function() {
            return _this.game.playCurrentPattern();
        });
        this.playPatternButton.style.visibility = 'hidden';
        // Use absolute positioning to place it higher
        this.playPatternButton.style.position = 'absolute';
        this.playPatternButton.style.top = '30%'; // Moved higher
        this.playPatternButton.style.left = '50%';
        this.playPatternButton.style.transform = 'translate(-50%, -50%)'; // Center horizontally and vertically around the top percentage
        this.playPatternButton.style.marginTop = '0'; // Remove previous margin
        this.answerContainer = this.createDiv({
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            gap: '10px',
            flexWrap: 'nowrap',
            position: 'absolute',
            top: 'calc(30% + 60px)',
            width: '90%',
            left: '50%',
            transform: 'translateX(-50%)'
        });
        this.answerContainer.style.visibility = 'hidden';
        this.answerContainer.style.pointerEvents = 'auto';
        this.feedbackElement = this.createText('', '20px', 'center', {
            position: 'absolute',
            bottom: '25%',
            width: '80%',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: '10px',
            borderRadius: '5px',
            visibility: 'hidden',
            transition: 'visibility 0s 1.5s, opacity 1.5s linear',
            opacity: '1'
        });
        // Add elements to containers
        this.uiContainer.appendChild(this.titleElement);
        this.uiContainer.appendChild(this.levelSelect);
        this.uiContainer.appendChild(this.startButton);
        this.uiContainer.appendChild(this.gameHeader); // Added to main container, positioned absolutely
        this.uiContainer.appendChild(this.playPatternButton);
        this.uiContainer.appendChild(this.answerContainer);
        this.uiContainer.appendChild(this.feedbackElement);
        // Add the "Next Pattern" button definition here, initially hidden
        this.nextPatternButton = this.createButton("Next Pattern", function() {
            return _this.game.proceedToNextQuestion();
        });
        this.nextPatternButton.style.position = 'absolute';
        // Adjust positioning relative to the raised Play Pattern button's center (30%)
        this.nextPatternButton.style.top = 'calc(30% - 65px)'; // Shifted up more, relative to new position
        this.nextPatternButton.style.left = '50%';
        this.nextPatternButton.style.transform = 'translate(-50%, -50%)'; // Center around the top percentage
        this.nextPatternButton.style.visibility = 'hidden'; // Start hidden
        this.uiContainer.appendChild(this.nextPatternButton);
        // Create and add Piano toggle switch
        this.pianoHighlighting = true; // Track piano highlighting state
        this.pianoToggle = this.createToggleSwitch('Piano On', 'Piano Off', this.pianoHighlighting, function(highlightsOn) {
            _this.pianoHighlighting = highlightsOn;
            // Piano always stays visible, only highlighting changes
            _this.game.piano.setHighlighting(highlightsOn);
        });
        // Position the piano toggle above the piano
        this.pianoToggle.style.position = 'absolute';
        this.pianoToggle.style.bottom = '15%';
        this.pianoToggle.style.left = '50%';
        this.pianoToggle.style.transform = 'translateX(-50%)';
        this.pianoToggle.style.visibility = 'hidden'; // Start hidden
        this.uiContainer.appendChild(this.pianoToggle);
        this.helpPanel = this.createText('Hear 3 notes. Pick the matching solfege.\n1-4 or click answers. WASD / arrows + Space to fly.\nEnter start/next  ·  P replay  ·  M mute  ·  Esc pause', '12px', 'center');
        this.helpPanel.className = 'pp-help';
        this.helpPanel.style.whiteSpace = 'pre-line';
        this.helpPanel.style.maxWidth = '820px';
        this.helpPanel.style.lineHeight = '1.9';
        this.helpPanel.style.color = '#00FFFF';
        this.highScorePanel = this.createDiv({
            className: 'pp-scores'
        });
        this.buildOverlays();
        this.uiContainer.appendChild(this.helpPanel);
        this.uiContainer.appendChild(this.highScorePanel);
        this.updateMuteButton(this.game.audioManager.muted);
        this.renderHighScorePanel();
    }
    _create_class(UI, [
        {
            key: "createText",
            value: function createText(text) {
                var size = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : '16px', align = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : 'left', styles = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
                var elem = document.createElement('div');
                elem.textContent = text;
                elem.style.fontSize = size;
                elem.style.textAlign = align;
                elem.style.color = '#FFFFFF'; // White text
                elem.style.textShadow = '2px 2px #FF00FF'; // Magenta shadow
                elem.style.fontFamily = '"Press Start 2P", cursive, sans-serif';
                Object.assign(elem.style, styles);
                return elem;
            }
        },
        {
            key: "createDiv",
            value: function createDiv() {
                var styles = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
                var elem = document.createElement('div');
                Object.assign(elem.style, styles);
                // Add a class for easier selection if needed later (e.g., for highlighting the whole container)
                if (styles.flexDirection === 'column') {
                    elem.classList.add('option-container');
                }
                // Add custom className if provided
                if (styles.className) {
                    elem.classList.add(styles.className);
                    delete styles.className; // Remove from styles object
                }
                return elem;
            }
        },
        {
            key: "createButton",
            value: function createButton(text, onClick) {
                var size = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : '18px';
                var button = document.createElement('button');
                button.textContent = text;
                button.style.fontSize = size;
                button.style.padding = '10px 20px';
                button.style.backgroundColor = '#FFF';
                button.style.color = '#FF00FF'; // Magenta text
                button.style.border = '3px solid #FF00FF'; // Magenta border
                button.style.borderRadius = '5px';
                button.style.cursor = 'pointer';
                button.style.fontFamily = '"Press Start 2P", cursive, sans-serif';
                button.style.pointerEvents = 'auto'; // Ensure button is clickable
                button.style.boxShadow = '3px 3px #00FFFF'; // Cyan shadow for depth
                // Default hover effect (can be overridden later for specific buttons like the toggle)
                button.addEventListener('mouseenter', function() {
                    button.style.backgroundColor = '#eee';
                    button.style.boxShadow = '3px 3px #FF00FF'; // Swap shadow color on hover
                });
                button.addEventListener('mouseleave', function() {
                    button.style.backgroundColor = '#FFF';
                    button.style.boxShadow = '3px 3px #00FFFF';
                });
                button.addEventListener('click', onClick);
                return button;
            }
        },
        {
            key: "createDropdown",
            value: function createDropdown(min, max, onChange) {
                var select = document.createElement('select');
                select.style.fontSize = '16px';
                select.style.padding = '10px';
                select.style.backgroundColor = '#333';
                select.style.color = '#00FFFF'; // Cyan text
                select.style.border = '2px solid #00FFFF';
                select.style.borderRadius = '5px';
                select.style.fontFamily = '"Press Start 2P", cursive, sans-serif';
                select.style.pointerEvents = 'auto'; // Make dropdown interactive
                for(var i = min; i <= max; i++){
                    var option = document.createElement('option');
                    option.value = i;
                    option.textContent = "Level ".concat(i);
                    select.appendChild(option);
                }
                select.addEventListener('change', function(e) {
                    return onChange(e.target.value);
                });
                return select;
            }
        },
        {
            key: "showStartScreen",
            value: function showStartScreen() {
                this.titleElement.style.visibility = 'visible';
                this.levelSelect.style.visibility = 'visible';
                this.startButton.style.visibility = 'visible';
                this.helpPanel.style.visibility = 'visible';
                this.highScorePanel.style.visibility = 'visible';
                this.gameHeader.style.visibility = 'hidden';
                this.playPatternButton.style.visibility = 'hidden';
                this.answerContainer.style.visibility = 'hidden';
                this.feedbackElement.style.visibility = 'hidden';
                this.pianoToggle.style.visibility = 'hidden'; // Hide piano toggle on start screen
                this.hideNextPatternButton();
                // Reset start button state if returning to start screen
                this.startButton.disabled = false;
                this.startButton.classList.remove('space-pulse');
                this.renderHighScorePanel();
            }
        },
        {
            key: "showGameScreen",
            value: function showGameScreen(level, score) {
                this.titleElement.style.visibility = 'hidden';
                this.levelSelect.style.visibility = 'hidden';
                this.startButton.style.visibility = 'hidden';
                this.helpPanel.style.visibility = 'hidden';
                this.highScorePanel.style.visibility = 'hidden';
                this.gameHeader.style.visibility = 'visible';
                this.playPatternButton.style.visibility = 'visible';
                this.answerContainer.style.visibility = 'visible';
                this.updateLevel(level);
                this.updateScore(score);
                this.updateMuteButton(this.game.audioManager.muted);
                this.game.piano.show(); // Show piano
                this.pianoToggle.style.visibility = 'visible'; // Show piano toggle
            }
        },
        {
            key: "updateLevel",
            value: function updateLevel(level) {
                // Update both dropdowns to stay in sync
                this.levelSelect.value = level;
                this.gameLevelSelect.value = level;
            }
        },
        {
            key: "updateScore",
            value: function updateScore(score) {
                this.scoreDisplay.textContent = "Score: ".concat(score);
            }
        },
        {
            key: "displayQuestion",
            value: function displayQuestion(options) {
                var _this = this;
                // Clear previous answer buttons
                while(this.answerContainer.firstChild){
                    this.answerContainer.removeChild(this.answerContainer.firstChild);
                }
                // Create new buttons
                options.forEach(function(optionText, index) {
                    // --- Replace "So" with "Sol" ---
                    var correctedOptionText = formatSolfegeDisplay(optionText);
                    var displayText = correctedOptionText; // Start with corrected Solfege
                    // If display mode is 'pitch', try to convert Solfege to Pitch Names
                    if (_this.displayMode === 'pitch') {
                        var _this_game_currentQuestion;
                        var tonicNote = (_this_game_currentQuestion = _this.game.currentQuestion) === null || _this_game_currentQuestion === void 0 ? void 0 : _this_game_currentQuestion.patternNames[0];
                        if (tonicNote) {
                            // IMPORTANT: Use original optionText for conversion logic, not the display-corrected one
                            var notesArray = _this.game.levelManager.solfegeStringToNotes(optionText, tonicNote);
                            if (notesArray) {
                                // Determine if this is a major or minor key based on the first note
                                var tonicNoteName = tonicNote.replace(/\d+$/, ''); // Remove octave number
                                var sharpToFlatMap = {
                                    'F#': 'Gb',
                                    'C#': 'Db',
                                    'G#': 'Ab',
                                    'D#': 'Eb',
                                    'A#': 'Bb'
                                };
                                var flatKeyTonics = [
                                    'F',
                                    'Bb',
                                    'Eb',
                                    'Ab',
                                    'Db',
                                    'Gb'
                                ];
                                var _sharpToFlatMap_tonicNoteName;
                                // 1. Determine the canonical tonic name for key signature check
                                var canonicalTonicName = (_sharpToFlatMap_tonicNoteName = sharpToFlatMap[tonicNoteName]) !== null && _sharpToFlatMap_tonicNoteName !== void 0 ? _sharpToFlatMap_tonicNoteName : tonicNoteName; // Convert G# to Ab etc. for the check
                                // 2. Determine if the key signature uses flats
                                var useFlats = flatKeyTonics.includes(canonicalTonicName);
                                // 3. Convert notes in the option array based on useFlats
                                displayText = notesArray.map(function(note) {
                                    var noteName = note.replace(/\d+$/, '');
                                    // Convert sharps to flats ONLY if the key uses flats
                                    if (useFlats && sharpToFlatMap[noteName]) {
                                        return sharpToFlatMap[noteName];
                                    }
                                    // No conversion needed or key uses sharps, return original name
                                    return noteName;
                                }).join(', ');
                            } else {
                                console.warn('Failed to convert Solfege option "'.concat(optionText, '" to pitch names.'));
                            // Fallback: displayText remains the corrected Solfege (displayText = correctedOptionText)
                            }
                        } else {
                            console.warn("Cannot convert to pitch names: Tonic note not available.");
                        // Fallback: displayText remains the corrected Solfege
                        }
                    }
                    // Create a container for the button and its label
                    var optionContainer = _this.createDiv({
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '5px' // Space between button and label
                    });
                    // Create the answer button using the determined displayText
                    var button = _this.createButton(displayText, function(event) {
                        // Always play click sound and submit answer, even if already selected
                        _this.game.audioManager.playClickSound();
                        // Only set selected state if it's not already selected
                        if (event.target.dataset.selected !== 'true') {
                            event.target.dataset.selected = 'true';
                        }
                        // Pass the button itself for styling/feedback later
                        // *** IMPORTANT: Always submit the original Solfege string (optionText) ***
                        _this.game.submitAnswer(optionText, event.target);
                    }, '14px');
                    button.dataset.option = optionText;
                    button.style.width = '240px'; // Increased width for better text fit
                    button.style.minHeight = '40px'; // Ensure consistent height
                    // Add number label under button
                    var numberLabel = document.createElement('div');
                    numberLabel.textContent = (index + 1).toString(); // Display 1, 2, 3, 4
                    numberLabel.style.fontSize = '18px';
                    numberLabel.style.color = '#00FFFF'; // Cyan color
                    numberLabel.style.fontFamily = '"Press Start 2P", cursive, sans-serif';
                    numberLabel.style.textShadow = '1px 1px #FF00FF'; // Smaller magenta shadow
                    numberLabel.style.marginTop = '5px';
                    // Add button and number label to container
                    optionContainer.appendChild(button);
                    optionContainer.appendChild(numberLabel);
                    // Add the container to the main answer area
                    _this.answerContainer.appendChild(optionContainer);
                });
                this.feedbackElement.style.visibility = 'hidden'; // Hide feedback when new question loads
                this.feedbackElement.style.opacity = '0';
                this.resetAnswerButtonHighlights(); // Reset button styles for the new question
            }
        },
        {
            key: "showFeedback",
            value: function showFeedback(message, isCorrect) {
                var _this = this;
                this.feedbackElement.textContent = message;
                this.feedbackElement.style.color = isCorrect ? '#00FF00' : '#FF0000'; // Green for correct, Red for incorrect
                this.feedbackElement.style.textShadow = "2px 2px ".concat(isCorrect ? '#008000' : '#800000');
                this.feedbackElement.style.visibility = 'visible';
                this.feedbackElement.style.opacity = '1';
                // CSS transition handles fade out
                setTimeout(function() {
                    _this.feedbackElement.style.opacity = '0';
                    _this.feedbackElement.style.visibility = 'hidden';
                }, 1500); // Match timeout in game.js for loading next question
            }
        },
        {
            key: "onResize",
            value: function onResize() {
                // Adjust layout if necessary based on container size
                // Example: Change font sizes or element positions
                var width = this.container.clientWidth;
                if (width < 600) {
                    this.titleElement.style.fontSize = '28px';
                // Adjust other elements as needed
                } else {
                    this.titleElement.style.fontSize = '40px';
                }
            }
        },
        {
            // --- New Method to Create the Toggle Switch ---
            key: "createDisplayModeToggle",
            value: function createDisplayModeToggle() {
                var _this = this;
                var toggle = this.createToggleSwitch('Solfege', 'Pitch Names', this.displayMode === 'solfege', function(isLeftActive) {
                    if (_this.game.gameState !== GAME_STATE.PLAYING || !_this.game.currentQuestion) return;
                    _this.displayMode = isLeftActive ? 'solfege' : 'pitch';
                    // Re-display the current question options with the new mode
                    _this.displayQuestion(_this.game.currentQuestion.options);
                    // Update the floating answer targets to match the new display mode
                    _this.game.clearAnswerTargets();
                    _this.game.createAnswerTargets(_this.game.currentQuestion.options);
                });
                this.toggleHighlight = toggle.querySelector('.toggle-highlight');
                return toggle;
            }
        },
        {
            // Generic toggle switch creator
            key: "createToggleSwitch",
            value: function createToggleSwitch(leftText, rightText, initialLeftActive, onToggle) {
                var _this = this;
                var toggle = this.createDiv({
                    display: 'flex',
                    backgroundColor: '#333',
                    border: '2px solid #00FFFF',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontFamily: '"Press Start 2P", cursive, sans-serif',
                    fontSize: '12px',
                    color: '#00FFFF',
                    overflow: 'hidden',
                    position: 'relative',
                    width: '180px',
                    height: '40px',
                    pointerEvents: 'auto'
                });
                var leftSpan = document.createElement('span');
                leftSpan.textContent = leftText;
                Object.assign(leftSpan.style, {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                    flex: 1,
                    zIndex: 2,
                    transition: 'color 0.3s ease',
                    userSelect: 'none' // Prevent text selection
                });
                var rightSpan = document.createElement('span');
                rightSpan.textContent = rightText;
                Object.assign(rightSpan.style, {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                    flex: 1,
                    zIndex: 2,
                    transition: 'color 0.3s ease',
                    userSelect: 'none'
                });
                // Highlight element
                var highlightElement = this.createDiv({
                    position: 'absolute',
                    top: '0',
                    bottom: '0',
                    width: '50%',
                    backgroundColor: '#00FFFF',
                    borderRadius: '3px',
                    transition: 'left 0.3s ease',
                    zIndex: 1,
                    className: 'toggle-highlight'
                });
                toggle.appendChild(highlightElement);
                toggle.appendChild(leftSpan);
                toggle.appendChild(rightSpan);
                // Initial state
                this.updateToggleVisuals(toggle, leftSpan, rightSpan, highlightElement, initialLeftActive);
                // Add toggle functionality
                toggle.addEventListener('click', function() {
                    var isCurrentlyLeftActive = highlightElement.style.left === '0%';
                    var newLeftActive = !isCurrentlyLeftActive;
                    _this.updateToggleVisuals(toggle, leftSpan, rightSpan, highlightElement, newLeftActive);
                    if (onToggle) {
                        onToggle(newLeftActive);
                    }
                });
                // Hover effect for the whole toggle
                toggle.addEventListener('mouseenter', function() {
                    toggle.style.borderColor = '#FF00FF';
                }); // Magenta border on hover
                toggle.addEventListener('mouseleave', function() {
                    toggle.style.borderColor = '#00FFFF';
                }); // Restore cyan border
                return toggle;
            }
        },
        {
            // --- Updated Method to Toggle Display Mode ---
            key: "toggleDisplayMode",
            value: function toggleDisplayMode(toggleElement, solfegeSpan, pitchSpan) {
                if (this.game.gameState !== GAME_STATE.PLAYING || !this.game.currentQuestion) return;
                this.displayMode = this.displayMode === 'solfege' ? 'pitch' : 'solfege';
                this.updateToggleVisuals(toggleElement, solfegeSpan, pitchSpan, this.toggleHighlight, this.displayMode === 'solfege'); // Update visuals
                // Re-display the current question options with the new mode
                this.displayQuestion(this.game.currentQuestion.options);
                // Update the floating answer targets to match the new display mode
                this.game.clearAnswerTargets();
                this.game.createAnswerTargets(this.game.currentQuestion.options);
            }
        },
        {
            // --- New Helper to Update Toggle Visuals ---
            key: "updateToggleVisuals",
            value: function updateToggleVisuals(toggleElement, leftSpan, rightSpan, highlightElement, leftActive) {
                if (leftActive) {
                    highlightElement.style.left = '0%';
                    leftSpan.style.color = '#333'; // Dark text on active highlight
                    rightSpan.style.color = '#00FFFF'; // Default text color
                } else {
                    highlightElement.style.left = '50%';
                    leftSpan.style.color = '#00FFFF';
                    rightSpan.style.color = '#333';
                }
            }
        },
        {
            // --- Updated/New Methods ---
            // No longer disabling buttons
            // remove disableAnswerButtons()
            // remove enableAnswerButtons()
            key: "showNextPatternButton",
            value: function showNextPatternButton() {
                this.nextPatternButton.style.visibility = 'visible';
            // Keep Play Pattern button visible
            // this.playPatternButton.style.visibility = 'hidden'; // REMOVED
            }
        },
        {
            key: "hideNextPatternButton",
            value: function hideNextPatternButton() {
                this.nextPatternButton.style.visibility = 'hidden';
            // Play Pattern button remains visible
            // this.playPatternButton.style.visibility = 'visible'; // Already visible
            }
        },
        {
            // Clean up event listeners when needed
            key: "removeEventListeners",
            value: function removeEventListeners() {
                if (this.keyboardShortcutHandler) {
                    window.removeEventListener('keydown', this.keyboardShortcutHandler);
                }
            }
        },
        {
            key: "highlightCorrectButton",
            value: function highlightCorrectButton(buttonElement) {
                // Style the correctly chosen button
                if (buttonElement) {
                    buttonElement.style.borderColor = '#00FF00'; // Green border
                    buttonElement.style.boxShadow = '3px 3px #00FF00'; // Green shadow
                    buttonElement.style.color = '#00FF00'; // Green text
                }
            // Optionally, dim other buttons slightly? Or just highlight correct one.
            // Let's just highlight the correct one for now.
            }
        },
        {
            // Handle keyboard number shortcuts (1-4) for answer selection
            key: "handleKeyboardShortcut",
            value: function handleKeyboardShortcut(event) {
                // Only process if we're in the PLAYING state and have answer options
                if (this.isCapturingText || this.game.gameState !== GAME_STATE.PLAYING || !this.answerContainer.firstChild) return;
                // Check if key pressed is 1-4
                var key = event.key;
                if (key >= '1' && key <= '4') {
                    var index = parseInt(key) - 1;
                    var optionContainers = this.answerContainer.querySelectorAll('.option-container');
                    // Check if this index exists in our answer options
                    if (index < optionContainers.length) {
                        var button = optionContainers[index].querySelector('button');
                        if (button) {
                            // Always process clicks, even on already selected buttons
                            this.game.audioManager.playClickSound();
                            // Only set selected state if not already selected
                            if (button.dataset.selected !== 'true') {
                                button.dataset.selected = 'true';
                            }
                            // Get the original Solfege value for this option
                            var optionText = this.game.currentQuestion.options[index];
                            this.game.submitAnswer(optionText, button);
                            // Visual feedback - briefly highlight button
                            var originalBg = button.style.backgroundColor;
                            button.style.backgroundColor = '#DDDDDD';
                            setTimeout(function() {
                                if (button) button.style.backgroundColor = originalBg;
                            }, 200);
                        }
                    }
                }
            }
        },
        {
            key: "getButtonForOption",
            value: function getButtonForOption(optionText) {
                if (!optionText) return null;
                var buttons = this.answerContainer.querySelectorAll('.option-container > button');
                for(var i = 0; i < buttons.length; i++){
                    if (buttons[i].dataset.option === optionText) return buttons[i];
                }
                var options = this.game.currentQuestion && this.game.currentQuestion.options || [];
                var index = options.indexOf(optionText);
                if (index >= 0 && buttons[index]) return buttons[index];
                return null;
            }
        },
        {
            key: "highlightCorrectOption",
            value: function highlightCorrectOption(optionText) {
                var button = this.getButtonForOption(optionText);
                if (button) this.highlightCorrectButton(button);
            }
        },
        {
            key: "markEliminatedOption",
            value: function markEliminatedOption(optionText) {
                var button = this.getButtonForOption(optionText);
                if (!button) return;
                button.dataset.eliminated = 'true';
                button.style.backgroundColor = 'rgba(50, 0, 0, 0.6)';
                button.style.opacity = '0.7';
                button.style.boxShadow = 'none';
                button.style.color = '#FF6666';
                button.style.borderColor = '#8B0000';
            }
        },
        {
            key: "updateStats",
            value: function updateStats(stats) {
                if (!this.statsDisplay || !stats) return;
                var streakText = stats.streak > 1 ? "  ·  Streak x".concat(stats.streak) : '';
                this.statsDisplay.textContent = "".concat(stats.question, "/").concat(stats.total).concat(streakText);
            }
        },
        {
            key: "updateMuteButton",
            value: function updateMuteButton(muted) {
                if (!this.muteButton) return;
                this.muteButton.textContent = muted ? 'Unmute' : 'Mute';
            }
        },
        {
            key: "renderHighScorePanel",
            value: function renderHighScorePanel() {
                var scores = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : loadHighScores();
                this.highScorePanel.innerHTML = '';
                var heading = this.createText('High Scores', '14px', 'center');
                heading.style.marginBottom = '8px';
                this.highScorePanel.appendChild(heading);
                if (!scores.length) {
                    this.highScorePanel.appendChild(this.createText('No scores yet — go make one.', '10px', 'center'));
                    return;
                }
                scores.slice(0, 5).forEach(function(entry, index) {
                    var row = document.createElement('div');
                    row.textContent = "".concat(index + 1, ". ").concat(entry.name, "  ").concat(entry.score, "  L").concat(entry.level);
                    row.style.textAlign = 'center';
                    this.highScorePanel.appendChild(row);
                }.bind(this));
            }
        },
        {
            key: "buildOverlays",
            value: function buildOverlays() {
                var _this = this;
                this.overlayRoot = document.createElement('div');
                this.gameOverOverlay = document.createElement('div');
                this.gameOverOverlay.className = 'pp-overlay';
                this.gameOverCard = document.createElement('div');
                this.gameOverCard.className = 'pp-card';
                this.gameOverTitle = this.createText('Game Complete!', '22px', 'center');
                this.gameOverStats = this.createText('', '12px', 'center');
                this.gameOverStats.style.lineHeight = '1.8';
                this.gameOverStats.style.margin = '16px 0';
                this.nameEntryRow = this.createDiv({
                    display: 'none',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px'
                });
                this.nameEntryLabel = this.createText('New high score! Initials:', '10px', 'center');
                this.nameInput = document.createElement('input');
                this.nameInput.className = 'pp-initials';
                this.nameInput.maxLength = 3;
                this.nameInput.placeholder = 'AAA';
                this.nameInput.addEventListener('focus', function() {
                    _this.isCapturingText = true;
                });
                this.nameInput.addEventListener('blur', function() {
                    _this.isCapturingText = false;
                });
                this.nameInput.addEventListener('input', function() {
                    _this.nameInput.value = _this.nameInput.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3);
                });
                this.nameInput.addEventListener('keydown', function(event) {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        _this.game.submitHighScore(_this.nameInput.value);
                    }
                });
                this.saveScoreButton = this.createButton('Save Score', function() {
                    return _this.game.submitHighScore(_this.nameInput.value);
                }, '12px');
                this.nameEntryRow.appendChild(this.nameEntryLabel);
                this.nameEntryRow.appendChild(this.nameInput);
                this.nameEntryRow.appendChild(this.saveScoreButton);
                this.gameOverScores = this.createDiv({
                    className: 'pp-scores',
                    marginBottom: '18px'
                });
                this.gameOverActions = this.createDiv({
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                });
                this.playAgainButton = this.createButton('Play Again', function() {
                    return _this.game.startGame();
                }, '12px');
                this.menuButton = this.createButton('Menu', function() {
                    return _this.game.returnToMenu();
                }, '12px');
                this.gameOverActions.appendChild(this.playAgainButton);
                this.gameOverActions.appendChild(this.menuButton);
                this.gameOverCard.appendChild(this.gameOverTitle);
                this.gameOverCard.appendChild(this.gameOverStats);
                this.gameOverCard.appendChild(this.nameEntryRow);
                this.gameOverCard.appendChild(this.gameOverScores);
                this.gameOverCard.appendChild(this.gameOverActions);
                this.gameOverOverlay.appendChild(this.gameOverCard);
                this.pauseOverlay = document.createElement('div');
                this.pauseOverlay.className = 'pp-overlay';
                this.pauseCard = document.createElement('div');
                this.pauseCard.className = 'pp-card';
                this.pauseCard.appendChild(this.createText('Paused', '24px', 'center'));
                var pauseHint = this.createText('Esc or Enter to resume', '10px', 'center');
                pauseHint.style.margin = '16px 0';
                this.pauseCard.appendChild(pauseHint);
                var pauseActions = this.createDiv({
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    flexWrap: 'wrap'
                });
                pauseActions.appendChild(this.createButton('Resume', function() {
                    return _this.game.togglePause();
                }, '12px'));
                pauseActions.appendChild(this.createButton('Menu', function() {
                    return _this.game.returnToMenu();
                }, '12px'));
                this.pauseCard.appendChild(pauseActions);
                this.pauseOverlay.appendChild(this.pauseCard);
                this.overlayRoot.appendChild(this.gameOverOverlay);
                this.overlayRoot.appendChild(this.pauseOverlay);
                this.container.appendChild(this.overlayRoot);
            }
        },
        {
            key: "showGameOverScreen",
            value: function showGameOverScreen(details) {
                this.hidePauseOverlay();
                this.gameOverTitle.textContent = details.title || 'Game Complete!';
                this.gameOverStats.textContent = "Score ".concat(details.score, "  ·  Level ").concat(details.level, "  ·  Best streak ").concat(details.bestStreak || 0);
                this.nameEntryRow.style.display = details.showNameEntry ? 'flex' : 'none';
                this.nameInput.value = '';
                this.renderOverlayScores(details.highScores || []);
                this.gameOverOverlay.classList.add('visible');
                if (details.showNameEntry) {
                    this.isCapturingText = true;
                    setTimeout(function() {
                        this.nameInput.focus();
                    }.bind(this), 50);
                } else {
                    this.isCapturingText = false;
                }
            }
        },
        {
            key: "refreshGameOverHighScores",
            value: function refreshGameOverHighScores(scores) {
                this.nameEntryRow.style.display = 'none';
                this.isCapturingText = false;
                this.renderOverlayScores(scores || loadHighScores());
            }
        },
        {
            key: "renderOverlayScores",
            value: function renderOverlayScores(scores) {
                var _this = this;
                this.gameOverScores.innerHTML = '';
                var heading = this.createText('High Scores', '12px', 'center');
                heading.style.marginBottom = '8px';
                this.gameOverScores.appendChild(heading);
                if (!scores.length) {
                    this.gameOverScores.appendChild(this.createText('You are first on the board.', '10px', 'center'));
                    return;
                }
                scores.forEach(function(entry, index) {
                    var row = document.createElement('div');
                    row.textContent = "".concat(index + 1, ". ").concat(entry.name, "  ").concat(entry.score, "  L").concat(entry.level);
                    _this.gameOverScores.appendChild(row);
                });
            }
        },
        {
            key: "showPauseOverlay",
            value: function showPauseOverlay() {
                this.pauseOverlay.classList.add('visible');
            }
        },
        {
            key: "hidePauseOverlay",
            value: function hidePauseOverlay() {
                this.pauseOverlay.classList.remove('visible');
            }
        },
        {
            key: "hideOverlays",
            value: function hideOverlays() {
                this.hidePauseOverlay();
                this.gameOverOverlay.classList.remove('visible');
                this.isCapturingText = false;
            }
        },
        {
            key: "resetAnswerButtonHighlights",
            value: function resetAnswerButtonHighlights() {
                // Reset all answer buttons (which are inside optionContainers) to their default appearance
                var buttons = this.answerContainer.querySelectorAll('.option-container > button'); // Target buttons within the new containers
                buttons.forEach(function(button) {
                    button.style.borderColor = '#FF00FF'; // Restore default magenta border
                    button.style.boxShadow = '3px 3px #00FFFF'; // Restore default cyan shadow
                    button.style.color = '#FF00FF'; // Restore default magenta text
                    button.style.backgroundColor = '#FFF'; // Ensure background is reset
                    button.style.opacity = '1'; // Ensure opacity is reset
                    // Reset all button state markers
                    delete button.dataset.eliminated;
                    button.dataset.selected = 'false'; // Reset selection state
                    // Remove shake class if present
                    button.classList.remove('shake');
                });
            }
        }
    ]);
    return UI;
}();
