module TSOS {
    export class Memory {

    private mar: number = 0x0000;
    private mdr: number = 0x00;


    //keep variables up top
    //Declare array
    memoryArray: number[] = new Array(0xFF * 4);
    
    //initialize array 
    public initializeArray(){
        //for loop push hex into
        for (let i: number = 0x0000; i < 0xFF * 4; i++){      
            this.memoryArray[i] = 0x00;
        }
    }
    
    displayMemory(){
        //console.log(this.memoryArray)
        //iterate through memory array.
        let table = document.getElementById('memorytable')
        table.innerHTML = ''
        for (let i: number = 0x00; i < 0xFF * 4; i += 8){
            let row = document.createElement('tr');
            let header = document.createElement('td');
            header.innerText = this.hexlog(i,4)
            row.appendChild(header);


            for (let k = 0; k < 8; k++){
                let position = (i) + k
                if (position < 0xFF *4){
                    let cell = document.createElement('td');
                    cell.innerText = this.hexlog(this.memoryArray[position],2)
                    row.appendChild(cell);
                }
            }



            table.appendChild(row);
        }
    }
    
    //part d, another edit to this, augment it so it can be any area of memory to display

    //pulse function
    pusle(){
        console.log("Received clock pulse");
    }

    reset(){
        for (let i: number = 0x0000; i < 0xFFFF; i++){   

            this.memoryArray[i] = 0x0;
        }
    }

    public hexlog(arrayValue, numLength = 2){
        var hexNum : string = arrayValue.toString(16).toUpperCase();

        while(numLength > hexNum.length){
            hexNum = '0' + hexNum;
        }
        return hexNum;
        //console.log(arrayValue.toString(16).substring(0));
    }		


    //setting the memory address register to a 16 bit address
    //Address = 0x0000;
    public setMar(mar: number){
        this.mar = mar;
    }

    //funciton that returns the memory address register
    public getMar(){
        return this.mar;
    }

    //setting the memory data register to a 8 bit data instruction
    //Data = 0x00;
    public setMdr(mdr: number){
        this.mdr = mdr;
    }

    //function that returns the memory data register
    public getMdr(){
        return this.mdr;
    }

       //read memory location in the MAR and update the MDR
    read(){
        this.mdr = this.memoryArray[this.mar];
    }
    //write the contents of the MDR to memory at the location indiciated by the MAR
    write(){
        this.memoryArray[this.mar] = this.mdr;
        this.displayMemory()
    }


}
    }
