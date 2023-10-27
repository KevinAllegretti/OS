/* ------------
     Console.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */
var TSOS;
(function (TSOS) {
    class Console {
        currentFont;
        currentFontSize;
        currentXPosition;
        currentYPosition;
        buffer;
        constructor(currentFont = _DefaultFontFamily, currentFontSize = _DefaultFontSize, currentXPosition = 0, currentYPosition = _DefaultFontSize, buffer = "") {
            this.currentFont = currentFont;
            this.currentFontSize = currentFontSize;
            this.currentXPosition = currentXPosition;
            this.currentYPosition = currentYPosition;
            this.buffer = buffer;
        }
        init() {
            this.clearScreen();
            this.resetXY();
        }
        clearScreen() {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }
        resetXY() {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        }
        /* with the backspace, I'm going to use substring (NOT slice) to get the last character and remove it
        by using the buffer*/
        backspace() {
            if (this.buffer.length > 0) {
                // Retrieve the last character from the buffer.
                const lastChar = this.buffer[this.buffer.length - 1];
                // Remove the last character from the buffer.
                this.buffer = this.buffer.substring(0, this.buffer.length - 1);
                // Determine the width of the last character in the buffer.
                const charWidth = _DrawingContext.measureText(this.currentFont, this.currentFontSize, lastChar);
                // Adjust the current X position
                this.currentXPosition -= charWidth;
                /*Erase the last character from the display by starting from the top-left corner of the character.
                The area cleared is exactly the size of the character */
                _DrawingContext.clearRect(this.currentXPosition, this.currentYPosition - this.currentFontSize, charWidth, this.currentFontSize + _FontHeightMargin);
            }
        }
        handleInput() {
            //Need some console logs to test where the code is in the canvas inspection code.
            console.log("TEST");
            while (_KernelInputQueue.getSize() > 0) {
                // Get the next character from the kernel input queue.
                var chr = _KernelInputQueue.dequeue();
                console.log(chr);
                // Check to see if it's "special" (enter or ctrl-c) or "normal" (anything else that the keyboard device driver gave us).
                if (chr === String.fromCharCode(13)) { // the Enter key
                    // The enter key marks the end of a console command, so ...
                    // ... tell the shell ...
                    _OsShell.handleInput(this.buffer);
                    // ... and reset our buffer.
                    this.buffer = "";
                }
                else if (chr == String.fromCharCode(8)) {
                    this.backspace();
                }
                else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                    console.log("TEST 4");
                }
                console.log("TEST 5");
                // TODO: Add a case for Ctrl-C that would allow the user to break the current program.
            }
        }
        putText(input) {
            /*  My first inclination here was to write two functions: putChar() and putString().
                Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
                between the two. (Although TypeScript would. But we're compiling to JavaScipt anyway.)
                So rather than be like PHP and write two (or more) functions that
                do the same thing, thereby encouraging confusion and decreasing readability, I
                decided to write one function and use the term "text" to connote string or char.
            */
            if (input !== "") {
                for (let i = 0; i < input.length; i++) {
                    let text = input.charAt(i);
                    // Draw the text at the current X and Y coordinates.
                    if (this.currentXPosition > 400) {
                        this.advanceLine();
                    }
                    _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                    // Move the current X position.
                    var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                    this.currentXPosition = this.currentXPosition + offset;
                }
            }
        }
        advanceLine() {
            //CITED SCROLLING from Youseff Abdelhady. 
            /* Initially, I approached the scrolling method with upkey and downkey and a canvas buffer,
            It semi-worked but it also was very glitchy. + I also didn't realize that the upkey
            and down key are reserved for history input. This model for scrolling is far superior,shifting up the lines.
            */
            this.currentXPosition = 0;
            const lineHeight = _DefaultFontSize +
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin;
            /*
             * Font size measures from the baseline to the highest point in the font.
             * Font descent measures from the baseline to the lowest point in the font.
             * Font height margin is extra spacing between the lines.
             */
            this.currentYPosition += _DefaultFontSize +
                _DrawingContext.fontDescent(this.currentFont, this.currentFontSize) +
                _FontHeightMargin;
            if (scroll) {
                const imageData = _DrawingContext.getImageData(0, lineHeight, _Canvas.width, _Canvas.height - lineHeight);
                _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
                _DrawingContext.putImageData(imageData, 0, 0);
                _DrawingContext.clearRect(0, _Canvas.height - lineHeight, _Canvas.width, lineHeight);
                this.currentYPosition = _Canvas.height - lineHeight;
            }
            else {
                this.currentYPosition += lineHeight;
            }
            this.currentXPosition = 0;
            // TODO: Handle scrolling. (iProject 1)
        }
    }
    TSOS.Console = Console;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=console.js.map