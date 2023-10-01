var TSOS;
(function (TSOS) {
    class Pcb {
        /* keep track of the prcoesses*/
        nextPid = 0;
        processMap = new Map();
        constructor() { }
        addProcess(startLocation) {
            let pid = this.nextPid;
            this.nextPid += 1;
            let process = {
                pid: pid,
                instructionRegister: startLocation,
                cyclePhase: 1,
                PC: 0,
                Acc: 0,
                Xreg: 0,
                Yreg: 0,
                Zflag: false,
                decodeStep: 1,
                executeStep: 1,
                carryFlag: 0,
                isExecuting: false,
            };
            this.processMap.set(pid, process);
            return pid;
        }
        checkProcess(pid) {
            let process = this.processMap.get(pid);
            if (process) {
                return process;
            }
            else {
                return null;
            }
        }
    }
    TSOS.Pcb = Pcb;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=pcb.js.map