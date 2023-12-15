/* ------------
     Kernel.ts

     Routines for the Operating System, NOT the host.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

//import { start } from "repl";

module TSOS {

    export class Kernel {

        public userQuant:number=10;
        //
        // OS Startup and Shutdown Routines
        //
        constructor(){
            this.userQuant = 10
        }

        public krnBootstrap() {      // Page 8. {
            Control.hostLog("bootstrap", "host");  // Use hostLog because we ALWAYS want this, even if _Trace is off.

            // Initialize our global queues.
            _KernelInterruptQueue = new Queue();  // A (currently) non-priority queue for interrupt requests (IRQs).
            _KernelBuffers = new Array();         // Buffers... for the kernel.
            _KernelInputQueue = new Queue();      // Where device input lands before being processed out somewhere.

            // Initialize the console.
            _Console = new Console();             // The command line interface / console I/O device.
            _Console.init();

            // Initialize standard input and output to the _Console.
            _StdIn  = _Console;
            _StdOut = _Console;

            // Load the Keyboard Device Driver
            this.krnTrace("Loading the keyboard device driver.");
            _krnKeyboardDriver = new DeviceDriverKeyboard();     // Construct it.
            _krnKeyboardDriver.driverEntry();                    // Call the driverEntry() initialization routine.
            this.krnTrace(_krnKeyboardDriver.status);

            // load disk system
            this.krnTrace("Loading the disk system device driver.");
            _krnDiskSystemDriver = new DeviceDriverDiskSystem();     // Construct it.
            _krnDiskSystemDriver.driverEntry();                    // Call the driverEntry() initialization routine.
            this.krnTrace(_krnDiskSystemDriver.status);

            // Enable the OS Interrupts.  (Not the CPU clock interrupt, as that is done in the hardware sim.)
            this.krnTrace("Enabling the interrupts.");
            this.krnEnableInterrupts();

            // Launch the shell.
            this.krnTrace("Creating and Launching the shell.");
            _OsShell = new Shell();
            _OsShell.init();

            // Finally, initiate student testing protocol.
            if (_GLaDOS) {
                _GLaDOS.afterStartup();
            }

            
        }
        
        public krnShutdown() {
            this.krnTrace("begin shutdown OS");
            // TODO: Check for running processes.  If there are some, alert and stop. Else...
            // ... Disable the Interrupts.
            this.krnTrace("Disabling the interrupts.");
            this.krnDisableInterrupts();
            //
            // Unload the Device Drivers?
            // More?
            //
            this.krnTrace("end shutdown OS");
        }

        public saveProcessToDisk(process){
            let data = [];
            for (let i =process.startLocation; i < process.endLocation; i++){
                data.push(_CPU.hexlog(_CPU.ma.readImmediate(i),2));
                _CPU.ma.writeImmediate(i,0);
            }
            process.startLocation = 0;
            process.endLocation = 0;
            process.currentLocation = "disk"

            let processName = "process"+process.pid;
            _krnDiskSystemDriver.create(processName);
            _krnDiskSystemDriver.write(processName, data.join("-"));
        }
        public loadFromDisk(process){
            let processName = "process"+process.pid;
            let processData = _krnDiskSystemDriver.returnRead(processName).split("-")
            _krnDiskSystemDriver.delete(processName);
            let startLocation = 0;
            while (_CPU.ma.readImmediate(startLocation) != 0){
                startLocation += 256
            }
            process.startLocation = startLocation;
            process.endLocation = startLocation+256;
            process.currentLocation = "memory";
            for (let i = process.startLocation; i < process.endLocation; i++){
                _CPU.ma.writeImmediate(i , parseInt(processData[i-process.startLocation] || "00", 16));
            }
        }

        
        public krnOnCPUClockPulse() {
            /* This gets called from the host hardware simulation every time there is a hardware clock pulse.
               This is NOT the same as a TIMER, which causes an interrupt and is handled like other interrupts.
               This, on the other hand, is the clock pulse from the hardware / VM / host that tells the kernel
               that it has to look for interrupts and process them if it finds any.                          
            */

            // Check for an interrupt, if there are any. Page 560
            if (_KernelInterruptQueue.getSize() > 0) {
                // Process the first interrupt on the interrupt queue.
                // TODO (maybe): Implement a priority queue based on the IRQ number/id to enforce interrupt priority.
                var interrupt = _KernelInterruptQueue.dequeue();
                this.krnInterruptHandler(interrupt.irq, interrupt.params);
            } else if (_CPU.isExecuting || _PCB.readyQueue.length > 0) { // If there are no interrupts then run one CPU cycle if there is anything being processed.
                if (_CPU.cycleTracker%this.userQuant == 0){
                    
                    if (_CPU.pid != null){
                        _CPU.save();

                        var oldProcess = _PCB.checkProcess(_CPU.pid);
                        var newProcess = _PCB.readyQueue[0];
                        if (newProcess && newProcess.currentLocation != "memory"){
                            this.saveProcessToDisk(oldProcess);
                        }

                        if (oldProcess.isExecuting == true){
                            _PCB.readyQueue.push(oldProcess);
                        }

                    }

                    var newProcess = _PCB.readyQueue[0];
                    _PCB.readyQueue.shift();

                    if (newProcess.currentLocation == "disk"){
                        this.loadFromDisk(newProcess);
                    }

                    this.runProcess(newProcess);


                }
                
                _CPU.cycle();


            } else {                       // If there are no interrupts and there is nothing being executed then just be idle.
                this.krnTrace("Idle");
            }
            _PCB.renderProcessTable();
            _Memory.displayMemory();
            _krnDiskSystemDriver.renderDisk();

        }


        //
        // Interrupt Handling
        //
        public krnEnableInterrupts() {
            // Keyboard
            Devices.hostEnableKeyboardInterrupt();
            // Put more here.
        }

        public krnDisableInterrupts() {
            // Keyboard
            Devices.hostDisableKeyboardInterrupt();
            // Put more here.
        }

        public krnInterruptHandler(irq, params) {
            // This is the Interrupt Handler Routine.  See pages 8 and 560.
            // Trace our entrance here so we can compute Interrupt Latency by analyzing the log file later on. Page 766.
            this.krnTrace("Handling IRQ~" + irq);

            // Invoke the requested Interrupt Service Routine via Switch/Case rather than an Interrupt Vector.
            // TODO: Consider using an Interrupt Vector in the future.
            // Note: There is no need to "dismiss" or acknowledge the interrupts in our design here.
            //       Maybe the hardware simulation will grow to support/require that in the future.
            switch (irq) {
                case TIMER_IRQ:
                    this.krnTimerISR();               // Kernel built-in routine for timers (not the clock).
                    break;
                case KEYBOARD_IRQ:
                    _krnKeyboardDriver.isr(params);   // Kernel mode device driver
                    _StdIn.handleInput();
                    break;
                default:
                    this.krnTrapError("Invalid Interrupt Request. irq=" + irq + " params=[" + params + "]");
            }
        }

        public krnTimerISR() {
            // The built-in TIMER (not clock) Interrupt Service Routine (as opposed to an ISR coming from a device driver). {
            // Check multiprogramming parameters and enforce quanta here. Call the scheduler / context switch here if necessary.
            // Or do it elsewhere in the Kernel. We don't really need this.
        }

        //
        // System Calls... that generate software interrupts via tha Application Programming Interface library routines.
        //
        // Some ideas:
        // - ReadConsole
        // - WriteConsole
        // - CreateProcess
        // - ExitProcess
        // - WaitForProcessToExit
        // - CreateFile
        // - OpenFile
        // - ReadFile
        // - WriteFile
        // - CloseFile


        //
        // OS Utility Routines
        //
        public krnTrace(msg: string) {
             // Check globals to see if trace is set ON.  If so, then (maybe) log the message.
             if (_Trace) {
                if (msg === "Idle") {
                    // We can't log every idle clock pulse because it would quickly lag the browser quickly.
                    if (_OSclock % 10 == 0) {
                        // Check the CPU_CLOCK_INTERVAL in globals.ts for an
                        // idea of the tick rate and adjust this line accordingly.
                        Control.hostLog(msg, "OS");
                    }
                } else {
                    Control.hostLog(msg, "OS");
                }
             }
        }

        public createProcess(input: string){

            // Write to disk if more than 3 processes
            if (_PCB.processMap.size >= 3){
                let pid = _PCB.addProcessinDisk()

                //Tracker for memory address
                let fileContent = []
                for (let i = 0; i < 256; i+= 2){
                    if (input.length > i){
                        let a = input.charAt(i);
                        let b = input.charAt(i + 1);
                        let c = a + b;
                        //console.log('combining ',a,'+',b, '=',parseInt(c,16))
                        //console.log(_MemoryManager.nextProcessByte, tracker)
                        fileContent.push(c)
                    }
                    else{
                        fileContent.push("00")
                    }
                }
                let processName = "process"+pid;
                _krnDiskSystemDriver.create(processName);
                _krnDiskSystemDriver.write(processName, fileContent.join("-"));

                return pid;
            }
            // otherwise write to memory
            else{
                //Tracker for memory address
                let tracker: number = 0;
                for (let i = 0; i < input.length; i+= 2){
                    let a = input.charAt(i);
                    let b = input.charAt(i + 1);
                    let c = a + b;
                    //console.log('combining ',a,'+',b, '=',parseInt(c,16))
                    //console.log(_MemoryManager.nextProcessByte, tracker)
                    _CPU.ma.writeImmediate(_MemoryManager.nextProcessByte + tracker, parseInt(c,16));
                    //console.log("writing to ",_MemoryManager.nextProcessByte + tracker)
                    tracker += 1;
                }

                let pid = _PCB.addProcessInMem(_MemoryManager.nextProcessByte,_MemoryManager.nextProcessByte+256)
                _MemoryManager.nextProcessByte = _MemoryManager.nextProcessByte + 256;

                return pid;
            }
        }
        
        public runProcess(process){
            console.log("Running process", process)
            process.isExecuting = true;
            _CPU.load(process);
        }

        public krnTrapError(msg) {
            Control.hostLog("OS ERROR - TRAP: " + msg);
            // TODO: Display error on console, perhaps in some sort of colored screen. (Maybe blue?)

            this.displayVaultTecError(msg);
            this.krnShutdown();
        }
        
        /* Fallout themed error message!*/
        private displayVaultTecError(errorMsg: String) {
            _StdOut.clearScreen();

            _StdOut.resetXY();

            _StdOut.putText("==============================");
            _StdOut.advanceLine();
            _StdOut.putText("===== Vault-Tec OS Error =====");
            _StdOut.advanceLine();
            _StdOut.putText("==============================");
            _StdOut.advanceLine();
            _StdOut.advanceLine();
            _StdOut.putText("ERROR: " + errorMsg);
            _StdOut.advanceLine();
            _StdOut.advanceLine();
            _StdOut.putText("Please contact your nearest Vault-Tec representative.");
        }
    }
}
