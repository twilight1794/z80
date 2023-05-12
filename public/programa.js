"use strict"

// Enums


// Analizador para un archivo Intel hexadecimal de 8 bits
class ProgramaHex {
    #ast = []
}

// Analizador de valores, para ensamblador

// Analizador para un archivo en ensamblador
class ProgramaAsm {

    /* Expresiones regulares */
    // NOTE: Esta expresión presupone que la definición de variables tiene una sintaxis diferente a las demás directivas, y que el compilador las procesará por separado
    #r_ins = /^([A-Z_0-9]+|[a-z_0-9]+)\s*/;
    #r_var = /^([A-Za-z_][A-Za-z_0-9]+)\s*:\s*([A-Z]+|[a-z]+)\s+/;
    #r_eti = /^([A-Za-z_][A-Za-z_0-9]+)\s*:/;
    //
    #r_id = /^[A-Za-z_][A-Za-z_0-9]+/;
    //#r_num = /^((0x([0-9A-Fa-f]+))|(0b[01]+)|([0-9]+)|(0[0-7]+))/; // Número en formato Intel
    #r_num = /^(([01]+b)|([0-9A-F]+h)|([0-9a-f]+h)|([0-7]+o)|[0-9]+)/;
    #r_esp = /^\s+/;

    #ast = []
    get(){return this.#ast;}
    /*
    var: e: db 4,4
    eti: e:
    ins: ld a, 4
    com: ;
    */

    // Devuelve el código de operación correspondiente a una instrucción de ensamblador
    getCodigoOp(ins, lop){
        let bytes = [];
        switch (ins){
            case "adc":
                break;
            case "add":
                break;
            case "and":
                break;
            case "bit":
                break;
            case "call":
                break;
            case "ccf":
                bytes.push(0x3f);
                break;
            case "cp":
                break;
            case "cpd":
                bytes.push(0xed, 0xa9);
                break;
            case "cpdr":
                bytes.push(0xed, 0xb9);
                break;
            case "cpi":
                bytes.push(0xed, 0xa1);
                break;
            case "cpir":
                bytes.push(0xed, 0xb1);
                break;
            case "cpl":
                bytes.push(0x2f);
                break;
            case "daa":
                bytes.push(0x27);
                break;
            case "dec":
                break;
            case "di":
                bytes.push(0xf3);
                break;
            case "djnz":
                break;
            case "ei":
                bytes.push(0xfb);
                break;
            case "ex":
                break;
            case "exx":
                bytes.push(0xd9);
                break;
            case "halt":
                bytes.push(0x76);
                break;
            case "im0":
                bytes.push(0xed, 0x46);
                break;
            case "im1":
                bytes.push(0xed, 0x56);
                break;
            case "im2":
                bytes.push(0xed, 0x5e);
                break;
            case "in":
                break;
            case "ind":
                bytes.push(0xed, 0xaa);
                break;
            case "indr":
                bytes.push(0xed, 0xba);
                break;
            case "ini":
                bytes.push(0xed, 0xa2);
                break;
            case "inir":
                bytes.push(0xed, 0xb2);
                break;
            case "jp":
                break;
            case "jr":
                break;
            case "inc":
                break; 
            case "ld":
                break;
            case "ldd":
                bytes.push(0xed, 0xa8);
                break;
            case "lddr":
                bytes.push(0xed, 0xb8);
                break;
            case "ldi":
                bytes.push(0xed, 0xa0);
                break;
            case "ldir":
                bytes.push(0xed, 0xb0);
                break;
            case "neg":
                bytes.push(0xed, 0x44);
                break;
            case "nop":
                bytes.push(0x00);
                break;
            case "or":
                break;
            case "otdr":
                bytes.push(0xed, 0xbb);
                break;
            case "otir":
                bytes.push(0xed, 0xb3);
                break;
            case "out":
                break;
            case "outd":
                bytes.push(0xed, 0xab);
                break;
            case "outi":
                bytes.push(0xed, 0xa3);
                break;
            case "pop":
                break;
            case "push":
                break;
            case "res":
                break;
            case "ret":
                bytes.push(0xc9);
                break;
            case "reti":
                bytes.push(0xed, 0x4d);
                break;
            case "retn":
                bytes.push(0xed, 0x45);
                break;
            case "rl":
                break;
            case "rla":
                bytes.push(0x17);
                break;
            case "rlc":
                break;
            case "rlca":
                bytes.push(0x07);
                break;
            case "rld":
                bytes.push(0xed, 0x6f);
                break;
            case "rr":
                break;
            case "rra":
                bytes.push(0x1f);
                break;
            case "rrc":
                break;
            case "rrca":
                bytes.push(0x0f);
                break;
            case "rrd":
                bytes.push(0xed, 0x67);
                break;
            case "rst":
                break;
            case "sbc":
                break;
            case "scf":
                bytes.push(0x37);
                break;
            case "set":
                break;
            case "sla":
                break;
            case "sra":
                break;
            case "srl":
                break;
            case "sub":
                break;
            case "xor":
                break;
            default:
                throw new NoImplementadoError(ins, lnum);
        }
    }

    // Realiza el análisis léxico y sintáctico de una línea de ensamblador
    analizar(l, lnum){
        console.log("Lexing: "+lnum);
        var el = l.trim();
        if (!el.length) { return; }
        while (el.length > 0){
            if (this.#r_ins.test(el)){
                // Es posiblemente una instrucción o directiva
                var res = this.#r_ins.exec(el);
                var ins = res[1];
                el = el.substring(res[0].length);
                var exp = this.parseVals();
                return this.getCodigoOp();
            } else if (this.#r_var.test(cexp)){
                // Es una directiva de variable o constante
                var res = this.#r_var.exec(cexp);
                return;
            } else if (this.#r_eti.test()){
                // Es una etiqueta
                return;
            } else {
                throw new SintaxisError().linea(lnum);
            }
        }
    }
}