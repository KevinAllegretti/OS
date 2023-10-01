/* ------------
   Shell.ts

   The OS Shell - The "command line interface" (CLI) for the console.

    Note: While fun and learning are the primary goals of all enrichment center activities,
          serious injuries may occur when trying to write your own Operating System.
   ------------ */

// TODO: Write a base class / prototype for system services and let Shell inherit from it.

module TSOS {
    export class Shell {
        // Properties
        public promptStr = ">";
        public commandList = [];
        public curses = "[fuvg],[cvff],[shpx],[phag],[pbpxfhpxre],[zbgureshpxre],[gvgf]";
        public apologies = "[sorry]";

        constructor() {
        }

        public init() {
            var sc: ShellCommand;
            //
            // Load the command list.

            //Lab 1: new commands, make them concise and similiar structure to the other commands

            //date
            sc = new ShellCommand(this.shellDate,
                                  "date",
                                  "- Displays the current date and time.");
            this.commandList[this.commandList.length] = sc;

            //whereami
            sc = new ShellCommand(this.shellWhereAmI,
                                  "whereami",
                                  "- Displays the user's current location.");
            this.commandList[this.commandList.length] = sc;
            //stats
            sc = new ShellCommand(this.shellStats,
                                  "stats",
                                  "- Display system statistics.");
            this.commandList[this.commandList.length] = sc;
            // ver
            sc = new ShellCommand(this.shellVer,
                                  "ver",
                                  "- Displays the current version.");
            this.commandList[this.commandList.length] = sc;

            // help
            sc = new ShellCommand(this.shellHelp,
                                  "help",
                                  "- This is the help command. Seek help.");
            this.commandList[this.commandList.length] = sc;

            // shutdown
            sc = new ShellCommand(this.shellShutdown,
                                  "shutdown",
                                  "- Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
            this.commandList[this.commandList.length] = sc;

            // cls
            sc = new ShellCommand(this.shellCls,
                                  "cls",
                                  "- Clears the screen and resets the cursor position.");
            this.commandList[this.commandList.length] = sc;

            // man <topic>
            sc = new ShellCommand(this.shellMan,
                                  "man",
                                  "<topic> - Displays the MANual page for <topic>.");
            this.commandList[this.commandList.length] = sc;

            // trace <on | off>
            sc = new ShellCommand(this.shellTrace,
                                  "trace",
                                  "<on | off> - Turns the OS trace on or off.");
            this.commandList[this.commandList.length] = sc;

            // rot13 <string>
            sc = new ShellCommand(this.shellRot13,
                                  "rot13",
                                  "<string> - Does rot13 obfuscation on <string>.");
            this.commandList[this.commandList.length] = sc;

            // prompt <string>
            sc = new ShellCommand(this.shellPrompt,
                                  "prompt",
                                  "<string> - Sets the prompt.");
            this.commandList[this.commandList.length] = sc;
            
            // BSOD trigger error
            sc = new ShellCommand(this.shellTriggerError,
                                    "bsod",
                                    "- Triggers a test Vault-Tec error.")
            this.commandList[this.commandList.length] = sc;    
            // Load
            sc = new ShellCommand(this.shellLoadCommand,
                                     "load",
                                    "- Checks to see if the user input is valid.")
            this.commandList[this.commandList.length] = sc;        
            //run 
            sc = new ShellCommand(this.shellRun,
                                    "run",
                                "- Takes in PID and executes program")
            this.commandList[this.commandList.length] = sc;                         
            // ps  - list the running processes and their IDs
            // kill <id> - kills the specified process id.

            // Display the initial prompt.
            this.putPrompt();
        }

        public putPrompt() {
            _StdOut.putText(this.promptStr);
        }

        public handleInput(buffer) {
            _Kernel.krnTrace("Shell Command~" + buffer);
            //
            // Parse the input...
            //
            var userCommand = this.parseInput(buffer);
            // ... and assign the command and args to local variables.
            var cmd = userCommand.command;
            var args = userCommand.args;
            //
            // Determine the command and execute it.
            //
            // TypeScript/JavaScript may not support associative arrays in all browsers so we have to iterate over the
            // command list in attempt to find a match. 
            // TODO: Is there a better way? Probably. Someone work it out and tell me in class.
            var index: number = 0;
            var found: boolean = false;
            var fn = undefined;
            while (!found && index < this.commandList.length) {
                if (this.commandList[index].command === cmd) {
                    found = true;
                    fn = this.commandList[index].func;
                } else {
                    ++index;
                }
            }
            if (found) {
                this.execute(fn, args);  // Note that args is always supplied, though it might be empty.
            } else {
                // It's not found, so check for curses and apologies before declaring the command invalid.
                if (this.curses.indexOf("[" + Utils.rot13(cmd) + "]") >= 0) {     // Check for curses.
                    this.execute(this.shellCurse);
                } else if (this.apologies.indexOf("[" + cmd + "]") >= 0) {        // Check for apologies.
                    this.execute(this.shellApology);
                } else { // It's just a bad command. {
                    this.execute(this.shellInvalidCommand);
                }
            }
        }

        // Note: args is an optional parameter, ergo the ? which allows TypeScript to understand that.
        public execute(fn, args?) {
            // We just got a command, so advance the line...
            _StdOut.advanceLine();
            // ... call the command function passing in the args with some über-cool functional programming ...
            fn(args);
            // Check to see if we need to advance the line again
            if (_StdOut.currentXPosition > 0) {
                _StdOut.advanceLine();
            }
            // ... and finally write the prompt again.
            this.putPrompt();
        }

        public parseInput(buffer: string): UserCommand {
            var retVal = new UserCommand();

            // 1. Remove leading and trailing spaces.
            buffer = Utils.trim(buffer);

            // 2. Lower-case it.
            buffer = buffer.toLowerCase();

            // 3. Separate on spaces so we can determine the command and command-line args, if any.
            var tempList = buffer.split(" ");

            // 4. Take the first (zeroth) element and use that as the command.
            var cmd = tempList.shift();  // Yes, you can do that to an array in JavaScript. See the Queue class.
            // 4.1 Remove any left-over spaces.
            cmd = Utils.trim(cmd);
            // 4.2 Record it in the return value.
            retVal.command = cmd;

            // 5. Now create the args array from what's left.
            for (var i in tempList) {
                var arg = Utils.trim(tempList[i]);
                if (arg != "") {
                    retVal.args[retVal.args.length] = tempList[i];
                }
            }
            return retVal;
        }

        //
        // Shell Command Functions. Kinda not part of Shell() class exactly, but
        // called from here, so kept here to avoid violating the law of least astonishment.
        //
        public shellInvalidCommand() {
            _StdOut.putText("Invalid Command. ");
            if (_SarcasticMode) {
                _StdOut.putText("Unbelievable. You, [subject name here],");
                _StdOut.advanceLine();
                _StdOut.putText("must be the pride of [subject hometown here].");
            } else {
                _StdOut.putText("Type 'help' for, well... help.");
            }
        }

        public shellCurse() {
            _StdOut.putText("Oh, so that's how it's going to be, eh? Fine.");
            _StdOut.advanceLine();
            _StdOut.putText("Bitch.");
            _SarcasticMode = true;
        }

        public shellApology() {
           if (_SarcasticMode) {
              _StdOut.putText("I think we can put our differences behind us.");
              _StdOut.advanceLine();
              _StdOut.putText("For science . . . You monster.");
              _SarcasticMode = false;
           } else {
              _StdOut.putText("For what?");
           }
        }

        // Although args is unused in some of these functions, it is always provided in the 
        // actual parameter list when this function is called, so I feel like we need it.

        //Lab 1 commands:

        //date
        public shellDate(args: string[]) {
            const currentDate = new Date();
            _StdOut.putText("Current date and time: " + currentDate.toString());
        }

        //whereami
        /* This funciton will be improved on in the future based on certain user actions or inputs. 
        For now, I want to put all of the locations in an array and return the first location being the 'homebase' */
        public shellWhereAmI(args: string[]) {
            //Array of locations. These are a few locations from 'Fall Out New Vegas'
            const locations = [
                "Location: (Homebase) Harper's Shack, on the east end of Primm Pass, southwest of Novac",
                "Location: Wolfhorn Ranch",
                "Location: The Humble Sealed Sewers",
                "Location: You find yourself in the Devils Gullet.",
                "Location: Colonial Taphouse",
            ];
            _StdOut.putText(locations[0]);
        }

        //Stats funciton 
        /*Since I'm basing this OS off of Fallout, I think we should have stats like
        health, level, radiaiton and a few others.*/
        
        public shellStats(args: string[]) {
            // Define player stats through a object
            let playerStats = {
                health: 100,
                stamina: 100,
                radiation: 0,
                level: 1
            };
        
            _StdOut.putText("Player Stats:");
            _StdOut.advanceLine();
            _StdOut.putText(`Health: ${playerStats.health}`);
            _StdOut.advanceLine();
            _StdOut.putText(`Stamina: ${playerStats.stamina}`);
            _StdOut.advanceLine();
            _StdOut.putText(`Radiation: ${playerStats.radiation}`);
            _StdOut.advanceLine();
            _StdOut.putText(`Level: ${playerStats.level}`);
        }

        //Trigger for the BSOD error.
        public shellTriggerError(args: string[]) {
            _Kernel.krnTrapError("Error Test.");
        }
        

        public shellVer(args: string[]) {
            _StdOut.putText(APP_NAME + " version " + APP_VERSION);
        }

        public shellHelp(args: string[]) {
            _StdOut.putText("Commands:");
            for (var i in _OsShell.commandList) {
                _StdOut.advanceLine();
                _StdOut.putText("  " + _OsShell.commandList[i].command + " " + _OsShell.commandList[i].description);
            }
        }

        public shellShutdown(args: string[]) {
             _StdOut.putText("Shutting down...");
             // Call Kernel shutdown routine.
            _Kernel.krnShutdown();
            // TODO: Stop the final prompt from being displayed. If possible. Not a high priority. (Damn OCD!)
        }

        public shellCls(args: string[]) {         
            _StdOut.clearScreen();     
            _StdOut.resetXY();
        }

        public shellMan(args: string[]) {
            if (args.length > 0) {
                var topic = args[0];
                switch (topic) {
                    case "date":
                        _StdOut.putText("Date displays the current date and time.")
                        break;
                    case "whereami":
                        _StdOut.putText("Displays the user's current location.")
                        break;
                    case "stats":
                         _StdOut.putText("Stats displays the player's current stats including health, stamina, radiation, and level.");
                        break;
                    case "ver":
                        _StdOut.putText("Ver displays the current version of the operating system.")
                        break;
                    case "help":
                        _StdOut.putText("Help displays a list of available commands.")
                        break;
                    case "shutdown":
                        _StdOut.putText("Shuts down the virtual OS but leaves the underlying host / hardware simulation running.");
                        break;
                    case "cls":
                        _StdOut.putText("Clears the screen and resets the cursor position.")
                        break;
                    case "man":
                        _StdOut.putText("Displays the MANual page for <topic>.")
                        break;
                    case "trace":
                        _StdOut.putText("Turns the OS trace on or off.")
                        break;
                    case "trot13":
                        _StdOut.putText("Does rot13 obfuscation on <string>.")
                        break;
                    case "prompt":
                        _StdOut.putText("Sets the prompt")
                        break;
                    case "bsod":
                        _StdOut.putText("Triggers a test Vault-Tec error")
                        break;
                    case "load":
                        _StdOut.putText("Checks to see if the user input is valid.")
                        break;
                    case "run":
                        _StdOut.putText("Takes in PID and executes program.");
                        break;
                    default:
                        _StdOut.putText("No manual entry for " + args[0] + ".");
                }
            } else {
                _StdOut.putText("Usage: man <topic>  Please supply a topic.");
            }
        }

        public shellTrace(args: string[]) {
            if (args.length > 0) {
                var setting = args[0];
                switch (setting) {
                    case "on":
                        if (_Trace && _SarcasticMode) {
                            _StdOut.putText("Trace is already on, doofus.");
                        } else {
                            _Trace = true;
                            _StdOut.putText("Trace ON");
                        }
                        break;
                    case "off":
                        _Trace = false;
                        _StdOut.putText("Trace OFF");
                        break;
                    default:
                        _StdOut.putText("Invalid arguement.  Usage: trace <on | off>.");
                }
            } else {
                _StdOut.putText("Usage: trace <on | off>");
            }
        }

        public shellRot13(args: string[]) {
            if (args.length > 0) {
                // Requires Utils.ts for rot13() function.
                _StdOut.putText(args.join(' ') + " = '" + Utils.rot13(args.join(' ')) +"'");
            } else {
                _StdOut.putText("Usage: rot13 <string>  Please supply a string.");
            }
        }

        public shellPrompt(args: string[]) {
            if (args.length > 0) {
                _OsShell.promptStr = args[0];
            } else {
                _StdOut.putText("Usage: prompt <string>  Please supply a string.");
            }
        }
        

        public shellLoadCommand(): void {
            const textArea = document.getElementById("taProgramInput") as HTMLTextAreaElement;
            const input = textArea.value.replaceAll(" ", '');
            console.log("LOAD TEST");
            //Looked up the "regex" format for hexideciaml numbers, While using the test function for a boolean value.
            const isValid = /^([0-9a-fA-F]+\s*)*$/.test(input);
            
            if (isValid) {

               let pid = _Kernel.createProcess(input);


                _StdOut.putText("Program Loaded: PID: " + pid)
            } else {
                _StdOut.putText("Invalid input");
            }
            
        
        }
        
        public shellRun(args: string[]){
            //check if there is a process of given ID
            let pid = args[0]
            if (!pid || parseInt(pid) == null){
                _StdOut.putText("Enter PID to run.");
                return;
            }

            let process = _PCB.checkProcess(parseInt(pid));
            //run process
            if (process){
                //ask kernel to run process
                _Kernel.runProcess(process);
            }
            else{
                _StdOut.putText("Process with PID: " + pid + " does not exist");

            }


        }

    }
}
