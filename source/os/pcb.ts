module TSOS {
    export class  Pcb {
        /* keep track of the prcoesses*/
        public nextPid: number = 0
        public processMap = new Map();

        constructor() {}

        public addProcess(startLocation: number){
            let pid: Number = this.nextPid;
            this.nextPid +=1;
            let process = {
                pid: pid,
                instructionRegister : startLocation,
                cyclePhase : 1,
                PC : 0,
                Acc : 0,
                Xreg : 0,
                Yreg : 0,
                Zflag : false,
                decodeStep : 1,
                executeStep : 1,
                carryFlag : 0,
                isExecuting : false,

            }

            this.processMap.set(pid, process)

            return pid;


        }

       public checkProcess(pid: number){
        let process = this.processMap.get(pid);
        if (process){
            return process;
        }
        else{
            return null;
        }

       }
    }
}
