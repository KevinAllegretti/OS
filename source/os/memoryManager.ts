module TSOS {
    export class MemoryManager {
    public nextProcessByte = 0;

    constructor(){
        this.nextProcessByte = 0;
    }
    
    public isMemoryAllocated(address: number): boolean {
        // Ensure the address is within valid range
        if (address < 0x0000 || address > _Memory.memoryArray.length) {
        console.error("Invalid memory address!");
        return false;
        }
        // Check if the memory at the given address is not zero
        return _Memory.memoryArray[address] !== 0x00;
    }
    
    public clearMemory(){
        _Memory.initializeArray();
        _StdOut.putText("Cleared memory");
        _StdOut.advanceLine();
    }
    
    }
}    
    
    