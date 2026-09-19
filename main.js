import * as THREE from 'three';
import { Game } from './game.js';
// Ensure the DOM element exists
var renderDiv = document.getElementById('renderDiv');
if (!renderDiv) {
    console.error("Fatal Error: The 'renderDiv' element was not found in the DOM.");
} else {
    // Initialize and start the game
    var game = new Game(renderDiv);
    window.game = game;
    game.start();
}
