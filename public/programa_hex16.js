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
        this.asmCode = [];
        this.hexCode = [];
        this.CL = PC;
    }

    ValQQ = {0:"AF", 16:"HL", 32:"DE", 48:"BC"};

    translator(hexLine, lnum) {
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
        if (hexLine === ":00000001FF") { return 1; } // Se terminó la traducción

        // Se procede a separar por partes la línea hexadecimal (validando parte por parte)
        hexLine = hexLine.replace(":","");
        let numBytes = hexLine.slice(0,2);
        let PC = hexLine.slice(2,6);
        let padding = hexLine.slice(6,8);
        let opCodes = hexLine.slice(8,40);
        let checkSum = hexLine.slice(40);
        let hola = String();
        // Validamos que el número de bytes sea correcto
        if (!this.checkBytesRange(numBytes)) { throw new numBytesError(lnum) };
        // Se realiza la validación del CL
        if (!this.checkCL(PC,lnum,numBytes)) { throw new counterError(lnum) };
        // Se realiza el validador del padding
        if (!this.checkPadding(padding)) { throw new paddingError(lnum) };
        // Se validan los códigos operacionales
        // Validar que el tamaño de opCodes sea igual al numBytes
        this.getMnemonics(opCodes);
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
            this.CL = parseInt(PC,16);
            this.CL += parseInt(numBytes,16);
        } else {
            // Checar que el PC vaya de acuerdo con el contador de localidades
            if (this.decimalToHex(this.CL,4) === PC) {
                this.CL += parseInt(numBytes,16);
            }
            else { return false };
        }
        return true;
    }

    // Función para validar que el padding sea correcto
    checkPadding(padding) {
        if(padding === "00") {
            return true;
        }
        return false;
    }

    // Función para determinar el mnemónico del código operacional
    getMnemonics(opCodes) {
        let bytes = []; // Tendremos los pares de bytes disponibles
        opCodes = opCodes.split("");
        // Ver con función bytes.map()
        for (let i = 0; i < opCodes.length; i++) {
            if (i % 2 != 0) {
                bytes.push(`${opCodes[i-1]}${opCodes[i]}`);
            }
        }
        // En este punto, bytes contiene todos los pares de bytes para evaluar las instrucciones
        // Por cada código de operación, tendremos un discriminante, el cual será el primer elemento
        while(bytes.length != 0) {
            this.checkMnemonics(bytes.shift(),bytes);
        }
    }

    checkMnemonics(moreSignificant,bytes) {
        // console.log(`More significant: ${moreSignificant}`);
        // console.log(bytes);
        switch(true) {
            // Primero analizaremos los inmediatos
            case "00":
                this.hexCode.push("00");
                this.asmCode.push("NOP");
                break;
            case "37":
                this.hexCode.push("37");
                this.asmCode.push("SCF");
                break;
            case /^ED$/.test(moreSignificant):
                switch(true) {
                    // Seguir analizando otros posibles casos
                    case "67":
                        this.hexCode.push("ED67");
                        this.asmCode.push("RRD");
                        bytes.shift();
                        break;
                    case "6F":
                        this.hexCode.push("ED6F");
                        this.asmCode.push("RLD");
                        bytes.shift();
                        break;
                     case "44":
                        this.hecCode.push("ED44");
                        this.asmCode.push("NEG");
                        bytes.shift();
                        break;
                    case "45":
                        this.hexCode.push("ED45");
                        this.asmCode.push("RETN");
                        bytes.shift();
                        break;
                    case "4D":
                        this.hexCode.push("ED4D");
                        this.asmCode.push("RETI");
                        bytes.shift();
                        break;
                     case /^4A$|^5A$|^6A$|^7A$/.test(bytes[0]):
                        let binary;                                          
                        this.hexCode.push(`ED${bytes[0]}`);
                        //Se divide cada digito del byte
                        binary = bytes[0].split("");
                        //Se pasa a decimal y de decimal a binario
                        //En este caso solo se ocupa el primer digito del byte porque todos terminan en A
                        let binary1 = binary[0]
                        binary1 = parseInt(binary1,16).toString(2);
                        //Tomar solo los ultimos dos bits de la primer mitad
                        let lastPosition = binary1.length - 1 ;
                        binary1 = `${binary1[lastPosition-1]}${binary1[lastPosition]}`                  
                        this.asmCode.push(`ADC HL,${this.ValSS[parseInt(binary1,2)]}`)
                        bytes.shift();
                        break;
                }
                break
            case "0F":
                this.hexCode.push("0F");
                this.asmCode.push("RRCA");
                break;
            case "1F":
                this.hexCode.push("1F");
                this.asmCode.push("RRA");
                break;
             case "2F":
                this.hexCode.push("2F");
                this.asmCode.push("CPL");
                break;
             case "3F":
                this.hexCode.push("3F");
                this.asmCode.push("CCF");
                break;
            case "07":
                this.hexCode.push("07");
                this.asmCode.push("RLCA");
                break;
            case "17":
                this.hexCode.push("17");
                this.asmCode.push("RLA");
                break;
            case "C9":
                this.hexCode.push("C9");
                this.asmCode.push("RET");
                break;
            case /^C5$|^D5$|^E5$|^F5$/.test(moreSignificant):
                // Existe una diferencia de 16 entre cada uno de los códigos operacionales
                this.hexCode.push(moreSignificant);
                this.asmCode.push(`PUSH ${this.ValQQ[parseInt("F5",16) - parseInt(moreSignificant,16)]}`);
                break;
            case "76":
                this.hexCode.push("76");
                this.asmCode.push("HALT");
                break;
             case "F3":
                this.hexCode.push("F3");
                this.asmCode.push("DI");
                break;
            case "FB":
                this.hexCode.push("FB");
                this.asmCode.push("EI");
                break;
            default:
                console.log("NO EXISTE LA INSTRUCCIÓN");
                break
        }
    }

    // Función para transformar a hexadecimal de 16 bits
    decimalToHex(decimal, padding) {
        var hex = decimal.toString(16);
        padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
    
        while (hex.length < padding) {
            hex = "0" + hex;
        }
    
        return hex;
    }
}

// PRUEBAS
let hex = new programHex();
let prueba = [];
prueba[0] = ":100000003A0002470516000E0058DD210A027AB8FF";
prueba[1] = ":10001000FAC40176DD7E00DD2BDDBE00FADF011D05";
prueba[2] = ":10002000E5C5F5";
for (let i = 0; i < prueba.length; i++) {
    hex.translator(prueba[i].toUpperCase(),i);
}
console.log(hex.asmCode);
console.log(hex.hexCode);
/*
    DEBO GENERAR EL MISMO TIPO DE OBJETO QUE CUANDO TRADUZCO DE ASM A HEX
    obj = {
        instr,
        tag,
        operands,
    }
*/
