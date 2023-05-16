"use strict"

/* Enums */
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

    // Validador de tipo de parámetros
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
                try { this.esTipo(TipoParam.R, v); break; } catch (e) {}
                try { this.esTipo(TipoParam.N, v); break; } catch (e) {}
                try { this.esTipo(TipoParam.HL, v); break; } catch (e) {}
                try { this.esTipo(TipoParam.IX, v); break; } catch (e) {}
                try { this.esTipo(TipoParam.IY, v); break; } catch (e) {}
                throw new BaseError();
            case TipoParam.M:
                try { this.esTipo(TipoParam.R, v); break; } catch (e) {}
                try { this.esTipo(TipoParam.HL, v); break; } catch (e) {}
                try { this.esTipo(TipoParam.IX, v); break; } catch (e) {}
                try { this.esTipo(TipoParam.IY, v); break; } catch (e) {}
                throw new BaseError();
            /* Especiales */
            // Para mnemo rst
            case TipoParam.RST:
                if (v.tipo != TipoVal.NUMERO) throw new BaseError();
                if (v.valor > 0x38) throw new BaseError();
                if (v.valor % 8 != 0) throw new BaseError();
                break;
            // Para los que solo quieren IX o IY
            case TipoParam.RHL:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor == "hl") throw new BaseError();
                break;
            case TipoParam.RIX:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor == "ix") throw new BaseError();
                break;
            case TipoParam.RIY:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor == "iy") throw new BaseError();
                break;
            /* Para registros raros de LD */
            case TipoParam.RI:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor == "i") throw new BaseError();
                break;
            case TipoParam.RR:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor == "r") throw new BaseError();
                break;
            case TipoParam.RA:
                if (v.tipo != TipoVal.REGISTRO) throw new BaseError();
                if (v.valor == "a") throw new BaseError();
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
                if (v.valor == "sp") throw new BaseError();
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

    // Devuelve el código de operación correspondiente a una instrucción de ensamblador
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
                    } catch (e) {}
                    throw new BaseError();
                } else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
            case "add":
                if (lop.length == 1){
                    try {
                        this.esTipo(TipoParam.R, lop[0]);
                        bytes.push(128+this.ValsR[lop[0].valor]);
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.N, lop[0]);
                        bytes.push(198, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.IX, lop[0]);
                        bytes.push(0xdd, 134, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.IY, lop[0]);
                        bytes.push(0xfd, 134, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch (e) {}
                    throw new BaseError();
                } else if (lop.length == 2){
                    try {
                        this.esTipo(TipoParam.RHL, lop[0]);
                        this.esTipo(TipoParam.SS, lop[1]);
                        bytes.push(9+(this.ValsSS[lop[1].valor]<<4));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.RIX, lop[0]);
                        this.esTipo(TipoParam.PP, lop[1]);
                        bytes.push(0xdd, 9+(this.ValsPP[lop[1].valor]<<4));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.RIY, lop[0]);
                        this.esTipo(TipoParam.RR, lop[1]);
                        bytes.push(0xfd, 9+(this.ValsRR[lop[1].valor]<<4));
                        break;
                    } catch (e) {}
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
                    bytes.push(0xcb, 64+(lop[0].valor<<3)+ this.ValsR[lop[1].valor]);
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.IX, lop[1]);
                    bytes.push(0xdd, 0xcb, ...obtLittleEndianNum(lop[1].valor), 70+(lop[0].valor<<3));
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.IY, lop[1]);
                    bytes.push(0xfd, 0xcb, ...obtLittleEndianNum(lop[1].valor), 70+(lop[0].valor<<3));
                    break;
                } catch (e) {}
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
                    bytes.push(5+(this.ValsR(lop[0].valor)<<3));
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.IX, lop[0]);
                    bytes.push(0xdd, 0x35, ...obtLittleEndianNum(lop[0].valor));
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.IY, lop[0]);
                    bytes.push(0xfd, 0x35, ...obtLittleEndianNum(lop[0].valor));
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.RIX, lop[0]);
                    bytes.push(0xdd, 0x2b);
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    bytes.push(0xfd, 0x2b);
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.SS, lop[0]);
                    bytes.push(0x11+(this.ValsSS[lop[0].valor]<<4));
                    break;
                } catch (e) {}
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
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.RDE, lop[0]);
                    this.esTipo(TipoParam.RHL, lop[1]);
                    bytes.push(0xeb);
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.SP, lop[0]);
                    try {
                        this.esTipo(TipoParam.RHL, lop[1]);
                        bytes.push(0xe3);
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.RIX, lop[1]);
                        bytes.push(0xdd, 0xe3);
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.RIY, lop[1]);
                        bytes.push(0xfd, 0xe3);
                    } catch (e) {}
                    throw new BaseError();
                } catch (e) {}
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
                    bytes.push(4+(this.ValsR(lop[0].valor)<<3));
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.IX, lop[0]);
                    bytes.push(0xdd, 0x34, ...obtLittleEndianNum(lop[0].valor));
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.IY, lop[0]);
                    bytes.push(0xfd, 0x34, ...obtLittleEndianNum(lop[0].valor));
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.RIX, lop[0]);
                    bytes.push(0xdd, 0x23);
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    bytes.push(0xfd, 0x23);
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.SS, lop[0]);
                    bytes.push(0x03+(this.ValsSS[lop[0].valor]<<4));
                    break;
                } catch (e) {}
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
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.HL, lop[1]);
                        if (lop[1].valor != 0) throw new BaseError();
                        bytes.push(0xe9);
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.IX, lop[1]);
                        if (lop[1].valor != 0) throw new BaseError();
                        bytes.push(0xdd, 0xe9);
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.IY, lop[1]);
                        if (lop[1].valor != 0) throw new BaseError();
                        bytes.push(0xfd, 0xe9);
                        break;
                    } catch (e) {}
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
                    this.esTipo(TipoParam.RA, lop[0]);
                    try {
                        this.esTipo(TipoParam.RI, lop[1]);
                        bytes.push(0xed, 0x57);
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.RR, lop[1]);
                        bytes.push(0xed, 0x5f);
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.DBC, lop[1]);
                        bytes.push(0x0a);
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.DDE, lop[1]);
                        bytes.push(0x1a);
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.DIRECCION, lop[1]);
                        bytes.push(0x3a, ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch (e) {}
                    throw new BaseError();
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.IX, lop[0]);
                    try {
                        this.esTipo(TipoParam.R, lop[1]);
                        bytes.push(0xdd, 112+ValsR(lop[1].valor), ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.N, lop[1]);
                        bytes.push(0xdd, 0x36, ...obtLittleEndianNum(lop[1].valor), ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xdd, 0x2a, ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch (e) {}
                    throw new BaseError();
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.IY, lop[0]);
                    try {
                        this.esTipo(TipoParam.R, lop[1]);
                        bytes.push(0xfd, 112+ValsR(lop[1].valor), ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.N, lop[1]);
                        bytes.push(0xfd, 0x36, ...obtLittleEndianNum(lop[1].valor), ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xdf, 0x2a, ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch (e) {}
                    throw new BaseError();
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.R, lop[0]);
                    try {
                        this.esTipo(TipoParam.IX, lop[1]);
                        bytes.push(0xdd, 70 + ValsR(lop[0].valor)<<3, ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.IY, lop[1]);
                        bytes.push(0xfd, 70 + ValsR(lop[0].valor)<<3, ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.N, lop[1]);
                        bytes.push(6 + ValsR(lop[0].valor)<<3, ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.R, lop[1]);
                        bytes.push(64 + ValsR(lop[0].valor)<<3 + ValsR(lop[1].valor)<<3);
                        break;
                    } catch (e) {}
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.SP, lop[0]);
                    try {
                        this.esTipo(TipoParam.RHL, lop[1]);
                        bytes.push(0xf9);
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.RIX, lop[1]);
                        bytes.push(0xdd, 0xf9);
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.RIY, lop[1]);
                        bytes.push(0xfd, 0xf9);
                        break;
                    } catch (e) {}
                    throw new BaseError();
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.SS, lop[0]);
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(1 + this.ValsSS(lop[1].valor)<<4, ...obtLittleEndianNum(lop[1].valor));
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.DIRECCION, lop[1]);
                        bytes.push(0xed, 75 + this.ValsSS(lop[1].valor)<<4, ...obtLittleEndianNum(lop[1].valor));
                    } catch (e) {}
                    throw new BaseError();
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.DIRECCION, lop[0]);
                    try {
                        this.esTipo(TipoParam.RA, lop[1]);
                        bytes.push(0x32, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.RHL, lop[1]);
                        bytes.push(0x22, ...obtLittleEndianNum(lop[1].valor))
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.SS, lop[1]);
                        bytes.push(0xed, 67 + this.ValsSS(lop[1].valor)<<4, ...obtLittleEndianNum(lop[1].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.RIX, lop[1]);
                        bytes.push(0xdd, 0x22, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.RIY, lop[1]);
                        bytes.push(0xfd, 0x22, ...obtLittleEndianNum(lop[0].valor));
                        break;
                    } catch (e) {}
                    throw new BaseError();
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.RIX, lop[0]);
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xdd, 0x21, ...obtLittleEndianNum(lop[1].valor));
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.DIRECCION, lop[1]);
                        bytes.push(0xdd, 0x2a, ...obtLittleEndianNum(lop[1].valor));
                    } catch (e) {}
                    throw new BaseError();
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xfd, 0x21, ...obtLittleEndianNum(lop[1].valor));
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.DIRECCION, lop[1]);
                        bytes.push(0xfd, 0x2a, ...obtLittleEndianNum(lop[1].valor));
                    } catch (e) {}
                    throw new BaseError();
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.RI, lop[0]);
                    this.esTipo(TipoParam.RA, lop[0]);
                    bytes.push(0xed, 0x47);
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.RR, lop[0]);
                    this.esTipo(TipoParam.RA, lop[0]);
                    bytes.push(0xed, 0x4f);
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.DBC, lop[0]);
                    this.esTipo(TipoParam.RA, lop[0]);
                    bytes.push(0x02);
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.DDE, lop[0]);
                    this.esTipo(TipoParam.RA, lop[0]);
                    bytes.push(0x12);
                    break;
                } catch (e) {}
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
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    bytes.push(0xfd, 0xe1);
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.QQ, lop[0]);
                    bytes.push(193 + ValsQQ[lop[0].valor]<<4);
                    break;
                } catch (e) {}
                throw new BaseError();
            case "push":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                try {
                    this.esTipo(TipoParam.RIX, lop[0]);
                    bytes.push(0xdd, 0xe5);
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    bytes.push(0xfd, 0xe5);
                    break;
                } catch (e) {}
                try {
                    this.esTipo(TipoParam.QQ, lop[0]);
                    bytes.push(197 + ValsQQ[lop[0].valor]<<4);
                    break;
                } catch (e) {}
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
                    } catch (e) {}
                    try {
                        this.esTipo(TipoParam.IY, lop[0]);
                        bytes.push(0xfd, 0xcb, ...obtLittleEndianNum(lop[1].valor), 6);
                        break;
                    } catch (e) {}
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
                if (lop.length == 1) {
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
                    } catch (e) {}
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
                var exp = this.parseVals(el);
                return this.getCodigoOp(ins, el);
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