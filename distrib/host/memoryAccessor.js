var TSOS;
(function (TSOS) {
    class MemoryAccessor {
        lowOrderByte = null;
        highOrderByte = null;
        constructor(id, name) {
            //Populate the array
            _Memory.initializeArray();
            //Write out all of the instructions passed into write immediate to load into memory
            this.writeImmediate(0x0000, 0xA9);
            this.writeImmediate(0x0001, 0x0D);
            this.writeImmediate(0x0002, 0xA9);
            this.writeImmediate(0x0003, 0x1D);
            this.writeImmediate(0x0004, 0xA9);
            this.writeImmediate(0x0005, 0x2D);
            this.writeImmediate(0x0006, 0xA9);
            this.writeImmediate(0x0007, 0x3F);
            this.writeImmediate(0x0008, 0xA9);
            this.writeImmediate(0x0009, 0xFF);
            this.writeImmediate(0x000A, 0x00);
            this.writeImmediate(0x000B, 0x00);
            this.writeImmediate(0x000C, 0x00);
            this.writeImmediate(0x000D, 0x00);
            this.writeImmediate(0x000E, 0x00);
            this.writeImmediate(0x000F, 0x00);
            // this.writeImmediate(0x0000, 0xAD);
            // this.writeImmediate(0x0001, 0x04);
            // this.writeImmediate(0x0002, 0x00);
            // this.writeImmediate(0x0003, 0x00);
            // this.writeImmediate(0x0004, 0x07);
            //call the memory dump with the first address and last address
            //this.memoryDump(0x0000, 0x000F);
        }
        //Need to differentiate the low order byte and high order byte to complete little endian
        //Create low order byte set function 
        setLowOrderByte(lowNum) {
            this.lowOrderByte = lowNum;
        }
        //Create high order byte set function
        setHighOrderByte(highNum) {
            this.highOrderByte = highNum;
        }
        //Create a funciton to combine the two order bytes
        combine() {
            //Display the bytes and store in a variable so it can be passed to memory.
            var Result = this.hexlog(this.highOrderByte) + '' + this.hexlog(this.lowOrderByte);
            console.log("COMBINE RESULT: ", this.hexlog(Result));
            //Convert Result to a number from string, pass through to memory.
            _Memory.setMar(parseInt(Result, 16));
        }
        //read function to return the mdr
        read() {
            _Memory.read();
            return _Memory.getMdr();
        }
        write(newData) {
            //Set mdr to the new data
            console.log("WRITING", this.hexlog(newData), 'TO ', this.hexlog(_Memory.getMar()));
            _Memory.setMdr(newData);
            //implementing new data into memory
            _Memory.write();
        }
        setMdr(Data) {
            _Memory.setMdr(Data);
        }
        getMdr() {
            return _Memory.getMdr();
        }
        //Create write immediate funciton to in order to load instruciton sets or "static" programs
        writeImmediate(Address, Data) {
            //Pass the address to Mar
            _Memory.setMar(Address);
            //Pass the data to Mdr
            _Memory.setMdr(Data);
            //Write the instruciton into memory.
            _Memory.write();
        }
        readImmediate(Address) {
            _Memory.setMar(Address);
            _Memory.read();
            //return the data found at address
            return _Memory.getMdr();
        }
        hexlog(arrayValue, numLength = 2) {
            var hexNum = arrayValue.toString(16).toUpperCase();
            while (numLength > hexNum.length) {
                hexNum = '0' + hexNum;
            }
            return hexNum;
            //console.log(arrayValue.toString(16).substring(0));
        }
    }
    TSOS.MemoryAccessor = MemoryAccessor;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=memoryAccessor.js.map