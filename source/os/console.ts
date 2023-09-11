/* ------------
     Console.ts

     The OS Console - stdIn and stdOut by default.
     Note: This is not the Shell. The Shell is the "command line interface" (CLI) or interpreter for this console.
     ------------ */

module TSOS {

    export class Console {

        private historyBuffer: string[] = [];
        private historyIndex: number = -1; // Initialize to -1 to indicate no history recall
    
        private canvasBuffer: string[] = [];
        private visibleLines: string[] = [];
        private maxLines: number = 10; // Maximum number of visible lines

        constructor(public currentFont = _DefaultFontFamily,
                    public currentFontSize = _DefaultFontSize,
                    public currentXPosition = 0,
                    public currentYPosition = _DefaultFontSize,
                    public buffer = "") {
                        
        }

        public init(): void {
            this.clearScreen();
            this.resetXY();
            //document.addEventListener("keydown", this.handleKeyDown.bind(this));
        }


        
        public clearScreen(): void {
            _DrawingContext.clearRect(0, 0, _Canvas.width, _Canvas.height);
        }

        public resetXY(): void {
            this.currentXPosition = 0;
            this.currentYPosition = this.currentFontSize;
        }

        private addToHistory(command: string): void {
            if (command.trim() !== '') {
                this.historyBuffer.push(command);
                // Optionally, check and manage the size of the history buffer
            }
        }

        public handleInput(): void {

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
                    this.addToHistory(this.buffer); // Add the current command to history
                    this.historyIndex = -1; // Reset history index
                } else if (chr === String.fromCharCode(38)) { // Up arrow key
                    // Handle Up arrow key (recall previous command)
                    if (this.historyIndex < this.historyBuffer.length - 1) {
                        this.historyIndex++;
                        this.buffer = this.historyBuffer[this.historyIndex];
                        // ...redraw the input area
                    }
                }
                else if (chr === String.fromCharCode(40)) { // Down arrow key
                    // Handle Down arrow key (recall next command)
                    if (this.historyIndex >= 0) {
                        this.historyIndex--;
                        this.buffer = this.historyIndex === -1 ? '' : this.historyBuffer[this.historyIndex];
                        // ...redraw the input area
                    }
                }
                else {
                    // This is a "normal" character, so ...
                    // ... draw it on the screen...
                    this.putText(chr);
                    // ... and add it to our buffer.
                    this.buffer += chr;
                    console.log("TEST 4")
                }
                console.log("TEST 5")
                // TODO: Add a case for Ctrl-C that would allow the user to break the current program.
            }
        }

        public putText(text): void {
            /*  My first inclination here was to write two functions: putChar() and putString().
                Then I remembered that JavaScript is (sadly) untyped and it won't differentiate
                between the two. (Although TypeScript would. But we're compiling to JavaScipt anyway.)
                So rather than be like PHP and write two (or more) functions that
                do the same thing, thereby encouraging confusion and decreasing readability, I
                decided to write one function and use the term "text" to connote string or char.
            */
            if (text !== "") {
                // Draw the text at the current X and Y coordinates.
                _DrawingContext.drawText(this.currentFont, this.currentFontSize, this.currentXPosition, this.currentYPosition, text);
                // Move the current X position.
                var offset = _DrawingContext.measureText(this.currentFont, this.currentFontSize, text);
                this.currentXPosition = this.currentXPosition + offset;
            }


        }

      
        public advanceLine(): void {
            this.currentXPosition = 0;
            const lineHeight = _DefaultFontSize +  // Line heght is just the height of the single line text 
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
            if(scroll){
                const imageData = _DrawingContext.getImageData(0, lineHeight, _Canvas.width, _Canvas.height - lineHeight);
                _DrawingContext.clearRect(0,0, _Canvas.width, _Canvas.height);
                _DrawingContext.putImageData(imageData, 0, 0);
                                
                _DrawingContext.clearRect(0, _Canvas.height - lineHeight, _Canvas.width, lineHeight);
                                
                this.currentYPosition = _Canvas.height - lineHeight;          
            }
            else {
                                
                    this.currentYPosition += lineHeight;
            }
                this.currentXPosition =0;

            // TODO: Handle scrolling. (iProject 1)
        }
        /*

        MIGHT use this down the line for keyboard events.... Good to have but a lot more difficult to implement in scrolling
        private handleKeyDown(event: KeyboardEvent): void {
            switch (event.keyCode) {
                case 38: // Up arrow key
                    this.scrollUp();
                    break;
                case 40: // Down arrow key
                    this.scrollDown();
                    break;
                default:
                    // Handle other key events or pass them to your input buffer
                    break;
            }
        }
        */
    }

}
