module TSOS {
    export class  Pcb {
        /* keep track of the prcoesses*/
        public nextPid: number = 0
        public processMap = new Map();

        public readyQueue = [];

        constructor() {}

        public addProcess(startLocation: number,endLocation:number){
            let pid: Number = this.nextPid;
            this.nextPid +=1;
            let process = {
                pid: pid,
                instructionRegister : 0,
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
                startLocation: startLocation,
                endLocation: endLocation,
                priority: 8,

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

       public readyProcess(pid: number){
        let process = this.processMap.get(pid);
        if (process){
            this.readyQueue.push(process);
        }
       }

       public readyAll(){
        let pids = this.processMap.keys();
        for (let pid of pids){
            let process = this.processMap.get(pid);
            this.readyQueue.push(process);
            _StdOut.putText("Readied "+pid);
            _StdOut.advanceLine();


        }
       }

       public saveProcess(pid:number,data){
        this.processMap.set(pid,data);
       }

       public hexlog(arrayValue, numLength = 2){
        var hexNum : string = arrayValue.toString(16).toUpperCase();

        while(numLength > hexNum.length){
            hexNum = '0' + hexNum;
        }
        return hexNum;
        //console.log(arrayValue.toString(16).substring(0));
        }		
    
        public renderProcessTable() {
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
    locationCell.textContent = this.hexlog(process.startLocation);;
    });
        }
    
    
    }
}
