var TSOS;
(function (TSOS) {
    class MemoryManager {
        memory = new TSOS.Memory();
        isMemoryAllocated(address) {
            // Ensure the address is within valid range
            if (address < 0x0000 || address > 0xFFFF) {
                console.error("Invalid memory address!");
                return false;
            }
            // Check if the memory at the given address is not zero
            return this.memory.memoryArray[address] !== 0x00;
        }
        checkMemoryStatus(address) {
            if (this.isMemoryAllocated(address)) {
                console.log(`Memory is allocated at address ${address.toString(16)}`);
            }
            else {
                console.log(`Memory is not allocated at address ${address.toString(16)}`);
            }
        }
    }
    TSOS.MemoryManager = MemoryManager;
})(TSOS || (TSOS = {}));
// Usage:
let memManager = new TSOS.MemoryManager();
memManager.checkMemoryStatus(0x0001);
//# sourceMappingURL=memoryManager.js.map