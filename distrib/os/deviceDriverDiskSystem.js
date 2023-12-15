/* ----------------------------------
   DeviceDriverDiskStystets

   The Kernel Disk System Driver.
   ---------------------------------- */
var TSOS;
(function (TSOS) {
    // Extends DeviceDriver
    class DeviceDriverDiskSystem extends TSOS.DeviceDriver {
        tracks;
        sectors;
        blocks;
        constructor() {
            // Override the base method pointers.
            // The code below cannot run because "this" can only be
            // accessed after calling super.
            // super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            // So instead...
            super();
            this.driverEntry = this.krnDriverEntry;
            this.tracks = 4;
            this.sectors = 8;
            this.blocks = 8;
        }
        krnDriverEntry() {
            // Initialization routine for this, the kernel-mode disk system.
            this.status = "loaded";
            // More?
        }
        hexlog(arrayValue, numLength = 2) {
            var hexNum = arrayValue.toString(16).toUpperCase();
            while (numLength > hexNum.length) {
                hexNum = '0' + hexNum;
            }
            return hexNum;
            //console.log(arrayValue.toString(16).substring(0));
        }
        format() {
            for (let t = 0; t < this.tracks; t++) {
                for (let s = 0; s < this.sectors; s++) {
                    for (let b = 0; b < this.blocks; b++) {
                        let name = "" + t + ":" + s + ":" + b;
                        let data = [];
                        for (let i = 0; i < 64; i++) {
                            data.push(0x00);
                        }
                        sessionStorage.setItem(name, data.join("-"));
                    }
                }
            }
            this.renderDisk();
        }
        findFreeBlock(startingTrack) {
            for (let t = startingTrack; t < this.tracks; t++) {
                for (let s = 0; s < this.sectors; s++) {
                    for (let b = 0; b < this.blocks; b++) {
                        let name = "" + t + ":" + s + ":" + b;
                        if (name == "0:0:0") {
                            continue;
                        }
                        let saved = sessionStorage.getItem(name);
                        if (saved == null) {
                            continue;
                        }
                        let data = saved.split("-");
                        if (parseInt(data[60]) == 0) {
                            return name;
                        }
                    }
                }
            }
            return null;
        }
        findFileLocation(filename) {
            for (let s = 0; s < this.sectors; s++) {
                for (let b = 0; b < this.blocks; b++) {
                    let location = "0:" + s + ":" + b;
                    if (location == "0:0:0") {
                        continue;
                    }
                    let saved = sessionStorage.getItem(location);
                    if (saved == null) {
                        continue;
                    }
                    let data = saved.split("-");
                    let nameMatched = true;
                    for (let i = 0; i < filename.length; i++) {
                        let c = _CPU.fromAscii(filename.charAt(i));
                        if (c == parseInt(data[i])) {
                            // letter is matching
                        }
                        else {
                            // letter is not matching, kill test
                            nameMatched = false;
                        }
                    }
                    if (nameMatched == true) {
                        return location;
                    }
                }
            }
            return null;
        }
        create(filename) {
            var headerData = [];
            for (let i = 0; i < 64; i++) {
                headerData[i] = 0;
            }
            for (let i = 0; i < filename.length; i++) {
                headerData[i] = _CPU.fromAscii(filename.charAt(i));
            }
            headerData[60] = 1;
            var headerName = this.findFreeBlock(0);
            var contentName = this.findFreeBlock(1);
            headerData[61] = parseInt(contentName.charAt(0));
            headerData[62] = parseInt(contentName.charAt(2));
            headerData[63] = parseInt(contentName.charAt(4));
            var contentData = [];
            for (let i = 0; i < 64; i++) {
                contentData[i] = 0;
            }
            contentData[60] = 1;
            sessionStorage.setItem(headerName, headerData.join("-"));
            sessionStorage.setItem(contentName, contentData.join("-"));
        }
        write(filename, input) {
            let fileLocation = this.findFileLocation(filename);
            if (!fileLocation) {
                // add STD output here 
                console.log("Bad file name");
                return;
            }
            let headerString = sessionStorage.getItem(fileLocation);
            if (!headerString) {
                console.log("NO header data");
                return;
            }
            let headerData = headerString.split("-");
            let nextTrack = (headerData[61]);
            let nextSect = (headerData[62]);
            let nextBlock = (headerData[63]);
            let firstContentLocation = "" + nextTrack + ":" + nextSect + ":" + nextBlock;
            let contentLocation = firstContentLocation;
            let content = [];
            for (let i = 0; i < 64; i++) {
                content.push(0);
            }
            content[60] = 1;
            let nextByteSlot = 0;
            while (input.length > 0) {
                //console.log(input);
                let char = _CPU.fromAscii(input.charAt(0));
                input = input.substring(1);
                content[nextByteSlot] = char;
                nextByteSlot++;
                if (nextByteSlot == 60) {
                    var nextBlockLocation = this.findFreeBlock(1);
                    content[61] = parseInt(nextBlockLocation.charAt(0));
                    content[62] = parseInt(nextBlockLocation.charAt(2));
                    content[63] = parseInt(nextBlockLocation.charAt(4));
                    sessionStorage.setItem(contentLocation, content.join("-"));
                    // refreshing content
                    content = [];
                    for (let i = 0; i < 64; i++) {
                        content.push(0);
                    }
                    content[60] = 1;
                    sessionStorage.setItem(nextBlockLocation, content.join("-"));
                    nextByteSlot = 0;
                    contentLocation = nextBlockLocation;
                }
            }
            sessionStorage.setItem(contentLocation, content.join("-"));
        }
        read(filename) {
            let fileLocation = this.findFileLocation(filename);
            if (!fileLocation) {
                // add STD output here 
                console.log("Bad file name");
                return;
            }
            let headerString = sessionStorage.getItem(fileLocation);
            if (!headerString) {
                console.log("NO header data");
                return;
            }
            let headerData = headerString.split("-");
            let nextTrack = (headerData[61]);
            let nextSect = (headerData[62]);
            let nextBlock = (headerData[63]);
            let firstContentLocation = "" + nextTrack + ":" + nextSect + ":" + nextBlock;
            let contentLocation = firstContentLocation;
            let contentData = sessionStorage.getItem(contentLocation).split("-");
            let nextByteSlot = 0;
            while (parseInt(contentData[nextByteSlot]) != 0) {
                let char = parseInt(contentData[nextByteSlot]);
                let ascii = _CPU.toAscii(char);
                _StdOut.putText(ascii);
                nextByteSlot++;
                if (nextByteSlot == 60) {
                    nextTrack = (contentData[61]);
                    nextSect = (contentData[62]);
                    nextBlock = (contentData[63]);
                    let nextLocation = "" + nextTrack + ":" + nextSect + ":" + nextBlock;
                    if (nextLocation != "0:0:0") {
                        contentData = sessionStorage.getItem(nextLocation).split("-");
                        nextByteSlot = 0;
                        contentLocation = nextLocation;
                    }
                }
            }
        }
        returnRead(filename) {
            let message = "";
            let fileLocation = this.findFileLocation(filename);
            if (!fileLocation) {
                // add STD output here 
                console.log("Bad file name");
                return;
            }
            let headerString = sessionStorage.getItem(fileLocation);
            if (!headerString) {
                console.log("NO header data");
                return;
            }
            let headerData = headerString.split("-");
            let nextTrack = (headerData[61]);
            let nextSect = (headerData[62]);
            let nextBlock = (headerData[63]);
            let firstContentLocation = "" + nextTrack + ":" + nextSect + ":" + nextBlock;
            let contentLocation = firstContentLocation;
            let contentData = sessionStorage.getItem(contentLocation).split("-");
            let nextByteSlot = 0;
            while (parseInt(contentData[nextByteSlot]) != 0) {
                let char = parseInt(contentData[nextByteSlot]);
                let ascii = _CPU.toAscii(char);
                message += ascii;
                nextByteSlot++;
                if (nextByteSlot == 60) {
                    nextTrack = (contentData[61]);
                    nextSect = (contentData[62]);
                    nextBlock = (contentData[63]);
                    let nextLocation = "" + nextTrack + ":" + nextSect + ":" + nextBlock;
                    if (nextLocation != "0:0:0") {
                        contentData = sessionStorage.getItem(nextLocation).split("-");
                        nextByteSlot = 0;
                        contentLocation = nextLocation;
                    }
                }
            }
            return message;
        }
        delete(filename) {
            let fileLocation = this.findFileLocation(filename);
            if (!fileLocation) {
                // add STD output here 
                console.log("Bad file name");
                return;
            }
            let headerString = sessionStorage.getItem(fileLocation);
            if (!headerString) {
                console.log("NO header data");
                return;
            }
            let headerData = headerString.split("-");
            let nextTrack = (headerData[61]);
            let nextSect = (headerData[62]);
            let nextBlock = (headerData[63]);
            headerData[60] = "0";
            sessionStorage.setItem(fileLocation, headerData.join("-"));
            let firstContentLocation = "" + nextTrack + ":" + nextSect + ":" + nextBlock;
            let contentLocation = firstContentLocation;
            let contentData = sessionStorage.getItem(contentLocation).split("-");
            let nextByteSlot = 0;
            while (parseInt(contentData[nextByteSlot]) != 0) {
                nextByteSlot++;
                if (nextByteSlot == 60 || parseInt(contentData[nextByteSlot]) == 0) {
                    nextTrack = (contentData[61]);
                    nextSect = (contentData[62]);
                    nextBlock = (contentData[63]);
                    contentData[60] = "0";
                    sessionStorage.setItem(contentLocation, contentData.join("-"));
                    let nextLocation = "" + nextTrack + ":" + nextSect + ":" + nextBlock;
                    contentData = sessionStorage.getItem(nextLocation).split("-");
                    nextByteSlot = 0;
                    contentLocation = nextLocation;
                }
            }
        }
        list() {
            for (let t = 0; t < 1; t++) {
                for (let s = 0; s < this.sectors; s++) {
                    for (let b = 0; b < this.blocks; b++) {
                        let name = "" + t + ":" + s + ":" + b;
                        if (name == "0:0:0") {
                            continue;
                        }
                        let saved = sessionStorage.getItem(name);
                        if (saved == null) {
                            continue;
                        }
                        let data = saved.split("-");
                        if (parseInt(data[60]) == 1) {
                            let name = "";
                            for (let n = 0; n < data.length && parseInt(data[n]) != 0; n++) {
                                name += _CPU.toAscii(parseInt(data[n]));
                            }
                            _StdOut.putText(name);
                            _StdOut.advanceLine();
                        }
                    }
                }
            }
        }
        copy(oldFilename, newFilename) {
            let oldFileContent = this.returnRead(oldFilename);
            this.create(newFilename);
            this.write(newFilename, oldFileContent);
        }
        rename(oldFilename, newFilename) {
            let oldFileContent = this.returnRead(oldFilename);
            this.delete(oldFilename);
            this.create(newFilename);
            this.write(newFilename, oldFileContent);
        }
        renderDisk() {
            //console.log(this.memoryArray)
            //iterate through memory array.
            let table = document.getElementById('diskTable');
            table.innerHTML = '';
            for (let t = 0; t < this.tracks; t++) {
                for (let s = 0; s < this.sectors; s++) {
                    for (let b = 0; b < this.blocks; b++) {
                        let name = "" + t + ":" + s + ":" + b;
                        let saved = sessionStorage.getItem(name);
                        if (saved == null) {
                            return;
                        }
                        let data = saved.split("-");
                        let row = document.createElement('tr');
                        let nameCell = document.createElement('td');
                        nameCell.innerText = name;
                        row.appendChild(nameCell);
                        let usedCell = document.createElement('td');
                        usedCell.innerText = (data[60] == "1").toString();
                        row.appendChild(usedCell);
                        let nextCell = document.createElement('td');
                        let nextTrack = (data[61]);
                        let nextSect = (data[62]);
                        let nextBlock = (data[63]);
                        nextCell.innerText = nextTrack + ":" + nextSect + ":" + nextBlock;
                        if (nextCell.innerText == "0:0:0") {
                            nextCell.innerText = "F:F:F";
                        }
                        row.appendChild(nextCell);
                        let dataCell = document.createElement('td');
                        dataCell.innerText = "";
                        for (let stringedByte of data) {
                            var hexString = this.hexlog(parseInt(stringedByte), 2);
                            dataCell.innerText += hexString;
                        }
                        row.appendChild(dataCell);
                        table.appendChild(row);
                    }
                }
            }
        }
    }
    TSOS.DeviceDriverDiskSystem = DeviceDriverDiskSystem;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=deviceDriverDiskSystem.js.map