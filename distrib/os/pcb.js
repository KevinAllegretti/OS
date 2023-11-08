var TSOS;
(function (TSOS) {
    class Pcb {
        /* keep track of the prcoesses*/
        nextPid = 0;
        processMap = new Map();
        readyQueue = [];
        constructor() { }
        addProcess(startLocation, endLocation) {
            let pid = this.nextPid;
            this.nextPid += 1;
            let process = {
                pid: pid,
                instructionRegister: 0,
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
                startLocation: startLocation,
                endLocation: endLocation,
                priority: 8,
                highOrderByte: 0,
                lowOrderByte: 0,
                mdr: 0,
                mar: 0
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
        readyProcess(pid) {
            let process = this.processMap.get(pid);
            if (process) {
                this.readyQueue.push(process);
            }
        }
        killProcess(pid) {
            function filterPS(process) {
                if (process.pid == pid) {
                    return false;
                }
                return true;
            }
            this.readyQueue = this.readyQueue.filter(filterPS);
            this.processMap.delete(pid);
            _StdOut.putText("Killed process " + pid);
            _StdOut.advanceLine();
        }
        killAll() {
            this.readyQueue = [];
            this.processMap = new Map();
            _CPU.isExecuting = false;
            _StdOut.putText("Killed all processes");
            _StdOut.advanceLine();
        }
        readyAll() {
            let pids = this.processMap.keys();
            for (let pid of pids) {
                let process = this.processMap.get(pid);
                this.readyQueue.push(process);
                _StdOut.putText("Readied " + pid);
                _StdOut.advanceLine();
                _CPU.isExecuting = false;
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
                let priorityCell = row.insertCell(7);
                let stateCell = row.insertCell(8);
                let locationCell = row.insertCell(9);
                pidCell.textContent = process.pid.toString();
                pcCell.textContent = this.hexlog(process.PC);
                irCell.textContent = this.hexlog(process.instructionRegister);
                accCell.textContent = this.hexlog(process.Acc);
                xCell.textContent = this.hexlog(process.Xreg);
                yCell.textContent = this.hexlog(process.Yreg);
                zCell.textContent = process.Zflag ? "1" : "0";
                priorityCell.textContent = process.priority;
                stateCell.textContent = process.isExecuting;
                locationCell.textContent = this.hexlog(process.startLocation);
                ;
            });
            this.renderReadyTable();
        }
        printProcessTable() {
            this.processMap.forEach((process, pid) => {
                _StdOut.putText("#" + process.pid + " - " + process.isExecuting);
                _StdOut.advanceLine();
            });
        }
        renderReadyTable() {
            //console.log("Rendering Process Table");
            //console.log(this.processMap);
            const tableBody = document.getElementById('readyTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = ''; // Clear any existing rows
            for (let i = 0; i < this.readyQueue.length; i++) {
                let process = this.readyQueue[i];
                let row = tableBody.insertRow();
                let pidCell = row.insertCell(0);
                let priorityCell = row.insertCell(1);
                let baseCell = row.insertCell(2);
                let limitCell = row.insertCell(3);
                let segmentCell = row.insertCell(4);
                let stateCell = row.insertCell(5);
                let quantumCell = row.insertCell(6);
                baseCell.textContent = this.hexlog(process.startLocation);
                limitCell.textContent = this.hexlog(process.endLocation);
                segmentCell.textContent = this.hexlog(process.endLocation - process.startLocation);
                quantumCell.textContent = this.hexlog(_Kernel.userQuant);
                pidCell.textContent = process.pid.toString();
                priorityCell.textContent = process.priority;
                stateCell.textContent = process.isExecuting;
            }
        }
    }
    TSOS.Pcb = Pcb;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=pcb.js.map