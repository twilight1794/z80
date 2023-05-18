"use strict"

/* Enums */
/**
 *
 * Designa el tipo de valor tratado durante el análisis léxico y sintáctico de una expresión
 * @class TipoVal
 */
class TipoVal {
    /* Tipos terminales */
    static NUMERO = new TipoVal("numero");                 // 45h, 44o, 1100b, 44
                                                           // { tipo: TipoVal.NUMERO, valor: x }
    static CADENA = new TipoVal("cadena");                 // "Hola mundo" -> bytes
                                                           // { tipo: TipoVal.CADENA, valor: "x" }
    static REGISTRO = new TipoVal("registro");             // A, B, D, E, F, BC, DE, HL, AF, IX, IY, SP
                                                           // { tipo: TipoVal.REGISTRO, valor: "r" }
    static BANDERA = new TipoVal("bandera");               // P,V,Z,S, NC, NP, NV, NZ, NS
                                                           // { tipo: TipoVal.BANDERA, valor: "x" }
    static AMB_C = new TipoVal("amb_c");                   // C es ambiguo: puede ser un registro, o una bandera
                                                           // { tipo: TipoVal.AMB_C, valor: "c" }
    static DIRECCION = new TipoVal("direccion");           // (100h), (303o)
                                                           // { tipo: TipoVal.NUMERO, valor: x }
                                                           // x= dirección de memoria
    static DESPLAZAMIENTO = new TipoVal("desplazamiento"); // (HL), (IX), (IY+4)
                                                           // { tipo: TipoVal.DESPLAZAMIENTO, valor: n, registro: "x" }

    /* Tipos no terminales */
    static OP = new TipoVal("op");                         // + - * / ^ AND OR XOR NOT NAND NOR NXOR
                                                           // { tipo: TipoVal.OP, valor: "x" }
    static ETIQUETA = new TipoVal("etiqueta");             // eti1, fin
                                                           // { tipo: TipoVal.ETIQUETA, valor: "x" }
    static GRUPO = new TipoVal("grupo");                   // (IX+4)
                                                           // { tipo: TipoVal.GRUPO, valor [...] }
    constructor(name) {
      this.name = name;
    }
}

/**
 *
 * Designa la clase de un parámetro, durante el proceso de ensamblamiento
 * @class TipoParam
 */
class TipoParam {
    static R = new TipoParam("r");
    static HL = new TipoParam("hl");
    static IX = new TipoParam("ix");
    static IY = new TipoParam("iy");
    static N = new TipoParam("n");
    static NN = new TipoParam("nn");
    static D = new TipoParam("d");
    static B = new TipoParam("b");
    static E = new TipoParam("e");
    static CC = new TipoParam("cc");
    static QQ = new TipoParam("qq");
    static SS = new TipoParam("ss");
    static PP = new TipoParam("pp");
    static RR = new TipoParam("rr");
    static S = new TipoParam("s");
    static M = new TipoParam("m");
    /* Especiales */
    static RST = new TipoParam("rst");
    static RIX = new TipoParam("rix");
    static RIY = new TipoParam("riy");
    static RI = new TipoParam("ri");
    static RR = new TipoParam("rr");
    static DBC = new TipoParam("dbc");
    static DDE = new TipoParam("dde");
    static RSP = new TipoParam("rsp");
    static RAF = new TipoParam("raf");
    static RDE = new TipoParam("rde");
    static DSP = new TipoParam("dsp");
}

/**
 * Línea de ensamblador estructurada
 * 
 * @class Instruccion
 */
class Instruccion {
    ops = [];

    constructor (){
        this.mnemo = arguments[0];
        this.eti = arguments[1];
        // QUESTION: ¿Es lo siguiente útil?
        this.text = this.toString();
    }
    anadOps(){
        // QUESTION: ¿Debería haber validación de tipo?
        this.ops.push(...arguments);
        this.text = this.toString();
    }
    toString(){
        let str = this.eti?(this.eti+": "):"";
        str += this.mnemo + " ";
        this.ops.forEach((o) => {
            str += o.valor + ", ";
        });
        str = str.substring(0, str.length-2);
        return str;
    }
}

/**
 * AST para un programa en ensamblador
 * 
 * @class ProgramaAsm
 */
class ProgramaAsm {

    /**
     * Índice de etiquetas a resolver
     * Si la etiqueta ya está resuelta, contiene su dirección, de lo contrario, contiene undefined
     * @memberof ProgramaAsm
     */
    #tablaSimbolos = {};

    earrings = [];

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

    /// Correspondencias Simbolos-Binario
    // Registros (r)
    ValsR = { "b": 0, "c": 1, "d": 2, "e": 3, "h": 4, "l": 5, "hl": 6, "a": 7 }
    // Pares de registros (ss)
    ValsSS = { "bc": 0, "de": 1, "hl": 2, "sp": 3 }
    // Pares de registros (qq)
    ValsQQ = { "bc": 0, "de": 1, "hl": 2, "af": 3 }
    // Pares de registros (pp)
    ValsPP = { "bc": 0, "de": 1, "ix": 2, "sp": 3 }
    // Pares de registros (rr)
    ValsRR = { "bc": 0, "de": 1, "iy": 2, "sp": 3 }
    // Banderas (cc)
    ValsCC = { "nz": 0, "z": 1, "nc": 2, "c": 3, "po": 4, "pe": 5, "p": 6, "m": 7 }

    /**
     * Valida si un parámetro es de una clase válida
     *
     * @param {TipoParam} t Clase de parámetro contra el cual validar
     * @param {*} v Parámetro a validar
     * @return {boolean} Si la validación es exitosa, devuelve true
     * @memberof ProgramaAsm
     * @see TipoParam
     */
    esTipo(t, v){
        switch (t){
            case TipoParam.R:
                if (v.tipo != TipoVal.REGISTRO && v.tipo != TipoVal.AMB_C) throw new BaseError();
                if (Object.keys(this.ValsR).indexOf(v.valor) == -1) throw new BaseError();
                break;
            case TipoParam.N:
                if (v.tipo != TipoVal.NUMERO) throw new BaseError();
                if (v.valor > 0xff || v.valor < 0) throw new BaseError();
                break;
            case TipoParam.HL:
                if (v.tipo != TipoVal.DESPLAZAMIENTO) throw new BaseError();
                if (v.registro != "hl");
                break;
            case TipoParam.IX:
                if (v.tipo != TipoVal.DESPLAZAMIENTO) throw new BaseError();
                if (v.registro != "ix") throw new BaseError();;
                break;
            case TipoParam.IY:
                if (v.tipo != TipoVal.DESPLAZAMIENTO) throw new BaseError();
                if (v.registro != "iy") throw new BaseError();;
                break;
            case TipoParam.NN:
                if (v.tipo != TipoVal.NUMERO) throw new BaseError();
                if (v.valor > 0xffff || v.valor < 0) throw new BaseError();
                break;
            case TipoParam.D:
                if (v.tipo != TipoVal.NUMERO) throw new BaseError();
                if (v.valor > 127 || v.valor < -128) throw new BaseError();
                break;
            case TipoParam.B:
                if (v.tipo != TipoVal.NUMERO) throw new BaseError();
                if (v.valor > 7 || v.valor < 0) throw new BaseError();
                break;
            case TipoParam.E:
                if (v.tipo != TipoVal.NUMERO) throw new BaseError();
                if (v.valor > 129 || v.valor < -126) throw new BaseError();
                break;
            case TipoParam.CC:
                if (v.tipo != TipoVal.AMB_C && v.tipo != TipoVal.BANDERA) throw new BaseError();
                if (Object.keys(this.ValsCC).indexOf(v.valor) == -1) throw new BaseError();
                break;
            case TipoParam.QQ:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (Object.keys(this.ValsSS).indexOf(v.valor) == -1) throw new BaseError();
                break;
            case TipoParam.SS:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (Object.keys(this.ValsSS).indexOf(v.valor) == -1) throw new BaseError();
                break;
            case TipoParam.PP:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (Object.keys(this.ValsPP).indexOf(v.valor) == -1) throw new BaseError();
                break;
            case TipoParam.RR:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (Object.keys(this.ValsRR).indexOf(v.valor) == -1) throw new BaseError();
                break;
            case TipoParam.S:
                try { this.esTipo(TipoParam.R, v); break; } catch {}
                try { this.esTipo(TipoParam.N, v); break; } catch {}
                try { this.esTipo(TipoParam.HL, v); break; } catch {}
                try { this.esTipo(TipoParam.IX, v); break; } catch {}
                try { this.esTipo(TipoParam.IY, v); break; } catch {}
                throw new BaseError();
            case TipoParam.M:
                try { this.esTipo(TipoParam.R, v); break; } catch {}
                try { this.esTipo(TipoParam.HL, v); break; } catch {}
                try { this.esTipo(TipoParam.IX, v); break; } catch {}
                try { this.esTipo(TipoParam.IY, v); break; } catch {}
                throw new BaseError();
            /* Especiales */
            // Para mnemónico RST
            case TipoParam.RST:
                if (v.tipo != TipoVal.NUMERO) throw new BaseError();
                if (v.valor > 0x38) throw new BaseError();
                if (v.valor % 8 != 0) throw new BaseError();
                break;
            // Para los que solo quieren IX o IY
            case TipoParam.RHL:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor != "hl") throw new BaseError();
                break;
            case TipoParam.RIX:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor != "ix") throw new BaseError();
                break;
            case TipoParam.RIY:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor != "iy") throw new BaseError();
                break;
            /* Para registros raros de LD */
            case TipoParam.RI:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor != "i") throw new BaseError();
                break;
            case TipoParam.RR:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor != "r") throw new BaseError();
                break;
            case TipoParam.DBC:
                if (v.tipo != TipoVal.DESPLAZAMIENTO) throw new BaseError();
                if (v.valor != 0) throw new BaseError();
                if (v.registro != "bc") throw new BaseError();
                break;
            case TipoParam.DDE:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor != 0) throw new BaseError();
                if (v.registro != "de") throw new BaseError();
                break;
            case TipoParam.RSP:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor != "sp") throw new BaseError();
                break;
            /* Para registros aún más raros de EX */
            case TipoParam.RAF:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor != "af") throw new BaseError();
                break;
            case TipoParam.RDE:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor != "de") throw new BaseError();
        }
        return true;
    }

    /**
     *
     * Devuelve el código de operación correspondiente a una instrucción de ensamblador
     *
     * @param {string} ins Mnemotécnico, en minúsculas, a procesar
     * @param {Array} lop Array que contiene los parámetros pasados al mnemotécnico
     * @return {Array} Array con los bytes que representan la instrucción en código máquina
     * @memberof ProgramaAsm
     */
    getCodigoOp(ins, lop){
        let bytes = [];
        switch (ins){
            case "adc":
                if (lop.length == 1){
                    bytes = this.getCodigoOp("add", lop);
                    bytes[0] = bytes[0]+8;
                    break;
                } else if (lop.length == 2){
                    try {
                        this.esTipo(TipoParam.RHL, lop[0]);
                        this.esTipo(TipoParam.SS, lop[1]);
                        bytes.push(0xed, 74+(this.ValsSS[lop[1].valor]<<4));
                        break;
                    } catch {}
                    throw new BaseError();
                } else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
            case "add":
                if (lop.length == 1){
                    try {
                        this.esTipo(TipoParam.R, lop[0]);
                        bytes.push(128+this.ValsR[lop[0].valor]);
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.N, lop[0]);
                        bytes.push(198, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.IX, lop[0]);
                        bytes.push(0xdd, 134, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.IY, lop[0]);
                        bytes.push(0xfd, 134, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch {}
                    throw new BaseError();
                } else if (lop.length == 2){
                    try {
                        this.esTipo(TipoParam.RHL, lop[0]);
                        this.esTipo(TipoParam.SS, lop[1]);
                        bytes.push(9+(this.ValsSS[lop[1].valor]<<4));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RIX, lop[0]);
                        this.esTipo(TipoParam.PP, lop[1]);
                        bytes.push(0xdd, 9+(this.ValsPP[lop[1].valor]<<4));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RIY, lop[0]);
                        this.esTipo(TipoParam.RR, lop[1]);
                        bytes.push(0xfd, 9+(this.ValsRR[lop[1].valor]<<4));
                        break;
                    } catch {}
                    throw new BaseError();
                }
                else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
            case "and":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                bytes = this.getCodigoOp("add", lop);
                bytes[0] = bytes[0]+32;
                break;
            case "bit":
                if (lop.length != 2) throw new NumeroParametrosIncorrectoError(ins, 2, lop.length);
                this.esTipo(TipoParam.B, lop[0]);
                try {
                    this.esTipo(TipoParam.R, lop[1]);
                    bytes.push(0xcb, 64+(lop[0].valor<<3)+this.ValsR[lop[1].valor]);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.IX, lop[1]);
                    bytes.push(0xdd, 0xcb, ...obtLittleEndianNum(lop[1].valor), 70+(lop[0].valor<<3));
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.IY, lop[1]);
                    bytes.push(0xfd, 0xcb, ...obtLittleEndianNum(lop[1].valor), 70+(lop[0].valor<<3));
                    break;
                } catch {}
                throw new BaseError();
            case "call":
                if (lop.length == 1){
                    bytes.push(0xcd);
                    this.esTipo(TipoParam.NN, lop[0]);
                    bytes.push(...obtLittleEndianNum(lop[1].valor));
                }
                else if (lop.length == 2){
                    this.esTipo(TipoParam.CC, lop[0]);
                    this.esTipo(TipoParam.NN, lop[1]);
                    bytes.push(196+(lop[0].valor<<3), ...obtLittleEndianNum(lop[1].valor));
                }
                else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
                break;
            case "ccf":
                bytes.push(0x3f);
                break;
            case "cp":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                bytes = this.getCodigoOp("add", lop);
                bytes[0] = bytes[0]+56;
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
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                try {
                    this.esTipo(TipoParam.R, lop[0]);
                    bytes.push(5+(this.ValsR[lop[0].valor]<<3));
                } catch {}
                try {
                    this.esTipo(TipoParam.IX, lop[0]);
                    bytes.push(0xdd, 0x35, ...obtLittleEndianNum(lop[0].valor));
                } catch {}
                try {
                    this.esTipo(TipoParam.IY, lop[0]);
                    bytes.push(0xfd, 0x35, ...obtLittleEndianNum(lop[0].valor));
                } catch {}
                try {
                    this.esTipo(TipoParam.RIX, lop[0]);
                    bytes.push(0xdd, 0x2b);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    bytes.push(0xfd, 0x2b);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.SS, lop[0]);
                    bytes.push(0x11+(this.ValsSS[lop[0].valor]<<4));
                    break;
                } catch {}
                throw new BaseError();
            case "di":
                bytes.push(0xf3);
                break;
            case "djnz":
                bytes.push(0x10);
                if (lop.length == 1){
                    this.esTipo(TipoParam.E, lop[0]);
                    bytes.push(...obtLittleEndianNum(lop[0].valor-2));
                }
                else throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                break;
            case "ei":
                bytes.push(0xfb);
                break;
            case "ex":
                if (lop.length != 2) throw new NumeroParametrosIncorrectoError(ins, 2, lop.length);
                try {
                    this.esTipo(TipoParam.RAF, lop[0]);
                    this.esTipo(TipoParam.RAF, lop[1]);
                    bytes.push(0x08);
                } catch {}
                try {
                    this.esTipo(TipoParam.RDE, lop[0]);
                    this.esTipo(TipoParam.RHL, lop[1]);
                    bytes.push(0xeb);
                } catch {}
                try {
                    this.esTipo(TipoParam.SP, lop[0]);
                    try {
                        this.esTipo(TipoParam.RHL, lop[1]);
                        bytes.push(0xe3);
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RIX, lop[1]);
                        bytes.push(0xdd, 0xe3);
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RIY, lop[1]);
                        bytes.push(0xfd, 0xe3);
                    } catch {}
                    throw new BaseError();
                } catch {}
                break;
            case "exx":
                bytes.push(0xd9);
                break;
            case "halt":
                bytes.push(0x76);
                break;
            case "im":
                bytes.push(0xed);
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                if (lop[0].tipo = TipoVal.Numero) throw new BaseError();
                switch (lop[0].valor){
                    case 0: bytes.push(0x46); break;
                    case 1: bytes.push(0x56); break;
                    case 2: bytes.push(0x5e); break;
                    default: throw new BaseError();
                }
            case "inc":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                try {
                    this.esTipo(TipoParam.R, lop[0]);
                    bytes.push(4+(this.ValsR[lop[0].valor]<<3));
                } catch {}
                try {
                    this.esTipo(TipoParam.IX, lop[0]);
                    bytes.push(0xdd, 0x34, ...obtLittleEndianNum(lop[0].valor));
                } catch {}
                try {
                    this.esTipo(TipoParam.IY, lop[0]);
                    bytes.push(0xfd, 0x34, ...obtLittleEndianNum(lop[0].valor));
                } catch {}
                try {
                    this.esTipo(TipoParam.RIX, lop[0]);
                    bytes.push(0xdd, 0x23);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    bytes.push(0xfd, 0x23);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.SS, lop[0]);
                    bytes.push(3+(this.ValsSS[lop[0].valor]<<4));
                    break;
                } catch {}
                throw new BaseError();
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
                if (lop.length == 1){
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xc3, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.HL, lop[1]);
                        if (lop[1].valor != 0) throw new BaseError();
                        bytes.push(0xe9);
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.IX, lop[1]);
                        if (lop[1].valor != 0) throw new BaseError();
                        bytes.push(0xdd, 0xe9);
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.IY, lop[1]);
                        if (lop[1].valor != 0) throw new BaseError();
                        bytes.push(0xfd, 0xe9);
                        break;
                    } catch {}
                    throw new BaseError();
                }
                else if (lop.length == 2){
                    this.esTipo(TipoParam.CC, lop[0]);
                    this.esTipo(TipoParam.NN, lop[1]);
                    bytes.push(194+(this.ValsCC[lop[0].valor]<<3), ...obtLittleEndianNum(lop[1].valor));
                } else
                    throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
                break;
            case "jr":
                if (lop.length == 1){
                    this.esTipo(TipoParam.E, lop[0]);
                    bytes.push(0x18, ...obtLittleEndianNum(lop[0].valor-2));
                    break;
                } else if (lop.length == 2){
                    this.esTipo(TipoParam.CC, lop[0]);
                    this.esTipo(TipoParam.E, lop[1]);
                    switch (lop[0].valor){
                        case "c":
                            bytes.push(0x38, ...obtLittleEndianNum(lop[1].valor-2));
                            break;
                        case "nc":
                            bytes.push(0x30, ...obtLittleEndianNum(lop[1].valor-2));
                            break;
                        case "z":
                            bytes.push(0x20, ...obtLittleEndianNum(lop[1].valor-2));
                            break;
                        case "nz":
                            bytes.push(0x28, ...obtLittleEndianNum(lop[1].valor-2));
                            break;
                        default:
                            throw new BaseError();
                    }
                    break;
                } else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
            case "ld":
                if (lop.length != 2) throw new NumeroParametrosIncorrectoError(ins, 2, lop.length);
                try {
                    this.esTipo(TipoParam.IX, lop[0]);
                    try {
                        this.esTipo(TipoParam.R, lop[1]);
                        bytes.push(0xdd, 112+this.ValsR[lop[1].valor], ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.N, lop[1]);
                        bytes.push(0xdd, 0x36, ...obtLittleEndianNum(lop[1].valor), ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xdd, 0x2a, ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch {}
                    throw new BaseError();
                } catch {}
                try {
                    this.esTipo(TipoParam.IY, lop[0]);
                    try {
                        this.esTipo(TipoParam.R, lop[1]);
                        bytes.push(0xfd, 112+this.ValsR[lop[1].valor], ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.N, lop[1]);
                        bytes.push(0xfd, 0x36, ...obtLittleEndianNum(lop[1].valor), ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xdf, 0x2a, ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch {}
                    throw new BaseError();
                } catch {}
                try {
                    this.esTipo(TipoParam.R, lop[0]);
                    try {
                        this.esTipo(TipoParam.IX, lop[1]);
                        bytes.push(0xdd, 70+(this.ValsR[lop[0].valor]<<3), ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.IY, lop[1]);
                        bytes.push(0xfd, 70+(this.ValsR[lop[0].valor]<<3), ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.N, lop[1]);
                        bytes.push(6+(this.ValsR[lop[0].valor]<<3), ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.R, lop[1]);
                        bytes.push(64 + (this.ValsR[lop[0].valor]<<3) + (this.ValsR[lop[1].valor]<<3));
                        break;
                    } catch {}

                    if (lop[0].valor == "a"){
                        try {
                            this.esTipo(TipoParam.RI, lop[1]);
                            bytes.push(0xed, 0x57);
                            break;
                        } catch {}
                        try {
                            this.esTipo(TipoParam.RR, lop[1]);
                            bytes.push(0xed, 0x5f);
                            break;
                        } catch {}
                        try {
                            this.esTipo(TipoParam.DBC, lop[1]);
                            bytes.push(0x0a);
                            break;
                        } catch {}
                        try {
                            this.esTipo(TipoParam.DDE, lop[1]);
                            bytes.push(0x1a);
                            break;
                        } catch {}
                        try {
                            this.esTipo(TipoParam.DIRECCION, lop[1]);
                            bytes.push(0x3a, ...obtLittleEndianNum(lop[1].valor));
                            break;
                        } catch {}
                    }

                    throw new BaseError();
                } catch {}
                try {
                    this.esTipo(TipoParam.SP, lop[0]);
                    try {
                        this.esTipo(TipoParam.RHL, lop[1]);
                        bytes.push(0xf9);
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RIX, lop[1]);
                        bytes.push(0xdd, 0xf9);
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RIY, lop[1]);
                        bytes.push(0xfd, 0xf9);
                        break;
                    } catch {}
                    throw new BaseError();
                } catch {}
                try {
                    this.esTipo(TipoParam.SS, lop[0]);
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(1+(this.ValsSS[lop[1].valor]<<4), ...obtLittleEndianNum(lop[1].valor));
                    } catch {}
                    try {
                        this.esTipo(TipoParam.DIRECCION, lop[1]);
                        bytes.push(0xed, 75+(this.ValsSS[lop[1].valor]<<4), ...obtLittleEndianNum(lop[1].valor));
                    } catch {}
                    throw new BaseError();
                } catch {}
                try {
                    this.esTipo(TipoParam.DIRECCION, lop[0]);
                    try {
                        this.esTipo(TipoParam.RA, lop[1]);
                        bytes.push(0x32, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RHL, lop[1]);
                        bytes.push(0x22, ...obtLittleEndianNum(lop[1].valor))
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.SS, lop[1]);
                        bytes.push(0xed, 67 + this.ValsSS[lop[1].valor]<<4, ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RIX, lop[1]);
                        bytes.push(0xdd, 0x22, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RIY, lop[1]);
                        bytes.push(0xfd, 0x22, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch {}
                    throw new BaseError();
                } catch {}
                try {
                    this.esTipo(TipoParam.RIX, lop[0]);
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xdd, 0x21, ...obtLittleEndianNum(lop[1].valor));
                    } catch {}
                    try {
                        this.esTipo(TipoParam.DIRECCION, lop[1]);
                        bytes.push(0xdd, 0x2a, ...obtLittleEndianNum(lop[1].valor));
                    } catch {}
                    throw new BaseError();
                } catch {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xfd, 0x21, ...obtLittleEndianNum(lop[1].valor));
                    } catch {}
                    try {
                        this.esTipo(TipoParam.DIRECCION, lop[1]);
                        bytes.push(0xfd, 0x2a, ...obtLittleEndianNum(lop[1].valor));
                    } catch {}
                    throw new BaseError();
                } catch {}
                try {
                    this.esTipo(TipoParam.RI, lop[0]);
                    this.esTipo(TipoParam.RA, lop[0]);
                    bytes.push(0xed, 0x47);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.RR, lop[0]);
                    this.esTipo(TipoParam.RA, lop[0]);
                    bytes.push(0xed, 0x4f);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.DBC, lop[0]);
                    this.esTipo(TipoParam.RA, lop[0]);
                    bytes.push(0x02);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.DDE, lop[0]);
                    this.esTipo(TipoParam.RA, lop[0]);
                    bytes.push(0x12);
                    break;
                } catch {}
                throw new BaseError();
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
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                bytes = this.getCodigoOp("add", lop);
                bytes[0] = bytes[0]+48;
                break;
            case "otdr":
                bytes.push(0xed, 0xbb);
                break;
            case "otir":
                bytes.push(0xed, 0xb3);
                break;
            case "outd":
                bytes.push(0xed, 0xab);
                break;
            case "outi":
                bytes.push(0xed, 0xa3);
                break;
            case "pop":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                try {
                    this.esTipo(TipoParam.RIX, lop[0]);
                    bytes.push(0xdd, 0xe1);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    bytes.push(0xfd, 0xe1);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.QQ, lop[0]);
                    bytes.push(193+(ValsQQ[lop[0].valor]<<4));
                    break;
                } catch {}
                throw new BaseError();
            case "push":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                try {
                    this.esTipo(TipoParam.RIX, lop[0]);
                    bytes.push(0xdd, 0xe5);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    bytes.push(0xfd, 0xe5);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.QQ, lop[0]);
                    bytes.push(197+(ValsQQ[lop[0].valor]<<4));
                    break;
                } catch {}
                throw new BaseError();
            case "res":
                bytes = this.getCodigoOp("set", lop);
                bytes[3] = bytes[3]+64;
                break;
            case "ret":
                if (lop.length == 0) bytes.push(0xc9);
                else if (lop.length == 1){
                    this.esTipo(TipoParam.CC, lop[0]);
                    bytes.push(192+(this.ValsCC[lop[0].valor]<<3));
                }
                else throw new NumeroParametrosIncorrectoError(ins, [0, 1], lop.length);
                break;
            case "reti":
                bytes.push(0xed, 0x4d);
                break;
            case "retn":
                bytes.push(0xed, 0x45);
                break;
            case "rl":
                bytes = this.getCodigoOp("rlc", lop);
                bytes[3] = bytes[3]+(2<<3);
                break;
            case "rla":
                bytes.push(0x17);
                break;
            case "rlc":
                if (lop.length == 1 && this.esTipo(TipoParam.R)) bytes.push(0xcb, this.ValsR[lop[0].valor]);
                else if (lop.length == 2){
                    try {
                        this.esTipo(TipoParam.IX, lop[0]);
                        bytes.push(0xdd, 0xcb, ...obtLittleEndianNum(lop[1].valor), 6);
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.IY, lop[0]);
                        bytes.push(0xfd, 0xcb, ...obtLittleEndianNum(lop[1].valor), 6);
                        break;
                    } catch {}
                    throw new BaseError();
                } else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
            case "rlca":
                bytes.push(0x07);
                break;
            case "rld":
                bytes.push(0xed, 0x6f);
                break;
            case "rr":
                bytes = this.getCodigoOp("rlc", lop);
                bytes[3] = bytes[3]+(3<<3);
                break;
            case "rra":
                bytes.push(0x1f);
                break;
            case "rrc":
                bytes = this.getCodigoOp("rlc", lop);
                bytes[3] = bytes[3]+(1<<3);
                break;
            case "rrca":
                bytes.push(0x0f);
                break;
            case "rrd":
                bytes.push(0xed, 0x67);
                break;
            case "rst":
                if (lop.length == 1){
                    this.esTipo(TipoParam.RST, lop[0]);
                    bytes.push(199+((lop[0].valor/8)<<3));
                }
                else throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                break;
            case "sbc":
                if (lop.length == 1){
                    bytes = this.getCodigoOp("add", lop);
                    bytes[0] = bytes[0]+24;
                    break;
                } else if (lop.length == 2){
                    try {
                        this.esTipo(TipoParam.RHL, lop[0]);
                        this.esTipo(TipoParam.SS, lop[1]);
                        bytes.push(0xed, 66+(this.ValsSS[lop[1].valor]<<4));
                        break;
                    } catch {}
                    throw new BaseError();
                } else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
            case "scf":
                bytes.push(0x37);
                break;
            case "set":
                bytes = this.getCodigoOp("set", lop);
                bytes[3] = bytes[3]+128;
                break;
            case "sla":
                bytes = this.getCodigoOp("rlc", lop);
                bytes[3] = bytes[3]+(4<<3);
                break;
            case "sra":
                bytes = this.getCodigoOp("rlc", lop);
                bytes[3] = bytes[3]+(5<<3);
                break;
            case "srl":
                bytes = this.getCodigoOp("rlc", lop);
                bytes[3] = bytes[3]+(7<<3);
                break;
            case "sub":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                bytes = this.getCodigoOp("add", lop);
                bytes[0] = bytes[0]+16;
                break;
            case "xor":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                bytes = this.getCodigoOp("add", lop);
                bytes[0] = bytes[0]+40;
                break;
            default:
                throw new NoImplementadoError(ins, lnum);
        }
        return bytes;
    }

    /**
     *
     * Analiza léxica y sintácticamente una línea de ensamblador
     *
     * @param {string} l Línea en ensamblador a procesar
     * @param {number} lnum Número de línea en el código fuente
     * @param {number} cl Contador de localidades, para identificar la dirección de una etiqueta
     * @return {Instruccion} Si la instrucción es sintácticamente válida, devuelve un objeto Instrucción
     * @memberof ProgramaAsm
     */
    analLexSint(l, lnum, cl){
        /*
            NOTA: Recordar que la traducción a través de una pasada y media funciona de la manera siguiente:
            - Se va ensamblando y validando las instrucciones línea por línea
            - Si en una línea se encuentra un declarador de etiqueta, se agrega la etiqueta a una lista de etiquetas disponibles
            - En caso de que la etiqueta se encuentra como referencia externa, habrá que analizar si dicha etiqueta ya se encuentra dentro
              de la lista de etiquetas, en caso contrario, colocar un marcador
            - Generar código hexadecimal

            Por lo tanto, tenemos que realizar lo siguiente por cada línea de código:
            1. Determinar la estructura -> eti:_instr_op1,op2
            2. Separar la estructura en los elementos necesarios
            3. Determinar si la etiqueta es una definición o una referencia externa
                3a. Si es una definición de etiqueta se deberá de almacenar en una lista de etiquetas
                3b. En caso contrario, se deberá de validar que la etiqueta ya exista definida en la lista de etiquetas 
                    3ba. Si no lo está, colocaremos un marcador en la etiqueta y se compararán las siguientes definiciones de etiquetas 
                        con las etiquetas pendientes, asignando la dirección en hexadecimal

            OJO -> Estamos pensando en un simulador que no contemple las directiva ORG, por lo tanto el CL siempre
                   iniciará en 0 (pensando en el contador como número decimal) -> Para la asignación de valor a las 
                   etiquetas, se tendrá que convertir de decimal a hexadecimal

            Símbolos útiles:
            - tableOfSymbols -> Nos permitirá asignar las etiquetas necesarias en la hora de traducción
            - earrings -> Nos permite llevar una lista de instrucciones pendientes de traducir (debido a falta de etiquetas referenciadas)
            
            
            NOTA: En este caso, se van a simular un ensamblador de 1 pasada y media, ya que, sabemos que las etiquetas son asignadas con 
            direcciones de memoria en hexadecimal, es decir, tiene valores nn -> 2 bytes, por lo que seguiremos el conteo y traducción. Una 
            vez terminado el proceso, se procederá a traducir las instrucciones faltantes considerando que la tabla de symbolos
            sea correcta 
        */
       
        /*
            1) Analizamos la sintaxis de la línea ingresada. Hay dos opciones:
                a) etiqueta:_instrucción_operandos
                b) instrucción_operandos
        */
        // Para los modos de direccionamiento indirecto
        // El format y format2 nos permite determinar desplazamientos o accesos a memoria
        let format = /\(\s*(\w+)\s*\)/i;
        let format2 = /\(\s*(\w+)\s*\+\s*(\w+)\s*\)/i;
        let format3 = /\(\s*(\w+)\s*\-\s*(\w+)\s*\)/i;
        // Expresión regular para determinar si hay definición de etiquetas
        let expRegTag = /^\w+:$/;
        let line = l.trim().toLowerCase();

        if (line.includes("+")) line = line.replace(format2,"($1+$2)");
        else if (line.includes("-")) line = line.replace(format3,"($1-$2)");
        else line = line.replace(format,"($1)");

        let instr = new String();
        let tag = null; // <- Valor predeterminado
        let operands = [];
        if (!line.length){ return 0; } // 0 nos indicará que se puede seguir con la traducción
        // En caso de que la línea no esté vacía, se analiza su estructura

        let elementos = line.replace(","," ").split(" ");
        let el = elementos.filter(word => word.length > 0);
        // Por el momento la variable el contiene un arreglo de la instrucción dividida
        // En este punto, si el primer elemento contiene la estructura eti:, se procede a analizar etiquetas
        if (expRegTag.test(el[0])){
            // Si hay etiqueta
            // Como es definición de etiqueta, validamos que la etiqueta no esté ya definida
            el[0] = el[0].replace(":", "");
            // Si existe, error de doble declaración
            if (this.#tablaSimbolos?.[el[0]]) throw new EtiquetaExistenteError(el[0]);
            // Si no, se agrega a la tabla
            else this.#tablaSimbolos[el[0]].dir = cl;
            tag = el[0];
            instr = el[1];
            operands = el.slice(2);
        } else {
            // Si no hay etiqueta
            instr = el[0];
            operands = el.slice(1);
        }

        /*
            En este punto se tienen separados los elementos de la instrucción completa, por lo que se procede a 
            realizar el análisis de operandos para validar que la operación es una posible instrucción válida
            y se pueda generar su código de operación
        */
        // En caso de haber referencia a etiqueta que no se haya definido, deberemos ingresar la instrucción a la lista 
        // de instrucciones pendientes
        // FIX: esta validación es por ahora, luego se quitará, puesto que la validación del número de parámetros ya se lleva a cabo más adelante, y hay directivas que precisan n parámetros

        let trad = new Instruccion(instr, tag);
        if (operands.length === 0){
        } else if (operands.length === 1){
            // Hay un operando -> Se debe de analizar el tipo de operando y posteriormente toda la instrucción
            operands[0] = this.parseVal(operands[0]);

            if (operands[0][1] === 0){
                // En este caso, la instrucción se manda a la lista de pendientes
                this.earrings.push([lnum,trad]);
                // Igualmente se deberá de meter a la lista de código del programa, considerando que las etiquetas
                // son valores numéricos de 16 bits (ya que representan localidades de memoria)
            }
            trad.anadOps(...operands);
        } else if (operands.length === 2){
            // Hay dos operandos -> Se deben de analizar ambos operandos y la existencia de la instrucción
            // Debemos de guardar el valor de los operandos así como el tipo de operando que es
            operands[0] = this.parseVal(operands[0]);
            operands[1] = this.parseVal(operands[1]);
            if (operands[0][1] === 0 | operands[1][1] === 0){
                // En este caso, la instrucción se deberá de mandar a la lista de instrucciones pendientes
                this.earrings.push([lnum,trad]);
            }
            trad.anadOps(...operands);
        } else throw new NumeroParametrosExcedidoError(); // Inexistencia de instrucción con mas de 3 operandos 

        // Una vez obtenido el análisis sintáctico, se obtiene el código de operación
        return trad;
    }

    /**
     * Analiza léxica y sintácticamente un parámetro de instrucción
     *
     * @param {string} valor Cadena de caracteres a analizar léxica y sintácticamente
     * @return {Object} Objeto que representa el tipo de dato y el valor
     * @memberof ProgramaAsm
     */
    parseVal(valor){
        // FIX: al considerar cadenas, hay qué quitar esto
        valor = valor.toLowerCase();
        let op, tipo;
        // Realizamos una expresión regular para validar que sea un registro
        let regExpR = /^[A|B|D|E|H|L|I|R]$/i;
        // Realizamos una expresión para banderas
        let regExpCC = /^[Z|P|M]$|NZ$|NC$|PO$|PE$/i;
        // Pares de registros de la forma 16 bits
        let regExpSS = /^BC$|^DE$|^HL$|^SP$|^AF$|^IX$|^IY$/i;
        // La siguiente expresión regular ya contempla cualquier tipo de número
        let regExpNumber = /^[01]+[B]$|^[0-7]+[O]$|^[0-9]+$|^\-[0-9]+$|^[0-9ABCDEF]+[H]$|^\-[01]+[B]$|^\-[0-7]+[O]$|^\-[0-9ABCDEF]+[H]$/i;
        // Para los registros de índice indirectos (IX|IY + d)
        let regExpInd = /^\(\s*IX\s*[\+|\-]\s*[0-9]+\)$|^\(\s*IY\s*[\+|\-]\s*[0-9]+\)$|^\(\s*IX\s*[\+|\-]\s*[0-9]+[B|O]\)$|^\(\s*IY\s*[\+|\-]\s*[0-9]+[B|O]\)$|^\(\s*IX\s*[\+|\-]\s*[0-9A-F]+[H]\)$|^\(\s*IY\s*[\+|\-]\s*[0-9A-F]+[H]\)$/i;
        // Para los registros de desplazamiento
        let regExpSSI = /^\(BC\)$|^\(DE\)$|^\(HL\)$/i;
        // Para direcciones numéricas
        let regExpNNI = /^\([0-9]+[BO]\)$|^\([0-9]+\)$|^\([0-9ABCDEF]+[H]\)$/i;
        // Y por último, las etiquetas
        let regExpTag = /^[A-Z][\w]+$/i;

        // Contemplar a (ss) como desplazamiento
        // Contemplar a I y R como registros
        // Cambiar cadenas de números a valor decimal
        // Ajustar todos los tipos a los señalados en la clase tipoVal
        // Se analiza el tipo de operando
        if (valor === "c"){
            tipo = TipoVal.AMB_C;
        } else if (regExpNumber.test(valor)){
            // El valor encontrado es un número
            tipo = TipoVal.NUMERO;
            // Hay que obtener el valor numérico
            valor = this.#getNumericValue(valor);
        } else if (regExpR.test(valor)){
            // El valor encontrado es un registro
            tipo = TipoVal.REGISTRO;
        } else if (regExpCC.test(valor)){
            // El valor encontrado es una bandera
            tipo = TipoVal.BANDERA;
        } else if (regExpSS.test(valor)){
            // El valor encontrado es un registro de 16 bits
            tipo = TipoVal.REGISTRO;
        } else if (regExpInd.test(valor)){
            // { tipo: TipoVal.DESPLAZAMIENTO, valor: n, registro: "x" }
            op = this.#getDisplacementAndRegister(valor);
            return op;
        } else if (regExpSSI.test(valor)){
            // Es un acceso a memoria de 16 bits -> (BC),(DE) o (HL)
            tipo = TipoVal.DESPLAZAMIENTO;
        } else if (regExpNNI.test(valor)){
            // Se trata de un acceso de memoria numérica
            tipo = TipoVal.DIRECCION;
            // Necesitamos obtener el valor numérico de la dirección
            valor = valor.replace("(","").replace(")","");
            valor = this.#getNumericValue(valor);
        } else if (regExpTag.test(valor)){
            // En caso de una posible etiqueta, analizamos si dicha etiqueta existe en la tabla de símbolos
            if (!(valor in this.#tablaSimbolos)){
                this.#tablaSimbolos[valor] = undefined;
                return [valor, 0];
            } else if (this.#tablaSimbolos[valor]){
                tipo = TipoVal.NUMERO; 
                valor = this.#tablaSimbolos[valor];
            } else return [valor, 0];

            // Se trata de una posible etiqueta que habrá que analizar su existencia en la tabla de símbolos o en caso contrario
            // agregar la línea de instrucción en instrucciones pendientes
        } else throw new TipoValorError("unknown"); // QUESTION: ¿Hacer diferencia entre tipos de directivas y tipos internos?
        
        // En caso de que el tipo de dato sea numérico, se deberá de convertir a decimal -> operando
        return {
            tipo: tipo,
            valor: valor
        }
    }

    decimalToHex(decimal, padding){
        // Función para transformar a hexadecimal de 16 bits
        var hex = decimal.toString(16);
        padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;
        while (hex.length < padding){
            hex = "0" + hex;
        }
        return hex;
    }

    /**
     * Analiza léxica y sintácticamente una expresión de desplazamiento
     *
     * @param {string} operand Cadena de caracteres que representa al desplazamiento
     * @return {Object} Objeto que representa al desplazamiento
     * @memberof ProgramaAsm
     */
    #getDisplacementAndRegister(operand){
        let elements = operand.replace("(","").replace(")","").split(elements.includes("+")?"+":"-");
        let register = elements[0];
        let valor = this.#getNumericValue(elements[1]) * (operand.includes("-")?-1:1);
        return {
            valor: valor,
            registro: register,
            tipo: TipoVal.DESPLAZAMIENTO
        };
    }

    /**
     *
     * Obtiene el valor numérico, a partir de una cadena numérica con el formato de ensamblador
     *
     * @param {string} n Número con formato
     * @return {number} Valor numérico
     * @memberof ProgramaAsm
     */
    #getNumericValue(n){
        let regExpDecimal = /^[0-9]+$|^\-[0-9]+$/i;
        let regExpOctal = /^[0-7]+[O]$|^\-[0-7]+[O]$/i;
        let regExpBin = /^[01]+[B]$|^\-[01]+[B]$/i;
        let regExpHex = /^[0-9ABCDEF]+[H]$|^\-[0-9ABCDEF]+[H]/i;
        if (regExpDecimal.test(n)) return parseInt(n);
        if (regExpBin.test(n)) return parseInt(n, 2);
        if (regExpOctal.test(n)) return parseInt(n, 8);
        if (regExpHex.test(n)) return parseInt(n, 16);
        return false; // El número ingresado no es ningún tipo de número válido
    }
}
