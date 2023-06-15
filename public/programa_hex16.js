"use strict"

class numBytesError extends Error {
    constructor(lnum) {
        super();
        this.message = `El número de bytes de instrucción en la línea ${lnum} es incorrectol.`;
        this.name = "numBytesError";
    }
}

class counterError extends Error {
    constructor(lnum) {
        super();
        this.message = `El aumento en el contador de localidades de la línea ${lnum} no coincide`;
        this.name = "counterError";
    }
}

class undefinedInstruction extends Error {
    constructor(opCode) {
        super();
        this.message = `La instrucción con código de operación ${opCode} no existe`;
        this.name = "UndefinedInstructionError";
    }
}

class checkSumRangeError extends Error {
    constructor(lnum) {
        super();
        this.message = `La checksum no coincide en la línea: ${lnum}`;
        this.name = "sumRangeError";
    }
}

class paddingError extends Error {
    constructor(lnum) {
        super();
        this.message = `El padding en la línea ${lnum} es inválido.`;
        this.name = "paddingError";
    }
}

class programHex {
    // Se guardará la traducción de hexadecimal a mnemónicos
    constructor(PC) {
        this.bytes = [];
        this.asmCode = [];
        this.hexCode = [];
        this.CL;
        this.org;
    }

    ValQQ = { 3: "AF", 2: "HL", 1: "DE", 0: "BC" };
    ValR = { 0: "B", 1: "C", 2: "D", 3: "E", 4: "H", 5: "L", 6: "(HL)", 7: "A" };
    ValSS = { 3: "SP", 2: "HL", 1: "DE", 0: "BC" }; // Igual que DD
    ValPP = { 3: "SP", 2: "IX", 1: "DE", 0: "BC" };
    ValRR = { 3: "SP", 2: "IY", 1: "DE", 0: "BC" };
    ValB = { 0:0, 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 7:7 };
    ValCC = { 7:"M", 6:"P", 5:"PE", 4:"PO", 3:"C", 2:"NC", 1:"Z", 0:"NZ" };
    ValP = { 7: "38", 6: "30", 5: "28", 4: "20", 3: "18", 2: "10", 1: "08", 0: "00" };
    getElements(hexLine, lnum) {
        /*
            Función encargada de separar los elementos de una línea del archivo HEX. 
            La separación se dará de la manera siguiente:

            1.- Se eliminarán los ":" iniciales
            2.- Se tomarán los primeros dos bytes (que representan el número de bytes en instrucciones)
            3.- Se tomará la posición inicial de memoria
            4.- Se eliminará el padding
            5.- Se irán traduciendo las respectivas instrucciones a mnemonicos
            6.- Se tomarán los últimos 2 bytes que validan el checkSum

            NOTA: Verificar hasta tener la última línea de código:
                ":00000001FF"
        */ 
        // hexLine es una string que contiene una línea del archivo HEX

        // Primero validaremos que la línea sea una línea posible de código objeto:

        if(!this.checkGeneralSintax(hexLine)) { return -1; } // Error en sintaxis de línea de código
        // Revisamos si se trata de la línea terminal
        if (hexLine === ":00000001FF") {
            return 1; 
        } // Se terminó la traducción
        // Se procede a separar por partes la línea hexadecimal (validando parte por parte)
        hexLine = hexLine.replace(":","");
        let numBytes = hexLine.slice(0,2);
        let PC = hexLine.slice(2,6);
        let padding = hexLine.slice(6,8);
        let opCodes = hexLine.slice(8,8 + parseInt(numBytes,16)*2);
        let checkSum = hexLine.slice(8 + parseInt(numBytes,16)*2);
        let bytes = this.getBytes(opCodes);
        // Validamos que el número de bytes sea correcto
        if (!this.checkBytesRange(numBytes)) { throw new numBytesError(lnum) };
        // Se realiza la validación del CL
        if (!this.checkCL(PC,lnum,numBytes)) { throw new counterError(lnum) };
        // Se realiza el validador del padding
        if (checkSum.length !== 2) { throw new checkSumRangeError(lnum) };
        // Validamos que la checksum esté en un rango válido
        if (padding !== "00") { throw new paddingError(lnum) };
        // Se validan los códigos operacionales
        this.bytes = this.bytes.concat(bytes)
    }

    // Función que nos permite determinar si la línea puede ser válida o no
    checkGeneralSintax(hexLine) {
        let regExpSintax = /^\:[0-9A-F]+$/i;
        if (regExpSintax.test(hexLine)) {
            if (hexLine.length <= 43 && hexLine.length >= 9) {
                return true
            }
        }
        return false;
    }

    // Función para determinar que el rango de bytes sea correcto
    checkBytesRange(numBytes) {
        let number = parseInt(numBytes,16);
        if (number >= 0 && number <= 16) {return true };
        return false;
    }

    // Función para validar que el contador de localidades esté corecto
    checkCL(PC,lnum,numBytes) {
        if (lnum === 0) {
            // Se asigna la ubicación a partir de la cual se va a cargar el programa
            this.CL = parseInt(PC,16);
            this.CL += parseInt(numBytes,16);
            this.org = parseInt(PC,16);
        } else {
            // Verificr que la nueva línea vaya conforme al contador de localidades
            if (this.decimalToHex(this.CL,4).toUpperCase() === PC) {
                this.CL += parseInt(numBytes,16);
            }
            else { return false };
        }
        return true;
    }

    // Función para determinar el mnemónico del código operacional
    translate(bytes) {
        // Por cada código de operación, tendremos un discriminante, el cual será el primer elemento
        while(bytes.length != 0) {
            console.log(bytes);
            this.checkMnemonics(bytes.shift(),bytes);
        }
    }

    // Función para obtener los bytes individuales para los códigos operacionales
    getBytes(opCodes) {
        let bytes = []; // Tendremos los pares de bytes disponibles
        opCodes = opCodes.split("");
        // Ver con función bytes.map()
        for (let i = 0; i < opCodes.length; i++) {
            if (i % 2 != 0) {
                bytes.push(`${opCodes[i-1]}${opCodes[i]}`);
            }
        }
        return bytes;
        // En este punto, bytes contiene todos los pares de bytes para evaluar las instrucciones
    }

    checkMnemonics(moreSignificant,bytes) {
        switch(true) {
            // Primero analizaremos los inmediatos
            case /^00$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("NOP");
                break;
            //DEC ss
            case /^[0123]B$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`DEC ${this.getOperand(moreSignificant, [2, 4], this.ValSS)}`);
                break;
            //INC ss
            case /^[0123]3$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`INC ${this.getOperand(moreSignificant, [2, 4], this.ValSS)}`);
                break;
            //ADD HL,ss
            case /^[0123]9$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`ADD HL,${this.getOperand(moreSignificant, [2, 4], this.ValSS)}`);
                break;
            case /^37$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("SCF");
                break;
            // JP nn
            case /^C3$/.test(moreSignificant):
                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                this.asmCode.push(`JP ${bytes[1]}${bytes[0]}H`);
                this.removeNumBytes(2,bytes);
                break;
            // JP cc, nn
            case /^11[01][01][01]010$/.test(this.decimalToBin(parseInt(moreSignificant,16),8)):
                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                this.asmCode.push(`JP ${this.getOperand(moreSignificant,[2,5],this.ValCC)},${bytes[1]}${bytes[0]}`);
                this.removeNumBytes(2,bytes);
                break;
            //EX AF, AF`
            case /^08$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("EX AF,AF'");
                break;
            //EX DE, HL
            case /^EB$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("EX DE,HL");
                break;
            //EX (SP), HL
            case/^E3$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("EX (SP),HL");
                break;
            //EXX
            case/^D9$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("EXX");
                break;
            //LD A, (BC)
            case/^0A$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("LD A,(BC)");
                break;
            //LD A, (DE)
            case/^1A$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("LD A,(DE)");
                break;
            //LD (BC), A
            case/^02$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("LD (BC),A");
                break;
            //LD (DE), A
            case/^12$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("LD (DE),A");
                break;
            //LD SP, HL
            case/^F9$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("LD SP,HL");
                break;
            //CPL
            case/^2F$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("CPL");
                break;
            //JP (HL)
            case/^E9$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("JP (HL)");
                break;
            case /^ED$/.test(moreSignificant):
                switch(true) {
                    // Seguir analizando otros posibles casos
                    case /^67$/.test(bytes[0]):
                        this.hexCode.push("ED67");
                        this.asmCode.push("RRD");
                        this.removeNumBytes(1,bytes);
                        break;
                    case /^6F$/.test(bytes[0]):
                        this.hexCode.push("ED6F");
                        this.asmCode.push("RLD");
                        this.removeNumBytes(1,bytes);
                        break;
                    case /^44$/.test(bytes[0]):
                        this.hecCode.push("ED44");
                        this.asmCode.push("NEG");
                        this.removeNumBytes(1,bytes);
                    case /^45$/.test(bytes[0]):
                        this.hexCode.push("ED45");
                        this.asmCode.push("RETN");
                        this.removeNumBytes(1,bytes);
                        break;
                    case /^4D$/.test(bytes[0]):
                        this.hexCode.push("ED4D");
                        this.asmCode.push("RETI");
                        this.removeNumBytes(1,bytes);
                        break;
                    //IM 0
                    case /^46$/.test(bytes[0]):
                        this.hexCode.push("ED46");
                        this.asmCode.push("IM 0");
                        this.removeNumBytes(1, bytes);
                        break;
                    //IM 1
                    case /^56$/.test(bytes[0]):
                        this.hexCode.push("ED56");
                        this.asmCode.push("IM 1");
                        this.removeNumBytes(1, bytes);
                        break;
                    //IM 2
                    case /^5E$/.test(bytes[0]):
                        this.hexCode.push("ED5E");
                        this.asmCode.push("IM 2");
                        this.removeNumBytes(1, bytes);
                        break;
                        //LD A, I
                    case /^57$/.test(bytes[0]):
                        this.hexCode.push("ED57");
                        this.asmCode.push("LD A,I");
                        this.removeNumBytes(1, bytes);
                        break;
                    //LD A, R
                    case /^5F$/.test(bytes[0]):
                        this.hexCode.push("ED5F");
                        this.asmCode.push("LD A,R");
                        this.removeNumBytes(1, bytes);
                        break;
                    //LD I, A
                    case /^47$/.test(bytes[0]):
                        this.hexCode.push("ED57");
                        this.asmCode.push("LD I,A");
                        this.removeNumBytes(1, bytes);
                        break;
                    //LD R, A
                    case /^4F$/.test(bytes[0]):
                        this.hexCode.push("ED4F");
                        this.asmCode.push("LD R,A");
                        this.removeNumBytes(1, bytes);
                        break;
                    //LDD
                    case /^A8$/.test(bytes[0]):
                        this.hexCode.push("EDA8");
                        this.asmCode.push("LDD");
                        this.removeNumBytes(1, bytes);
                        break;
                    //LDDR
                    case /^B8$/.test(bytes[0]):
                        this.hexCode.push("EDB8");
                        this.asmCode.push("LDDR");
                        this.removeNumBytes(1, bytes);
                        break;
                    //LDI
                    case /^A0$/.test(bytes[0]):
                        this.hexCode.push("EDA0");
                        this.asmCode.push("LDI");
                        this.removeNumBytes(1, bytes);
                        break;
                    //LDIR
                    case /^B0$/.test(bytes[0]):
                        this.hexCode.push("EDB0");
                        this.asmCode.push("LDIR");
                        this.removeNumBytes(1, bytes);
                        break;
                    //CPD
                    case /^A9$/.test(bytes[0]):
                        this.hexCode.push("EDA9");
                        this.asmCode.push("CPD");
                        this.removeNumBytes(1, bytes);
                        break;
                    //CPDR
                    case /^B9$/.test(bytes[0]):
                        this.hexCode.push("EDB9");
                        this.asmCode.push("CPDR");
                        this.removeNumBytes(1, bytes);
                        break;
                    //CPI
                    case /^A1$/.test(bytes[0]):
                        this.hexCode.push("EDA1");
                        this.asmCode.push("CPI");
                        this.removeNumBytes(1, bytes);
                        break;
                    //CPIR
                    case /^B1$/.test(bytes[0]):
                        this.hexCode.push("EDB1");
                        this.asmCode.push("CPIR");
                        this.removeNumBytes(1, bytes);
                        break;
                    //SBC HL,ss
                    case /^[4567]2$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`SBC HL,${this.getOperand(bytes[0], [2, 4], this.ValSS)}`)
                        this.removeNumBytes(1,bytes);
                        break;
                    // ADC HL,ss
                    case /^[4567]A$/.test(bytes[0]):                                         
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`ADC HL,${this.getOperand(bytes[0],[2,4],this.ValSS)}`);
                        this.removeNumBytes(1,bytes);
                        break;
                    // Carga registro de 16 bits con (nn)
                    case /^[457]B$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                        this.asmCode.push(`LD ${this.getOperand(bytes[0],[2,4],this.ValSS)},(${bytes[2]}${bytes[1]}H)`);
                        this.removeNumBytes(3,bytes);
                        break;
                    // Carga la dirección (nn) con el valor guardado en dd
                    case /^[457]3$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                        this.asmCode.push(`LD (${bytes[2]}${bytes[1]}),${this.getOperand(bytes[0],[2,4],this.ValSS)}`);
                        this.removeNumBytes(3,bytes);
                        break;
                    default:
                        console.log("NO EXISTE LA INSTRUCCIÓN");
                        break;
                }
                break
            case /^0F$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("RRCA");
                break;
            case /^1F$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("RRA");
                break;
            case /^2F$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("CPL");
                break;
            case /^3F$/.test(moreSignificant):
                this.hexCode.push("3F");
                this.asmCode.push("CCF");
            case /^07$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("RLCA");
                break;
            //RST P
            case /^C7$|^CF$|^D7$|^DF$|^E7$|^EF$|^F7$|^FF$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`RST ${this.getOperand(moreSignificant,[2,5],this.ValP)}`);
                break;
            //SBC R
            case (parseInt(moreSignificant,16)>= 152 && parseInt(moreSignificant,16)<=159):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`SBC A,${this.getOperand(moreSignificant,[5,8],this.ValR)}`)
                break;
            case /^17$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("RLA");
                break;
            case /^C9$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("RET");
                break;
            // Push de registro de 16 bits
            case /^[CDEF]5$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`PUSH ${this.getOperand(moreSignificant,[2,4],this.ValQQ)}`)
                break;
            // Pop de registro de 16 bits
            case /^[CDEF]1$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`POP ${this.getOperand(moreSignificant,[2,4],this.ValQQ)}`);
                break;
            // ADC r
            case (parseInt(moreSignificant,16) >= 136 && parseInt(moreSignificant,16) <= 143):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`ADC ${this.getOperand(moreSignificant,[5,8],this.ValR)}`);
                break;
            case /^76$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("HALT");
                break;
            case /^F3$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("DI");
                break;
            case /^FB$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push("EI");
                break;
            case /^27$/.test(moreSignificant):
                this.hexCode.push(moreSignificant)
                this.asmCode.push("DAA");
                break
            // ADC n
            case /^CE$/.test(moreSignificant):
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                this.asmCode.push(`ADC ${bytes[0]}H`);
                break;
            // ADD n
            case /^C6$/.test(moreSignificant):
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                this.asmCode.push(`ADD ${bytes[0]}H`);
                break;
            // AND r
            case (parseInt(moreSignificant,16) >= 160 && parseInt(moreSignificant,16) <= 167):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`AND ${this.getOperand(moreSignificant,[5,8],this.ValR)}`);
                break;
            //SBC n
            case /^DE$/.test(moreSignificant):
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                this.asmCode.push(`SBC ${bytes[0]}`);
                this.removeNumBytes(1, bytes);
                break;
            // AND n
            case /^E6$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`AND ${bytes[0]}`);
                this.removeNumBytes(1,bytes);
                break;
            // OR r
            case /^B[01234567]$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`OR ${this.getOperand(moreSignificant,[5,8],this.ValR)}`);
                break;
            //RET cc
            case /^C0$|^C8$|^D0$|^D8$|^E0$|^E8$|^F0$|^F8$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`RET ${this.getOperand(moreSignificant,[2,5],this.ValCC)}`);
                break;
            case /^CB$/.test(moreSignificant):
                switch(true) {
                    //SET b,r
                    case (parseInt(bytes[0],16)>= 192 && parseInt(bytes[0],16)<=255):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`SET ${this.getOperand(bytes[0],[2,5],this.ValB)},${this.getOperand(bytes[0],[5,8],this.ValR)}`)
                        this.removeNumBytes(1, bytes);
                        break;  
                    // BIT b,r
                    case (parseInt(bytes[0],16) >= 64 && parseInt(bytes[0],16) <= 127):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`BIT ${this.getOperand(bytes[0],[2,5],this.ValB)},${this.getOperand(bytes[0],[5,8],this.ValR)}`)
                        this.removeNumBytes(1,bytes);
                        break;
                    //RL r               
                    case (parseInt(bytes[0],16)>= 16 && parseInt(bytes[0],16)<=23):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`RL ${this.getOperand(bytes[0],[5,8],this.ValR)}`)
                        this.removeNumBytes(1, bytes);
                        break;
                    //RLC r
                    case (parseInt(bytes[0],16)>= 0 && parseInt(bytes[0],16)<=7):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`RLC ${this.getOperand(bytes[0],[5,8],this.ValR)}`)
                        this.removeNumBytes(1, bytes);
                        break;
                    //RR r
                    case (parseInt(bytes[0],16)>= 24 && parseInt(bytes[0],16)<=31):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`RR ${this.getOperand(bytes[0],[5,8],this.ValR)}`)
                        this.removeNumBytes(1, bytes);
                        break;
                    //RRC r
                    case (parseInt(bytes[0],16)>= 8 && parseInt(bytes[0],16)<=15):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`RRC ${this.getOperand(bytes[0],[5,8],this.ValR)}`)
                        this.removeNumBytes(1, bytes);
                        break;
                    //SLA r
                    case (parseInt(bytes[0],16)>= 20 && parseInt(bytes[0],16)<=39):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`SLA ${this.getOperand(bytes[0],[5,8],this.ValR)}`)
                        this.removeNumBytes(1, bytes);
                        break;
                    //SRA r
                    case (parseInt(bytes[0],16)>= 40 && parseInt(bytes[0],16)<=47):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`SRA ${this.getOperand(bytes[0],[5,8],this.ValR)}`)
                        this.removeNumBytes(1, bytes);
                        break;
                    //SRL r
                    case (parseInt(bytes[0],16)>= 56 && parseInt(bytes[0],16)<=63):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`SRL ${this.getOperand(bytes[0],[5,8],this.ValR)}`)
                        this.removeNumBytes(1, bytes);
                        break;
                    default:
                        console.log("NO EXISTE LA INSTRUCCIÓN");
                        break;
                }                
                break;
            // CP r
            case /^B[89ABCDEF]$/.test(moreSignificant):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`CP ${this.getOperand(moreSignificant,[5,8],this.ValR)}`);
                break;
            // CP n
            case /^FE$/.test(moreSignificant):
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                this.asmCode.push(`CP ${bytes[0]}H`);
                this.removeNumBytes(1,bytes);
                break;
            // Carga a A o HL con (nn)
            case /^3A$|^2A$/.test(moreSignificant):
                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                this.asmCode.push(`LD ${(moreSignificant === "3A")?"A":"HL"},(${bytes[1]}${bytes[0]}H)`);
                this.removeNumBytes(2,bytes);
                break;
            // Grupo de IX y IY
            case /^DD$|^FD$/.test(moreSignificant):
                switch(true) {
                    //JP (IX)
                    case /^E9$/.test(bytes[0]):
                        this.hexCode.push("DDE9");
                        this.asmCode.push("JP (IX)");
                        this.removeNumBytes(1, bytes);
                        break;
                    //JP (IY)
                    case /^E9$/.test(bytes[0]):
                        this.hexCode.push("FDE9");
                        this.asmCode.push("JP (IY)");
                        this.removeNumBytes(1, bytes);
                        break;
                    // POP IX/IY - PUSH IX/IY
                    case /^E[15]$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`${(bytes[0] === "E1")?"POP":"PUSH"} ${(moreSignificant === "DD")?"IX":"IY"}`);
                        this.removeNumBytes(1,bytes);
                        break;
                    // ADD IX,pp y ADD IY,rr
                    case /^[0123]9$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`ADD ${(moreSignificant === "DD")?"IX":"IY"},${this.getOperand(bytes[0], [2, 4],(moreSignificant === "DD")?this.ValPP:this.ValRR)}`);
                        this.removeNumBytes(1,bytes);
                        break;
                    // Carga IX/IY con (nn)
                    case /^2A$/.test(bytes[0]): 
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                        this.asmCode.push(`LD ${(moreSignificant === "DD")?"IX":"IY"},(${bytes[2]}${bytes[1]}H)`);
                        this.removeNumBytes(3,bytes);
                        break;
                    // Carga (IX/IY + d), n
                    case /^36$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`LD (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]}),${bytes[2]}H`);
                            this.removeNumBytes(3,bytes);
                        }
                        break;
                    // Carga registro con (IX/IY + d)
                    case /^01[01][01][01]110$/.test(this.decimalToBin(parseInt(bytes[0],16),8)):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`LD ${this.getOperand(bytes[0],[2,5],this.ValR)},(${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                            this.removeNumBytes(2,bytes);
                        }
                        break;
                    // Carga (IX/IY + d), r 
                    case (parseInt(bytes[0],16) >= 112 && parseInt(bytes[0],16) <= 119):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`LD (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]}),${this.getOperand(bytes[0],[5,8],this.ValR)}`);
                            this.removeNumBytes(2,bytes);
                        }
                        break;
                    // Carga IX/IY con nn
                    case /^21$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                        this.asmCode.push(`LD ${(moreSignificant === "DD")?"IX":"IY"},${bytes[2]}${bytes[1]}H`);
                        this.removeNumBytes(3,bytes);
                        break;
                    //DEC IX/IY 
                    case /^2B$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`DEC ${(moreSignificant === "DD") ? "IX" : "IY"}`);
                        this.removeNumBytes(1,bytes);
                        break;
                    //INC IX/IY 
                    case /^23$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`INC ${(moreSignificant === "DD") ? "IX" : "IY"}`);
                        this.removeNumBytes(1,bytes);
                        break;
                    // Carga (nn) con IX/IY
                    case /^22$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                        this.asmCode.push(`LD (${bytes[1]}${bytes[2]}),${(moreSignificant === "DD")?"IX":"IY"}`);
                        this.removeNumBytes(3,bytes);
                        break;
                    // Carga SP con registro de índice
                    case /^F9$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`LD SP,${(moreSignificant === "DD")?"IX":"IY"}`);
                        this.removeNumBytes(3,bytes);
                        break;
                    // ADC (IX/IY + d)
                    case /^8E$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`ADC (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                            this.removeNumBytes(2,bytes);
                        }
                        break;
                    // ADD (IX/IY + d)
                    case /^86$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`ADD (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                            this.removeNumBytes(2,bytes);
                        }
                        break;
                    // AND (IX/IY + d)
                    case /^A6$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`AND (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                            this.removeNumBytes(2,bytes);
                        }
                        break;
                    //SBC (IX/IY + d)
                    case /^9E$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`SBC A,(${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                            this.removeNumBytes(2, bytes);
                        }
                        break;
                    // XOR (IX/IY + d)
                    case /^AE$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`XOR (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                            this.removeNumBytes(2, bytes);
                        }
                        break;
                    // SUB (IX/IY + d)
                    case /^96$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`SUB (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                            this.removeNumBytes(2, bytes);
                        }
                        break;
                    case /^CB$/.test(bytes[0]):
                        switch(true) {
                            // BIT b, (IX/IY + d)
                            case (/^01[01][01][01]110$/.test(this.decimalToBin(parseInt(bytes[2],16),8))):
                                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                                bytes[1] = this.getDisplacement(bytes[1]);
                                if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                                else {  
                                    this.asmCode.push(`BIT ${this.getOperand(bytes[2],[2,5],this.ValB)},(${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                                    this.removeNumBytes(3,bytes);
                                } 
                                break;
                            // RES b, (IX/IY + d)
                            case (/^10[01][01][01]110$/.test(this.decimalToBin(parseInt(bytes[2],16),8))):
                                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                                bytes[1] = this.getDisplacement(bytes[1]);
                                if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                                else {  
                                    this.asmCode.push(`RES ${this.getOperand(bytes[2],[2,5],this.ValB)},(${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                                    this.removeNumBytes(3,bytes);
                                }
                                break;
                            //SET b,(IX/IY + d)/
                            case /^C6$|^CE$|^D6$|^DE$|^E6$|^EE$|^F6$|^FE$/.test(bytes[2]):
                                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                                bytes[1] = this.getDisplacement(bytes[1]);
                                if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                                else {  
                                    this.asmCode.push(`SET ${this.getOperand(bytes[2],[2,5],this.ValB)},(${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                                    this.removeNumBytes(3,bytes);
                                }
                                break;
                            //RL (IX/IY + d)
                            case /^16$/.test(bytes[2]):
                                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                                bytes[1] = this.getDisplacement(bytes[1]);
                                if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                                else {  
                                    this.asmCode.push(`RL (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                                    this.removeNumBytes(3,bytes);
                                } 
                                break;
                            //SRA (IX/IY + d)
                            case /^2E$/.test(bytes[2]):
                                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                                bytes[1] = this.getDisplacement(bytes[1]);
                                if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                                else {  
                                    this.asmCode.push(`SRA (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                                    this.removeNumBytes(3,bytes);
                                } 
                                break;
                            //SRL (IX/IY + d)
                            case /^3E$/.test(bytes[2]):
                                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                                bytes[1] = this.getDisplacement(bytes[1]);
                                if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                                else {  
                                    this.asmCode.push(`SRL (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                                    this.removeNumBytes(3,bytes);
                                } 
                                break;
                            //SLA (IX/IY + d)
                            case /^26$/.test(bytes[2]):
                                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                                bytes[1] = this.getDisplacement(bytes[1]);
                                if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                                else {  
                                    this.asmCode.push(`SLA (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                                    this.removeNumBytes(3,bytes);
                                } 
                                break;
                            //RLC (IX/IY + d)
                            case /^06$/.test(bytes[2]):
                                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                                bytes[1] = this.getDisplacement(bytes[1]);
                                if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                                else {  
                                    this.asmCode.push(`RLC (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                                    this.removeNumBytes(3,bytes);
                                } 
                                break;
                            //RR (IX/IY + d)
                            case /^1E$/.test(bytes[2]):
                                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                                bytes[1] = this.getDisplacement(bytes[1]);
                                if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                                else {  
                                    this.asmCode.push(`RR (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                                    this.removeNumBytes(3,bytes);
                                } 
                                break;
                            //RRC (IX/IY + d)
                            case /^0E$/.test(bytes[2]):
                                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}${bytes[2]}`);
                                bytes[1] = this.getDisplacement(bytes[1]);
                                if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                                else {  
                                    this.asmCode.push(`RRC (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                                    this.removeNumBytes(3,bytes);
                                } 
                                break;
                            default:
                                console.log("NO EXISTE LA INSTRUCCIÓN");
                                break;
                        }
                        break;
                    // CP (IX/IY + d)
                    case /^BE$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`CP (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                            this.removeNumBytes(2,bytes);
                        }
                        break;
                    // DEC (IX/IY + d)
                    case /^35$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`DEC (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                            this.removeNumBytes(2,bytes);
                        }
                        break;
                    // INC (IX/IY + d)
                    case /^34$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`INC (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                            this.removeNumBytes(2,bytes);
                        }
                        break;
                    // OR (IX/IY + d)
                    case /^B6$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                        bytes[1] = this.getDisplacement(bytes[1]);
                        if (bytes[1] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                        else {  
                            this.asmCode.push(`OR (${(moreSignificant === "DD")?"IX":"IY"}${bytes[1][0]}${bytes[1][1]})`);
                            this.removeNumBytes(2,bytes);
                        }
                        break;
                    //EX (SP), XI
                    case/^E3$/.test(bytes[0]):
                        this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                        this.asmCode.push(`EX (SP),${(moreSignificant === "DD")?"IX":"IY"}`);
                        this.removeNumBytes(1,bytes);
                        break;
                    default:
                        console.log("NO EXISTE LA INSTRUCCIÓN");
                        break;
                }
                break;
            // DJNZ
            case /^10$/.test(moreSignificant):
                // Debemos obtener el valor de e, por lo tanto, debemos de restarle -2 al valor que se obtiene
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                bytes[0] = this.getRelativeJump(bytes[0]); 
                // En este punto se retorna el valor que se tiene que desplazar el PC desde esta instrucción
                if (bytes[0] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                else {  
                    this.asmCode.push(`DJNZ ${bytes[0][0]}${bytes[0][1]}`);
                    this.removeNumBytes(1,bytes);
                }
                break;
            // JR C,e
            case /^38$/.test(moreSignificant):
                // Debemos obtener el valor de e, por lo tanto, debemos de restarle -2 al valor que se obtiene
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                bytes[0] = this.getRelativeJump(bytes[0]); 
                // En este punto se retorna el valor que se tiene que desplazar el PC desde esta instrucción
                if (bytes[0] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                else {  
                    this.asmCode.push(`JR C,${bytes[0][0]}${bytes[0][1]}`);
                    this.removeNumBytes(1,bytes);
                }
                break;
            // JR e
            case /^18$/.test(moreSignificant):
                // Debemos obtener el valor de e, por lo tanto, debemos de restarle -2 al valor que se obtiene
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                bytes[0] = this.getRelativeJump(bytes[0]); 
                // En este punto se retorna el valor que se tiene que desplazar el PC desde esta instrucción
                if (bytes[0] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                else {  
                    this.asmCode.push(`JR ${bytes[0][0]}${bytes[0][1]}`);
                    this.removeNumBytes(1,bytes);
                }
                break;
            // JR NC,e
            case /^30$/.test(moreSignificant):
                // Debemos obtener el valor de e, por lo tanto, debemos de restarle -2 al valor que se obtiene
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                bytes[0] = this.getRelativeJump(bytes[0]); 
                // En este punto se retorna el valor que se tiene que desplazar el PC desde esta instrucción
                if (bytes[0] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                else {  
                    this.asmCode.push(`JR NC,${bytes[0][0]}${bytes[0][1]}`);
                    this.removeNumBytes(1,bytes);
                }
                break;
            // JR NZ,e
            case /^20$/.test(moreSignificant):
                // Debemos obtener el valor de e, por lo tanto, debemos de restarle -2 al valor que se obtiene
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                bytes[0] = this.getRelativeJump(bytes[0]); 
                // En este punto se retorna el valor que se tiene que desplazar el PC desde esta instrucción
                if (bytes[0] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                else {  
                    this.asmCode.push(`JR NZ,${bytes[0][0]}${bytes[0][1]}`);
                    this.removeNumBytes(1,bytes);
                }
                break;
            // JR Z,e
            case /^20$/.test(moreSignificant):
                // Debemos obtener el valor de e, por lo tanto, debemos de restarle -2 al valor que se obtiene
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                bytes[0] = this.getRelativeJump(bytes[0]); 
                // En este punto se retorna el valor que se tiene que desplazar el PC desde esta instrucción
                if (bytes[0] === -1) { console.log("DESPLAZAMIENTO INVÁLIDO"); } // Parar traducción
                else {  
                    this.asmCode.push(`JR Z,${bytes[0][0]}${bytes[0][1]}`);
                    this.removeNumBytes(1,bytes);
                }
                break;
            // CALL nn
            case /^CD$/.test(moreSignificant):
                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                this.asmCode.push(`CALL ${bytes[1]}${bytes[0]}`);
                this.removeNumBytes(2,bytes);
                break;
            //  CALL cc, nn
            case /^11[01][01][01]100$/.test(this.decimalToBin(parseInt(moreSignificant,16),8)):
                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                this.asmCode.push(`CALL ${this.getOperand(moreSignificant,[2,5],this.ValCC)},${bytes[1]}${bytes[0]}`);
                this.removeNumBytes(2,bytes);
                break;
            // Carga registro de 16 bits con nn
            case /^[0123]1$/.test(moreSignificant):
                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                this.asmCode.push(`LD ${this.getOperand(moreSignificant,[2,4],this.ValSS)},${bytes[1]}${bytes[0]}H`);
                this.removeNumBytes(2,bytes);
                break;
            // Carga de registro con número n
            case /^00[01][01][01]110$/.test(this.decimalToBin(parseInt(moreSignificant,16),8)):
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                this.asmCode.push(`LD ${this.getOperand(moreSignificant,[2,5],this.ValR)},${bytes[0]}H`);
                this.removeNumBytes(1,bytes);
                break;
            // Carga la dirección (nn) con el acumulador 
            case /^[32]2$/.test(moreSignificant):
                this.hexCode.push(`${moreSignificant}${bytes[0]}${bytes[1]}`);
                this.asmCode.push(`LD (${bytes[1]}${bytes[0]}H),${(moreSignificant === "32")?"A":"HL"}`);
                this.removeNumBytes(2,bytes);
            break;
            // ADD r
            case (parseInt(moreSignificant,16) >= 128 && parseInt(moreSignificant,16) <= 135):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`ADD ${this.getOperand(moreSignificant,[5,8],this.ValR)}`);
                break;
            //XOR R
            case (parseInt(moreSignificant,16)>= 168 && parseInt(moreSignificant,16)<=175):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`XOR ${this.getOperand(moreSignificant,[5,8],this.ValR)}`);
                break;
            //SUB R
            case (parseInt(moreSignificant,16)>= 144 && parseInt(moreSignificant,16)<=151):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`SUB ${this.getOperand(moreSignificant,[5,8],this.ValR)}`)
                break;
            //SUB n
            case /^D6$/:
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                this.asmCode.push(`SUB ${bytes[0]}`);
                this.removeBytes(1,bytes);
                break;
            //XOR n
            case /^EE$/.test(moreSignificant):
                this.hexCode.push(`${moreSignificant}${bytes[0]}`);
                this.asmCode.push(`XOR ${bytes[0]}`);
                this.removeNumBytes(1, bytes);
                break;
            // INC r
            case /^00[01][01][01]100$/.test(this.decimalToBin(parseInt(moreSignificant,16),8)):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`INC ${this.getOperand(moreSignificant,[2,5],this.ValR)}`);
                break;
            // DEC r
            case /^00[01][01][01]101$/.test(this.decimalToBin(parseInt(moreSignificant,16),8)):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`DEC ${this.getOperand(moreSignificant,[2,5],this.ValR)}`);
                break;
            // Carga de registro con registro
            case (parseInt(moreSignificant,16) >= 64 && parseInt(moreSignificant,16) <= 127):
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`LD ${this.getOperand(moreSignificant,[2,5],this.ValR)},${this.getOperand(moreSignificant,[5,8],this.ValR)}`)
                break;
            default:
                console.log("NO EXISTE LA INSTRUCCIÓN");
                break;
        }
    }

    // Función para transformar a hexadecimal de 16 bits
    decimalToHex(decimal, padding) {
        let hex = decimal.toString(16);
        padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    
        while (hex.length < padding) {
            hex = "0" + hex;
        }
    
        return hex;
    }

    decimalToBin(decimal, padding) {
        let bin = decimal.toString(2);
        padding = (typeof (padding) === "undefined") || (padding === null ? padding = 2 : padding);
    
        while (bin.length < padding) {
            bin = "0" + bin;
        }
    
        return bin;
    }

    getOperand(hex,range,label) {
        let binary;
        binary = this.decimalToBin(parseInt(hex,16),8).slice(range[0],range[1]);
        return label[parseInt(binary,2)];
    }

    getDisplacement(d) {
        let binary;
        let change = false;
        binary = this.decimalToBin(parseInt(d,16),8);
        if(binary[0] === "1") {  // Es un número negativo
            binary = binary.split("");
            for (let i = (binary.length - 1); i >= 0; i--) {
                if (binary[i] === "1" && change === false) { change = true; } 
                else if (binary[i] === "1" && change === true) { binary[i] = "0"; } 
                else if (binary[i] === "0" && change === true) { binary[i] = "1"; }
           }
           binary = binary.toString().replace(/\,/g,"");
           if (parseInt(binary,2) > 0 && parseInt(binary,2) < 129) { return ["-",parseInt(binary,2)]; }
           else { return -1 }; // Desplazamiento inválido
        }
        if (parseInt(binary,2) >= 0 && parseInt(binary,2) < 128) { return ["+",parseInt(binary,2)]; }
        else { return -1 }; // Desplazamiento inválido
    }

    getRelativeJump(e) {
        // e tiene el valor de e - 2 -> Esto debido al funcionamiento del contador de localidades 
        // e - 2 = (-126 + 129)
        // Por lo tanto, para obtener el verdadero desplazamiento, necesitamos sumarle 2
        let binary;
        let change = false;
        binary = this.decimalToBin(parseInt(e,16),8);
        if (binary === "10000001" || binary === "10000000") {
            // Para estos casos se contemplará que el valor es 128 o 129 positivo
            return ["+",parseInt(binary,2) - 2]
        }
        else if(binary[0] === "1") {  // Es un número negativo
            binary = binary.split("");
            for (let i = (binary.length - 1); i >= 0; i--) {
                if (binary[i] === "1" && change === false) { change = true; } 
                else if (binary[i] === "1" && change === true) { binary[i] = "0"; } 
                else if (binary[i] === "0" && change === true) { binary[i] = "1"; }
           }
           binary = binary.toString().replace(/\,/g,"");
           if (parseInt(binary,2) > 0 && parseInt(binary,2) < 127) { 
                return ["-",parseInt(binary,2) - 2];
           }
           else { return -1 }; // Desplazamiento inválido
        }
        if (parseInt(binary,2) >= 0 && parseInt(binary,2) < 128) { 
            return ["+",parseInt(binary,2) + 2]
        }
        else { return -1 }; // Desplazamiento inválido
    }

    removeNumBytes(n,bytes) {
        for (let i = 0; i < n; i++) {
            bytes.shift();
        }
    }
}
/*
let hex = new programHex();
let prueba = [];
prueba[0] = ":1001B0003A0002470516000E0058DD210A027AB8FF";
prueba[1] = ":1001C000FAC40176DD7E00DD2BDDBE00FADF011D05";
prueba[2] = ":1001D0007B3DBAF2C40179FE01CAED01C3C301DD62";
prueba[3] = ":1001E0006600DD7700DD74010E01C3CF011458DD18";
prueba[4] = ":0801F000210A020E00C3BE014A";
prueba[5] = ":00000001FF";
for (let i = 0; i < prueba.length; i++) {
    hex.getElements(prueba[i].toUpperCase(),i);
}
hex.translate(hex.bytes);
console.log(hex.asmCode);
console.log(hex.hexCode);*/