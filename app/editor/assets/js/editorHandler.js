// This class acts as a controller for the code editor

'use strict'

// Import the electron-settings instance from the main process
// and ensure only one electron setting instance exists in order to avoid collision
const settings = require('electron').remote.require('electron-settings');


class EditorHandler {
    constructor(engine, frame, serverOutlet, uiHandler) {
        this.engine = engine;
        this.frame = frame;
        this.serverOutlet = serverOutlet; // Ref to the server
        this.uiHandler = uiHandler; // Ref to the UI controller

        // Controls
        this.controls = {
            'row': $('#row'),
            'col': $('#col'),
            'languagePicker': $('#languagePicker'),
            'runButton': $('#runButton'),
        }

        // Internal configuration
        this.allowCodeSubmission = true;
    }

    getAvailableCommands(callback) {
        this.serverOutlet.get((event, message) => {
            // console.log(event);
            // console.log(message);

            let commands = JSON.parse(message);

            this.availableCommands = message;

            callback(message);
        });
    }

    /**
     *
     * Requests the UI to be updated with the provided list of cammands
     */
    displayAvailableCommands(commands) {
        // Store the commands in JSON
        commands = JSON.parse(commands).availableCommands;

        // Update the UI with new commands
        uiHandler.updateCommandList(commands);
    }

    /**
     *
     * Sends code to the server for evaluation / compilation
     */
    executeCode() {
        const separator = '/';

        const chosenLanguage = this.controls.languagePicker.val();

        this.serverOutlet.send(chosenLanguage + separator + this.engine.getValue(), (e, msg) => {
        });

        // Save settings
        settings.set('editor', {
            content: this.engine.getValue(),
            language: chosenLanguage,
        });

        // Simulate an error
        // const error = new Notification('error', 'An error occured!');
        // const error = new Notification('error', 'An error occured!', 'Null sector!');
        // error.show();
    }

    /**
     *
     * Updates the front-end labels indicating the active editor row and column
     *
     * @param {Number} row
     * @param {Number} col
     */
    updateCursor() {
        const cursorInfo = this.engine.getSession().selection.getCursor();

        this.controls.row.html(cursorInfo.row);
        this.controls.col.html(cursorInfo.column);
    }

    /**
     *
     * Updates the UI to allow or prevent code submission according to
     * the editor content
     *
     * @param {Boolean} locked indicates whether the UI should allow code submissions or not
     */
    updateUI(locked) {
        if (locked) {
            console.log('Unlock UI');
        } else {
            console.log('Lock UI');
        }

        this.controls.runButton.prop('disabled', !locked);
    }

    /**
     *
     * Updates the editor mode and content according to the provided language
     *
     * @param {String} language indicates the language the editor is handling
     */
    updateLanguageMode(language) {
        this.engine.getSession().setMode({path:"ace/mode/"+ language, inline:true});
    }

    /**
     *
     * Initializes control event listners
     */
    initEventListners() {
        this.controls.languagePicker.on('change', (e) => {
            const pickedLanguage = $(e.currentTarget).val();
            this.updateLanguageMode(pickedLanguage);
        });

        this.controls.runButton.on('click', () => this.executeCode());

        this.engine.getSession().selection.on('changeCursor', () => this.updateCursor());

        this.engine.getSession().on('change', (e) => {
            // console.log(e);

            // Make sure the editor has content before allowing submissions
            this.allowCodeSubmission = this.engine.getValue() !== '';
            this.updateUI(this.allowCodeSubmission);
        });
    }
}


const uiHandler = new UIHandler();
const editor = new EditorHandler(ace.edit('editor'), $('#editor'), new ComCli('editor'));

// Editor config
editor.engine.setTheme('ace/theme/monokai');
editor.engine.$blockScrolling = Infinity;

editor.frame.css( 'fontSize', '14px' );
editor.engine.setShowPrintMargin(false);

// Fetch and set the editor content
let initialContent = "";
let initialLanguage = 'javascript';

// Are there saved editor content and language ?
if (settings.has('editor.content') && settings.has('editor.language')) {
    // Load saved settings
    initialContent = settings.get('editor.content');
    initialLanguage = settings.get('editor.language');

    // Define the selected language in the language picker
    const targetLanguage = $('option[value="' + initialLanguage + '"]');
    targetLanguage.prop('selected', true);
}

// Apply saved settings
editor.engine.getSession().setMode('ace/mode/' + initialLanguage);
editor.engine.setValue(initialContent);

// Initialise event listeners
editor.initEventListners();

editor.getAvailableCommands(editor.displayAvailableCommands);
