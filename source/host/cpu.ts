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

        constructor(public instructionRegister: number = 0, 
                    public cyclePhase: number = 1,
                    public mmu: Mmu = null,
                    public PC: number = 0,
                    public Acc: number = 0,
                    public Xreg: number = 0,
                    public Yreg: number = 0,
                    public Zflag: boolean = false,
                    public decodeStep: number = 1,
                    public executeStep: number = 1,
                    public carryFlag: number = 0,
                    public isExecuting: boolean = false) {

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
        }

         //initialize cpuClockCount to zero
        cpuClockCount: number = 0;
        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            this.cpuClockCount += 1;
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
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
        }

        fetch(){
            var temp =  this.mmu.readImmediate(this.PC);
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
    
                    var temp = this.mmu.readImmediate(this.PC);
                    this.mmu.setMdr(temp)
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
                    var temp = this.mmu.readImmediate(this.PC);
                    if (this.decodeStep == 1){
                        this.mmu.setLowOrderByte(temp);
                        this.decodeStep += 1;
                        this.cyclePhase = 2;
                    }
                    //second decode step
                    else{
                        this.mmu.setHighOrderByte(temp);
                        this.decodeStep = 1;
                       // this.mmu.combine();
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
                    this.Acc = this.mmu.getMdr();
                    break
                case(0xA2): //load X register with constant
                    this.Xreg = this.mmu.getMdr();
                    break
                case(0xA0): //Load the Y register with a constant
                    this.Yreg = this.mmu.getMdr();
                    break
                case(0xD0): //Branch on not equals
                    if( this.Zflag == false){
    
                        //variable for how far it will jump
                        var distance = this.mmu.getMdr()
    
                        //fowards or backwards
                        if (distance < 0x80){
                            this.PC += distance
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
                    this.Acc = this.mmu.read();
                    break
                case(0x8D): //Store the accumulator with memory
                    this.mmu.write(this.Acc);
                    break
                case(0x6D): //add with carry
                    var tempRead = this.mmu.read();
    
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
                    this.Xreg = this.mmu.read();
                    break   
                case(0xAC): //load y register from memory
                    this.Yreg = this.mmu.read();
                    break   
                case(0xEC): //compare byte in memory to x register
                    var tempMem = this.mmu.read()
    
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
                        this.Acc = this.mmu.read()
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
                case(0x8A): //Load accumulator from x register
                    this.Acc = this.Xreg;
                    break
                case(0x98): //Load accumulator from y register
                    this.Acc = this.Yreg;
                    break
                case(0xAA): //Load x register from accumulator
                    this.Xreg = this.Acc;
                    break
                case(0xA8): //Load y register from accumulator
                    this.Yreg = this.Acc;
                    break
                case(0xEA): //No operation
                    break
                /*
                case(0xFF): //System Call
                    
                //If the x register is 1, output the y register
                    if (this.Xregister == 1){
                        this.hexlog(this.Yregister)
    
                    }
                    else if (this.Xregister == 2){
                        var CurrYreg = this.Yregister;
                        //read current y register if not 0, then print out with ascii conversion. If it is 0 then stop.
                        while(this.mmu.readImmediate(CurrYreg) != 0){
                            this.log(this.ascii.toAscii(this.mmu.readImmediate(CurrYreg)))
                            CurrYreg += 1;
                        }
                    }
                    else if(this.Xregister == 3){
                        //Draw out memory location..
                        //hexlog to concatenate
                        var LOB = this.hexlog(this.mmu.readImmediate(this.programCounter))
                        this.programCounter += 1;
    
                        //hob always after lob
                        var HOB = this.hexlog(this.mmu.readImmediate(this.programCounter))
                        //incriment program couunter
                        this.programCounter += 1;
    
                        //combine HOB and LOB with parseInt
                        var combineBytes = this.hexlog(HOB) + '' + this.hexlog(LOB);
                        var combineTwo = parseInt(combineBytes);
    
                        //Print out the HOB and LOB with ascii conversion while the location is not 0
                        while(this.mmu.readImmediate(combineTwo) != 0){
    
                            this.log(this.ascii.toAscii(this.mmu.readImmediate(combineTwo)))
                            combineTwo += 1;
                        }

    
                    }
                    */
                    break
    
            }
    
    
        }

        //Writeback function writes what is in the accumulator
    writeBack(){
        this.mmu.write(this.Acc);
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


        

}

}
