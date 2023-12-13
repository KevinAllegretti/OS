/* ------------
     CPU.ts

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */


module TSOS {

    export class Cpu {

        public ma: TSOS.MemoryAccessor = new MemoryAccessor(1, "Memory Accessor")

        constructor(public instructionRegister: number = 0, 
                    public cyclePhase: number = 1,
                    public PC: number = 0,
                    public Acc: number = 0,
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: boolean = false,
                    public decodeStep: number = 1,
                    public executeStep: number = 1,
                    public carryFlag: number = 0,
                    public isExecuting: boolean = false,
                    public pid: number = null,
                    public cycleTracker: number = 0,
                    ) {

                    

        }


        public init(): void {
            this.instructionRegister = 0;
            this.cyclePhase = 1;
            this.PC = 0;
            this.Acc = 0;
            this.Xreg = 0;
            this.Yreg = 0;
            this.Zflag = false;
            this.decodeStep = 1;
            this.executeStep = 1;
            this.carryFlag = 0;
            this.isExecuting = false;
            this.cycleTracker = 0;
        }

        public load(process){
            this.ma.startLocation = process.startLocation
            this.ma.endLocation = process.endLocation

            this.pid = process.pid;
            this.instructionRegister = process.instructionRegister;
            this.cyclePhase = process.cyclePhase
            this.PC = process.PC
            this.Acc = process.Acc;
            this.Xreg = process.Xreg;
            this.Yreg = process.Yreg;
            this.Zflag = process.Zflag;
            this.decodeStep = process.decodeStep;
            this.executeStep = process.executeStep;
            this.carryFlag = process.carryFlag;
            this.isExecuting = process.isExecuting;
            this.ma.highOrderByte = process.highOrderByte;
            this.ma.lowOrderByte = process.lowOrderByte;
            _Memory.mdr = process.mdr;
            _Memory.mar = process.mar;
        }
        public save(){
            let process = _PCB.checkProcess(this.pid);
            process.instructionRegister = this.instructionRegister;
            process.cyclePhase = this.cyclePhase;
            process.PC = this.PC;
            process.Acc = this.Acc;
            process.Xreg = this.Xreg;
            process.Yreg = this.Yreg;
            process.Zflag = this.Zflag;
            process.decodeStep = this.decodeStep;
            process.executeStep = this.executeStep;
            process.carryFlag = this.carryFlag;
            process.isExecuting = this.isExecuting;
            process.highOrderByte = this.ma.highOrderByte;
            process.lowOrderByte = this.ma.lowOrderByte;
            process.mdr = _Memory.mdr;
            process.mar = _Memory.mar;

            return process;
        }

        public log(message: string){
            console.log(message);
            _StdOut.putText(message);
        }

	    public hexlog(arrayValue, numLength = 2){
			var hexNum : String = arrayValue.toString(16).toUpperCase();

			while(numLength > hexNum.length){
				hexNum = '0' + hexNum;
			}
			return hexNum;
			//console.log(arrayValue.toString(16).substring(0));
		}		


         //initialize cpuClockCount to zero
        cpuClockCount: number = 0;
        public cycle(): void {
            this.cycleTracker += 1
            console.log(this.pid+"CPU Cycling", "PC: "+this.hexlog(this.PC), "ACC: " + this.hexlog(this.Acc), "IR: "+this.hexlog(this.instructionRegister), 
            "YReg: " + this.hexlog(this.Yreg),
            "XReg: " + this.hexlog(this.Xreg),

            )
            _Kernel.krnTrace('CPU cycle');
            this.cpuClockCount += 1;

            if (this.isExecuting == true){
                switch(this.cyclePhase){
                    case(1):
                        this.fetch()
                        break
                    case(2):
                        this.decode();
                        break
                    case(3):
                        this.execute();
                        break
                    case(4):
                        this.writeBack();
                        break
                    case(5):
                        this.interruptCheck();
                        break                         
                }
            }
            
            this.save();
            _PCB.renderProcessTable();
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
        }

        fetch(){
            var temp =  this.ma.processReadImmediate(this.PC);
            console.log("fetched IR is ", temp)
            this.instructionRegister = temp;
            this.cyclePhase = 2;
            this.PC += 1;
        }


        decode(){
            this.cyclePhase = 3; //third cycle 
            switch(this.instructionRegister){
                //1 bit decode
                case(0xA2): //load X register with constant
                case(0xA9): //Load accumulator with a constant 
                case(0xA0): //Load the Y register with a constant
                case(0xD0): //Branch on not equals
    
                    var temp = this.ma.processReadImmediate(this.PC);
                    this.ma.setMdr(temp)
                    this.PC += 1;
                    break
             
                //2 bits
                case(0xAD): //Load accumulator with memory
                case(0x8D): //Store the accumulator with memory
                case(0x6D): //add with carry
                case(0xAE): //load x register from memory
                case(0xAC): //load y register from memory
                case(0xEC): //compare byte in memory to x register
                case(0xEE): //Incriments byte in memory
                    var temp = this.ma.processReadImmediate(this.PC);
                    if (this.decodeStep == 1){
                        console.log('setting low order byte ', temp)
                        this.ma.setLowOrderByte(temp);
                        this.decodeStep += 1;
                        this.cyclePhase = 2;
                    }
                    //second decode step
                    else{
                        console.log('setting high order byte', temp)

                        this.ma.setHighOrderByte(temp);
                        this.decodeStep = 1;
                        this.ma.processCombine();
                    }   
                    this.PC += 1;
                    break
    
                //NO bit decode
                case(0x00): //break
                case(0x8A): //Load accumulator from x register
                case(0x98): //Load accumulator from y register
                case(0xAA): //Load x register from accumulator
                case(0xA8): //Load y register from accumulator
                case(0xEA): //No operation
                case(0xFF): //System Call
                   break
    
                
            }
    
    
        }

        execute(){
            this.cyclePhase = 5;
    
            switch(this.instructionRegister){
                case(0xA9): //Load accumulator with a constant 
                    this.Acc = this.ma.getMdr();
                    break
                case(0xA2): //load X register with constant
                    this.Xreg = this.ma.getMdr();
                    break
                case(0xA0): //Load the Y register with a constant
                    this.Yreg = this.ma.getMdr();
                    break
                case(0xD0): //Branch on not equals
                    if( this.Zflag == false){
    
                        //variable for how far it will jump
                        var distance = this.ma.getMdr()
    
                        //fowards or backwards
                        if (distance < 0x80){
                            this.PC += distance
                            if (this.PC > 0xFF){
                                this.PC = this.PC - 0xFF;
                            }
                        }
                        else
                        {   
                            //represent as a negative number
                            distance = 0x100 - distance;
                            this.PC -= distance                       
                        }
    
                    }
                    break
    
                //2 bits
                case(0xAD): //Load accumulator with memory
                    this.Acc = this.ma.read();
                    break
                case(0x8D): //Store the accumulator with memory
                    this.ma.write(this.Acc);
                    break
                case(0x6D): //add with carry
                    var tempRead = this.ma.read();
    
                    //0x80 = 128
                    if(tempRead < 0x80 && this.Acc < 0x80){
                        this.Acc += tempRead + this.carryFlag;
                        
                        //Overflow
                        if(this.Acc >= 0x80){
                            this.Acc = this.Acc - 0x80;
                            this.carryFlag = 1;
                        }
                        else //if the operation doesn't overflow
                        {
                            this.carryFlag = 0;
                        }
                    }
                    else if(tempRead >= 0x80 && this.Acc >= 0x80) //If both numbers are negative
                    {
                        this.Acc += tempRead + this.carryFlag;
    
                        if(this.Acc >= 0x100){
                            this.Acc = this.Acc - 0x100;
                            this.carryFlag = 1;
                        }
                        else
                        {
                            this.carryFlag = 0;
                        }
                    }
                    else //if its a negative and a positve 
                    {   
                        this.Acc += tempRead + this.carryFlag;
                        if (this.Acc >= 0x100){
                            this.Acc -= 0x100;
    
                        }
                    }
                    break
                case(0xAE): //load x register from memory
                    this.Xreg = this.ma.read();
                    break   
                case(0xAC): //load y register from memory
                    this.Yreg = this.ma.read();
                    break   
                case(0xEC): //compare byte in memory to x register
                    var tempMem = this.ma.read()
    
                    if (tempMem == this.Xreg){
                        this.Zflag = true;
                    }
                    else{
                        this.Zflag = false;
                    }
                    break
                case(0xEE): //Incriments byte in memory 
                    //will need multiple execute step numbers
                    if (this.executeStep == 1){
                        //Set the accumulator to the memory
                        this.Acc = this.ma.read()
                        //incriment execute step and repeat the cycle
                        this.executeStep = 2;
                        this.cyclePhase = 3;
                    }
                    else{
                        this.Acc += 1;
                        if(this.Acc > 0xFF) {
                            this.Acc = 0;
                        }
                        this.cyclePhase = 4;
                        this.executeStep = 1;
                    }
                    break
                //NO bit decode
                //Add break statement to all cases
                case(0x00): //break Need to tell cpu to run the stop function.
                    this.isExecuting = false;
                    break;
               /* case(0x8A): //Load accumulator from x register
                    this.Acc = this.Xreg;
                    break
                */
               /*
                case(0x98): //Load accumulator from y register
                    this.Acc = this.Yreg;
                    break
                case(0xAA): //Load x register from accumulator
                    this.Xreg = this.Acc;
                    break
                case(0xA8): //Load y register from accumulator
                    this.Yreg = this.Acc;
                    break
                */
                case(0xEA): //No operation
                    break
                
                case(0xFF): //System Call
                    
                //If the x register is 1, output the y register
                    if (this.Xreg == 1){
                        this.log(this.hexlog(this.Yreg).toString())
                    }
                    else if (this.Xreg == 2){
                        var CurrYreg = this.Yreg;
                        //read current y register if not 0, then print out with ascii conversion. If it is 0 then stop.
                        while(this.ma.processReadImmediate(CurrYreg) != 0){
                            this.log(this.toAscii(this.ma.processReadImmediate(CurrYreg)))
                            CurrYreg += 1;
                        }
                    }
                    
                    
                    break
    
            }
    
    
        }

        //Writeback function writes what is in the accumulator
    writeBack(){
        this.ma.write(this.Acc);
        //change cycle to 5
        this.cyclePhase = 5;
    }

    interruptCheck(){
        //return cycle back to 1
        this.cyclePhase = 1;
        /*
        //if interrupt list has objects inside, call the start interrupt function
        if(this.interruptController.interrupts.length > 0){
            this.interruptController.startInterrupt();
        }
        */

    }


        


    //List of Ascii items cooresponding to bytes via their index
    library = [ 
        "Null",
        "Start of Heading",
        "SoT",
        "End of Text",
        "End of Transmission",
        "Enquiry",
        "Acknowledgment",
        "Bell",
        "Backspace",
        "Horizontal Tab",
        "Line Feed",
        "Vertical Tab",
        "Form Feed",
        "Carriage Return",
        "Shift Out",
        "Shift In",
        "Data Link Escape",
        "Device Control 1",
        "Device Control 2",
        "Device Control 3",
        "Device Control 4",
        "Negative ACK",
        '"',
        "End of Trans. Block",
        "Cancel",
        "End of Medium",
        "Substitute",
        "Escape",
        "File Separator",
        "Group Separator",
        "Record Separator",
        "Unit Separator",
        " ",
        "!",
        "'",
        "#",
        "$",
        "%",
        "&",
        "'",
        "(",
        ")",
        "*",
        "+",
        ",",
        "-",
        ".",
        "/",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        ":",
        ";",
        "<",
        "=",
        ">",
        "?",
        "@",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        "[",
        "'\'",
        "]",
        "^",
        "_",
        "`",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "{",
        "|",
        "}",
        "~",
        "Del",
    ];
    
    //Converting from Byte to Ascii
    //List should accept the byte which will be the index of the ascii and return the ascii
    toAscii(tempByte: number){

        return this.library[tempByte]

    }

    fromAscii(ascii:String){
        for (let i = 0; i < this.library.length; i++){
            if (this.library[i] == ascii){
                return i
            }
        }
    }


}

}
