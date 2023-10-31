var TSOS;
(function (TSOS) {
    class MemoryManager {
        nextProcessByte = 0;
        constructor() {
            this.nextProcessByte = 0;
        }
        isMemoryAllocated(address) {
            // Ensure the address is within valid range
            if (address < 0x0000 || address > _Memory.memoryArray.length) {
                console.error("Invalid memory address!");
                return false;
            }
            // Check if the memory at the given address is not zero
            return _Memory.memoryArray[address] !== 0x00;
        }
    }
    TSOS.MemoryManager = MemoryManager;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryManager.js.map