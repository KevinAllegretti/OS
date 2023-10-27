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
        saveProcess(pid, data) {
            this.processMap.set(pid, data);
        }
        hexlog(arrayValue, numLength = 2) {
            var hexNum = arrayValue.toString(16).toUpperCase();
            while (numLength > hexNum.length) {
                hexNum = '0' + hexNum;
            }
            return hexNum;
            //console.log(arrayValue.toString(16).substring(0));
        }
        renderProcessTable() {
            //console.log("Rendering Process Table");
            //console.log(this.processMap);
            const tableBody = document.getElementById('processTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = ''; // Clear any existing rows
            this.processMap.forEach((process, pid) => {
                let row = tableBody.insertRow();
                let pidCell = row.insertCell(0);
                let pcCell = row.insertCell(1);
                let irCell = row.insertCell(2);
                let accCell = row.insertCell(3);
                let xCell = row.insertCell(4);
                let yCell = row.insertCell(5);
                let zCell = row.insertCell(6);
                pidCell.textContent = process.pid.toString();
                pcCell.textContent = this.hexlog(process.PC);
                irCell.textContent = this.hexlog(process.instructionRegister);
                accCell.textContent = this.hexlog(process.Acc);
                xCell.textContent = this.hexlog(process.Xreg);
                yCell.textContent = this.hexlog(process.Yreg);
                zCell.textContent = process.Zflag ? "1" : "0";
            });
        }
    }
    TSOS.Pcb = Pcb;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=pcb.js.map