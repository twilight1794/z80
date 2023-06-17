"use strict"

/* Enums */
/**
 * Designa el tipo de símbolo reconocido en el análisis léxico
 *
 * @class TipoOp
 */
class TipoSimbolo {
    static DIRECTIVA = new TipoSimbolo("directiva");
    static FIN = new TipoSimbolo("fin");
    static BLOQUE_SI = new TipoSimbolo("if");
    static ORG = new TipoSimbolo("org");
    static MNEMO = new TipoSimbolo("mnemo");
    constructor(name){ this.name = name; }
}

/**
 * Designa un operador
 *
 * @class TipoOp
 */
class TipoOp {
    static NEG = new TipoOp("!", 2, 1);
    static COMP_1 = new TipoOp("~", 2, 1);
    static COMP_2 = new TipoOp("-", 2, 1);
    static POS = new TipoOp("+", 2, 1);
    static INV = new TipoOp("INV", 2, 1);
    static MUL = new TipoOp("*", 3, 2);
    static DIV = new TipoOp("/", 3, 2);
    static MOD = new TipoOp("%", 3, 2);
    static ADD = new TipoOp("x+", 4, 2);
    static SUB = new TipoOp("x-", 4, 2);
    static SHIFT_L = new TipoOp("<<", 5, 2);
    static SHIFT_R = new TipoOp(">>", 5, 2);
    static LT = new TipoOp("<", 6, 2);
    static LE = new TipoOp("<=", 6, 2);
    static GT = new TipoOp(">", 6, 2);
    static GE = new TipoOp(">=", 6, 2);
    static EQ = new TipoOp("==", 7, 2);
    static NEQ = new TipoOp("!=", 7, 2);
    static B_AND = new TipoOp("&", 8, 2);
    static B_XOR = new TipoOp("^", 9, 2);
    static B_OR = new TipoOp("|", 10, 2);
    static L_AND = new TipoOp("&&", 11, 2);
    static L_OR = new TipoOp("||", 12, 2);
    static OFF_P = new TipoOp("o+", 100, 2);
    static OFF_N = new TipoOp("o-", 100, 2);
    constructor(name, precedencia, aridad){
        this.name = name;
        this.precedencia = precedencia;
        this.aridad = aridad;
    }
    static obtTipo(coin){
        return Object.getOwnPropertyNames(TipoOp).filter((p) => TipoOp[p] instanceof TipoOp).map((p) => TipoOp[p] ).find((p) => p.name == coin);
    }
}

/**
 * Designa el tipo de valor tratado durante el análisis léxico y sintáctico de una expresión
 * 
 * @class TipoVal
 */
class TipoVal {
    /* Tipos terminales */
    // 45h, 44o, 1100b, 44
    static NUMERO = new TipoVal("numero");
    // A, B, D, E, F, BC, DE, HL, AF, IX, IY, SP
    static REGISTRO = new TipoVal("registro");
    // P,V,Z,S, NC, NP, NV, NZ, NS
    static BANDERA = new TipoVal("bandera");
    // C es ambiguo: puede ser un registro, o una bandera
    static AMB_C = new TipoVal("amb_c");
    // (100h), (303o)
    static DIRECCION = new TipoVal("direccion");
    // (HL), (IX), (IY+4)
    static DESPLAZAMIENTO = new TipoVal("desplazamiento");

    /* Tipos no terminales */
    // "Hola mundo"
    static CADENA = new TipoVal("cadena");
    // { } ! ~ INV * / % + - << >> < <= > >= == != & ^ | && ||
    static OP = new TipoVal("op");
    // eti1, fin
    static ETIQUETA = new TipoVal("etiqueta");
    // Coma separadora
    static SEPARADOR = new TipoVal("separador");
    // Paréntesis {}
    static PARENTESIS_AP = new TipoVal("parentesis_ap");
    static PARENTESIS_CI = new TipoVal("parentesis_ci");
    // Delimitadores de indirección ()
    static DESPLAZAMIENTO_AP = new TipoVal("desplazamiento_ap");
    static DESPLAZAMIENTO_CI = new TipoVal("desplazamiento_ci");
    constructor(name){ this.name = name; }
}

/**
 * Designa la clase de un parámetro, durante el proceso de ensamblamiento
 * 
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
    constructor(name){ this.name = name; }
}

/**
 * AST para un programa en ensamblador
 * 
 * @class ProgramaAsm
 */
class ProgramaAsm {

    // Atributos para el análisis léxico
    /**
     * Líneas de código fuente a analizar
     *
     * @memberof ProgramaAsm
     */
    lineas = []; //#

    /**
     * Listado de instrucciones cuyas referencias a etiquetas aún no han sido definidas
     * En este paso:
     * undefined -> pendiente; null -> definido parcialmente
     *
     * @memberof ProgramaAsm
     */
    instIndef = {}; //#

    /**
     * Pila que contiene los índices de los bloques en los que pudiéramos entrar.
     * Cada índice es un array, que contiene los enteros índice
     *
     * @memberof ProgramaAsm
     */
    ambitos = []; //#

    /**
     * Bandera que indica el tipo de ámbito en el cual escribir: IF-ELSE
     * Valores: 0 -> IF, 1 -> ELSE
     *
     * @type Number
     * @memberof ProgramaAsm
     */
    estadoIPC = []; //#

    /**
     * Listado de instrucciones relevantes generadas del código fuente
     *
     * @memberof ProgramaAsm
     */
    simbolos = [];

    // Atributos para el análisis sintáctico
    /**
     * Array que contiene los bytes correspondientes al código objeto
     * 
     * @memberof ProgramaAsm
     */
    bytes = [];

    /**
     * Contador de localidades
     *
     * @default 0
     * @memberof ProgramaAsm
     */
    cl = 0;

    /**
     * Dirección de inicio de ejecución
     *
     * @default 0
     * @memberof ProgramaAsm
     */
    inicio = 0;

    /**
     * Bandera que define si ignorar o no la capitalización de las directivas, mnemotécnicos y etiquetas
     *
     * @default false
     * @memberof ProgramaAsm
     */
    caseRelevante = false;

    /* Expresiones regulares */
    #r_defeti = /^([A-Za-z_\.\?][A-Za-z0-9_\.\?]*)\s*:\s*/;
    #r_eti = /^([A-Za-z_\.\?][A-Za-z0-9_\.\?]*)\s*/;
    #r_mnemo = /^([A-Z]+|[a-z]+)\s*/;
    #r_com = /^;.*$/;
    #r_num = /^((?:0x(?:(?:[0-9A-F]|[0-9a-f])+))|(?:0b[01]+)|(?:(?:[0-9A-F]|[0-9a-f])+[Hh])|(?:[01]+[Bb])|(?:[0-7]+[Oo])|(?:0[0-7]+)|(?:[0-9]+))\s*/;
    #r_op = /^(~|INV|\*|\/|%|\+|\-|<<|>>|<=|<|>=|>|==|!=|!|&|\^|&&|\|\||\|)\s*/;
    #r_cad = /^(?:"([^"]*)")\s*/;
    #r_reg = /^(BC|DE|HL|SP|AF|IX|IY|A|B|D|E|H|L|I|R)\s*/i;
    #r_band = /^(NZ|NC|PO|PE|Z|P|M)\s*/i;
    #r_amb = /^(c)[^A-Za-z_\.\?]\s*/i;
    #r_amb_e = /^(c)\s*/i;
    #r_sep = /^,\s*/;
    #r_par_l = /^\{\s*/;
    #r_par_r = /^\}\s*/;
    #r_off_l = /^\(\s*/;
    #r_off_r = /^\)\s*/;

    /* Correspondencias Símbolos-Binario */
    /** Registros (r) */
    ValsR = { "b": 0, "c": 1, "d": 2, "e": 3, "h": 4, "l": 5, "hl": 6, "a": 7 };
    /** Pares de registros (ss) */
    ValsSS = { "bc": 0, "de": 1, "hl": 2, "sp": 3 };
    /** Pares de registros (qq) */
    ValsQQ = { "bc": 0, "de": 1, "hl": 2, "af": 3 };
    /** Pares de registros (pp) */
    ValsPP = { "bc": 0, "de": 1, "ix": 2, "sp": 3 };
    /** Pares de registros (rr) */
    ValsRR = { "bc": 0, "de": 1, "iy": 2, "sp": 3 };
    /** Banderas (cc) */
    ValsCC = { "nz": 0, "z": 1, "nc": 2, "c": 3, "po": 4, "pe": 5, "p": 6, "m": 7 };

    /**
     * Valida si un parámetro es de una clase válida
     *
     * @param {TipoParam} t Clase de parámetro contra el cual validar
     * @param {Object} v Parámetro a validar
     * @return {Boolean} Si la validación es exitosa, devuelve true
     * @throws NoEsTipoExcepcion
     * @memberof ProgramaAsm
     * @see TipoParam
     */
    esTipo(t, v){
        switch (t){
            case TipoParam.R:
                if (v.tipo != TipoVal.REGISTRO && v.tipo != TipoVal.AMB_C) throw new NoEsTipoExcepcion();
                if (Object.keys(this.ValsR).indexOf(v.valor) == -1) throw new NoEsTipoExcepcion();
                break;
            case TipoParam.N:
                if (v.tipo != TipoVal.NUMERO) throw new NoEsTipoExcepcion();
                if (v.valor > 0xff || v.valor < 0) throw new NoEsTipoExcepcion();
                break;
            case TipoParam.HL:
                if (v.tipo != TipoVal.DESPLAZAMIENTO) throw new NoEsTipoExcepcion();
                if (v.registro != "hl") throw new NoEsTipoExcepcion();
                break;
            case TipoParam.IX:
                if (v.tipo != TipoVal.DESPLAZAMIENTO) throw new NoEsTipoExcepcion();
                if (v.registro != "ix") throw new NoEsTipoExcepcion();
                break;
            case TipoParam.IY:
                if (v.tipo != TipoVal.DESPLAZAMIENTO) throw new NoEsTipoExcepcion();
                if (v.registro != "iy") throw new NoEsTipoExcepcion();
                break;
            case TipoParam.NN:
                if (v.tipo != TipoVal.NUMERO) throw new NoEsTipoExcepcion();
                if (v.valor > 0xffff || v.valor < 0) throw new NoEsTipoExcepcion();
                break;
            case TipoParam.D:
                if (v.tipo != TipoVal.NUMERO) throw new NoEsTipoExcepcion();
                if (v.valor > 127 || v.valor < -128) throw new NoEsTipoExcepcion();
                break;
            case TipoParam.B:
                if (v.tipo != TipoVal.NUMERO) throw new NoEsTipoExcepcion();
                if (v.valor > 7 || v.valor < 0) throw new NoEsTipoExcepcion();
                break;
            case TipoParam.E:
                if (v.tipo != TipoVal.NUMERO) throw new NoEsTipoExcepcion();
                if (v.valor > 129 || v.valor < -126) throw new NoEsTipoExcepcion();
                break;
            case TipoParam.CC:
                if (v.tipo != TipoVal.AMB_C && v.tipo != TipoVal.BANDERA) throw new NoEsTipoExcepcion();
                if (Object.keys(this.ValsCC).indexOf(v.valor) == -1) throw new NoEsTipoExcepcion();
                break;
            case TipoParam.QQ:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (Object.keys(this.ValsSS).indexOf(v.valor) == -1) throw new NoEsTipoExcepcion();
                break;
            case TipoParam.SS:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (Object.keys(this.ValsSS).indexOf(v.valor) == -1) throw new NoEsTipoExcepcion();
                break;
            case TipoParam.PP:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (Object.keys(this.ValsPP).indexOf(v.valor) == -1) throw new NoEsTipoExcepcion();
                break;
            case TipoParam.RR:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (Object.keys(this.ValsRR).indexOf(v.valor) == -1) throw new NoEsTipoExcepcion();
                break;
            case TipoParam.S:
                try { this.esTipo(TipoParam.R, v); break; } catch {}
                try { this.esTipo(TipoParam.N, v); break; } catch {}
                try { this.esTipo(TipoParam.HL, v); break; } catch {}
                try { this.esTipo(TipoParam.IX, v); break; } catch {}
                try { this.esTipo(TipoParam.IY, v); break; } catch {}
                throw new NoEsTipoExcepcion();
            case TipoParam.M:
                try { this.esTipo(TipoParam.R, v); break; } catch {}
                try { this.esTipo(TipoParam.HL, v); break; } catch {}
                try { this.esTipo(TipoParam.IX, v); break; } catch {}
                try { this.esTipo(TipoParam.IY, v); break; } catch {}
                throw new NoEsTipoExcepcion();
            /* Especiales */
            // Para mnemónico RST
            case TipoParam.RST:
                if (v.tipo != TipoVal.NUMERO) throw new NoEsTipoExcepcion();
                if (v.valor > 0x38) throw new NoEsTipoExcepcion();
                if (v.valor % 8 != 0) throw new NoEsTipoExcepcion();
                break;
            // Para los que solo quieren IX o IY
            case TipoParam.RHL:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (v.valor != "hl") throw new NoEsTipoExcepcion();
                break;
            case TipoParam.RIX:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (v.valor != "ix") throw new NoEsTipoExcepcion();
                break;
            case TipoParam.RIY:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (v.valor != "iy") throw new NoEsTipoExcepcion();
                break;
            /* Para registros raros de LD */
            case TipoParam.RI:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (v.valor != "i") throw new NoEsTipoExcepcion();
                break;
            case TipoParam.RR:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (v.valor != "r") throw new NoEsTipoExcepcion();
                break;
            case TipoParam.DBC:
                if (v.tipo != TipoVal.DESPLAZAMIENTO) throw new NoEsTipoExcepcion();
                if (v.valor != 0) throw new NoEsTipoExcepcion();
                if (v.registro != "bc") throw new NoEsTipoExcepcion();
                break;
            case TipoParam.DDE:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (v.valor != 0) throw new NoEsTipoExcepcion();
                if (v.registro != "de") throw new NoEsTipoExcepcion();
                break;
            case TipoParam.RSP:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (v.valor != "sp") throw new NoEsTipoExcepcion();
                break;
            /* Para registros aún más raros de EX */
            case TipoParam.RAF:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (v.valor != "af") throw new NoEsTipoExcepcion();
                break;
            case TipoParam.RDE:
                if (v.tipo != TipoVal.REGISTRO) throw new NoEsTipoExcepcion();
                if (v.valor != "de") throw new NoEsTipoExcepcion();
        }
        return true;
    }

    /**
     *
     * Devuelve el código de operación correspondiente a una instrucción de ensamblador
     *
     * @param {String} ins Mnemotécnico, en minúsculas, a procesar
     * @param {Array} lop Array que contiene los parámetros pasados al mnemotécnico
     * @return {Array} Array con los bytes que representan la instrucción en código máquina
     * @memberof ProgramaAsm
     */
    #obtCodigoOp(ins, lop){
        let bytes = [];
        switch (ins){
            /* Las directivas que generan bytes en memoria serán tratadas como mnemotécnicos */
            case "DB":
                break;
            case "DFB":
                break;
            case "DFL":
                break;
            case "DFS":
                break;
            case "DLL":
                break;
            case "DWL":
                break;
            case "DWM":
                break;
            /* Mnemotécnicos reales */
            case "adc":
                if (lop.length == 1){
                    bytes = this.#obtCodigoOp("add", lop);
                    bytes[0] = bytes[0]+8;
                    break;
                } else if (lop.length == 2){
                    try {
                        this.esTipo(TipoParam.RHL, lop[0]);
                        this.esTipo(TipoParam.SS, lop[1]);
                        bytes.push(0xed, 74+(this.ValsSS[lop[1].valor]<<4));
                        break;
                    } catch {}
                    throw new TipoParametrosIncorrectoError(ins);
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
                        bytes.push(198, ...codificarValor(lop[0].valor, 1, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.IX, lop[0]);
                        bytes.push(0xdd, 134, ...codificarValor(lop[0].valor, 1, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.IY, lop[0]);
                        bytes.push(0xfd, 134, ...codificarValor(lop[0].valor, 1, true, true));
                        break;
                    } catch {}
                    throw new TipoParametrosIncorrectoError(ins);
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
                    throw new TipoParametrosIncorrectoError(ins);
                }
                else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
            case "and":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                bytes = this.#obtCodigoOp("add", lop);
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
                    bytes.push(0xdd, 0xcb, ...codificarValor(lop[1].valor, 1), 70+(lop[0].valor<<3, true, true));
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.IY, lop[1]);
                    bytes.push(0xfd, 0xcb, ...codificarValor(lop[1].valor, 1), 70+(lop[0].valor<<3, true, true));
                    break;
                } catch {}
                throw new TipoParametrosIncorrectoError(ins);
            case "call":
                if (lop.length == 1){
                    bytes.push(0xcd);
                    this.esTipo(TipoParam.NN, lop[0]);
                    bytes.push(...codificarValor(lop[1].valor, 2, true, true));
                }
                else if (lop.length == 2){
                    this.esTipo(TipoParam.CC, lop[0]);
                    this.esTipo(TipoParam.NN, lop[1]);
                    bytes.push(196+(lop[0].valor<<3), ...codificarValor(lop[1].valor, 2, true, true));
                }
                else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
                break;
            case "ccf":
                bytes.push(0x3f);
                break;
            case "cp":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                bytes = this.#obtCodigoOp("add", lop);
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
                    bytes.push(0xdd, 0x35, ...codificarValor(lop[0].valor, 1, true, true));
                } catch {}
                try {
                    this.esTipo(TipoParam.IY, lop[0]);
                    bytes.push(0xfd, 0x35, ...codificarValor(lop[0].valor, 1, true, true));
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
                throw new TipoParametrosIncorrectoError(ins);
            case "di":
                bytes.push(0xf3);
                break;
            case "djnz":
                bytes.push(0x10);
                if (lop.length == 1){
                    this.esTipo(TipoParam.E, lop[0]);
                    bytes.push(...codificarValor(lop[0].valor-2, 1, true, true));
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
                    throw new TipoParametrosIncorrectoError(ins);
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
                if (lop[0].tipo != TipoVal.Numero) throw new TipoParametrosIncorrectoError(ins,);
                switch (lop[0].valor){
                    case 0: bytes.push(0x46); break;
                    case 1: bytes.push(0x56); break;
                    case 2: bytes.push(0x5e); break;
                    default: throw new TipoParametrosIncorrectoError(ins);
                }
            case "inc":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                try {
                    this.esTipo(TipoParam.R, lop[0]);
                    bytes.push(4+(this.ValsR[lop[0].valor]<<3));
                } catch {}
                try {
                    this.esTipo(TipoParam.IX, lop[0]);
                    bytes.push(0xdd, 0x34, ...codificarValor(lop[0].valor, 1, true, true));
                } catch {}
                try {
                    this.esTipo(TipoParam.IY, lop[0]);
                    bytes.push(0xfd, 0x34, ...codificarValor(lop[0].valor, 1, true, true));
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
                throw new TipoParametrosIncorrectoError(ins);
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
                        bytes.push(0xc3, ...codificarValor(lop[0].valor, 2, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.HL, lop[1]);
                        if (lop[1].valor != 0) throw new DesplazamientoNoAdmitidoError();
                        bytes.push(0xe9);
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.IX, lop[1]);
                        if (lop[1].valor != 0) throw new DesplazamientoNoAdmitidoError();
                        bytes.push(0xdd, 0xe9);
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.IY, lop[1]);
                        if (lop[1].valor != 0) throw new DesplazamientoNoAdmitidoError();
                        bytes.push(0xfd, 0xe9);
                        break;
                    } catch {}
                    throw new TipoParametrosIncorrectoError(ins);
                }
                else if (lop.length == 2){
                    this.esTipo(TipoParam.CC, lop[0]);
                    this.esTipo(TipoParam.NN, lop[1]);
                    bytes.push(194+(this.ValsCC[lop[0].valor]<<3), ...codificarValor(lop[1].valor, 2, true, true));
                } else
                    throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
                break;
            case "jr":
                if (lop.length == 1){
                    this.esTipo(TipoParam.E, lop[0]);
                    bytes.push(0x18, ...codificarValor(lop[0].valor-2, 1, true, true));
                    break;
                } else if (lop.length == 2){
                    this.esTipo(TipoParam.CC, lop[0]);
                    this.esTipo(TipoParam.E, lop[1]);
                    switch (lop[0].valor){
                        case "c":
                            bytes.push(0x38, ...codificarValor(lop[1].valor-2, 1, true, true));
                            break;
                        case "nc":
                            bytes.push(0x30, ...codificarValor(lop[1].valor-2, 1, true, true));
                            break;
                        case "z":
                            bytes.push(0x20, ...codificarValor(lop[1].valor-2, 1, true, true));
                            break;
                        case "nz":
                            bytes.push(0x28, ...codificarValor(lop[1].valor-2, 1, true, true));
                            break;
                        default:
                            throw new TipoParametrosIncorrectoError(ins);
                    }
                    break;
                } else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
            case "ld":
                if (lop.length != 2) throw new NumeroParametrosIncorrectoError(ins, 2, lop.length);
                try {
                    this.esTipo(TipoParam.IX, lop[0]);
                    try {
                        this.esTipo(TipoParam.R, lop[1]);
                        bytes.push(0xdd, 112+this.ValsR[lop[1].valor], ...codificarValor(lop[0].valor, 1, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.N, lop[1]);
                        bytes.push(0xdd, 0x36, ...codificarValor(lop[1].valor, 1, true, true), ...codificarValor(lop[0].valor, 1, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xdd, 0x2a, ...codificarValor(lop[1].valor, 2, true, true));
                        break;
                    } catch {}
                    throw new TipoParametrosIncorrectoError(ins);
                } catch {}
                try {
                    this.esTipo(TipoParam.IY, lop[0]);
                    try {
                        this.esTipo(TipoParam.R, lop[1]);
                        bytes.push(0xfd, 112+this.ValsR[lop[1].valor], ...codificarValor(lop[0].valor, 1, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.N, lop[1]);
                        bytes.push(0xfd, 0x36, ...codificarValor(lop[1].valor, 1, true, true), ...codificarValor(lop[0].valor, 1, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xdf, 0x2a, ...codificarValor(lop[1].valor, 2, true, true));
                        break;
                    } catch {}
                    throw new TipoParametrosIncorrectoError(ins);
                } catch {}
                try {
                    this.esTipo(TipoParam.R, lop[0]);
                    try {
                        this.esTipo(TipoParam.IX, lop[1]);
                        bytes.push(0xdd, 70+(this.ValsR[lop[0].valor]<<3), ...codificarValor(lop[1].valor, 1, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.IY, lop[1]);
                        bytes.push(0xfd, 70+(this.ValsR[lop[0].valor]<<3), ...codificarValor(lop[1].valor, 1, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.N, lop[1]);
                        bytes.push(6+(this.ValsR[lop[0].valor]<<3), ...codificarValor(lop[1].valor, 1, true, true));
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
                            bytes.push(0x3a, ...codificarValor(lop[1].valor, 2, true, true));
                            break;
                        } catch {}
                    }
                    throw new TipoParametrosIncorrectoError(ins);
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
                    throw new TipoParametrosIncorrectoError(ins);
                } catch {}
                try {
                    this.esTipo(TipoParam.SS, lop[0]);
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(1+(this.ValsSS[lop[0].valor]<<4), ...codificarValor(lop[1].valor, 2, true, true));
                    } catch {}
                    try {
                        this.esTipo(TipoParam.DIRECCION, lop[1]);
                        bytes.push(0xed, 75+(this.ValsSS[lop[0].valor]<<4), ...codificarValor(lop[1].valor, 2, true, true));
                    } catch {}
                    throw new TipoParametrosIncorrectoError(ins);
                } catch {}
                try {
                    this.esTipo(TipoParam.DIRECCION, lop[0]);
                    try {
                        this.esTipo(TipoParam.RA, lop[1]);
                        bytes.push(0x32, ...codificarValor(lop[0].valor, 2, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RHL, lop[1]);
                        bytes.push(0x22, ...codificarValor(lop[1].valor, 2, true, true))
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.SS, lop[1]);
                        bytes.push(0xed, 67 + this.ValsSS[lop[1].valor]<<4, ...codificarValor(lop[1].valor, 2, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RIX, lop[1]);
                        bytes.push(0xdd, 0x22, ...codificarValor(lop[0].valor, 2, true, true));
                        break;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RIY, lop[1]);
                        bytes.push(0xfd, 0x22, ...codificarValor(lop[0].valor, 2, true, true));
                        break;
                    } catch {}
                    throw new TipoParametrosIncorrectoError(ins);
                } catch {}
                try {
                    this.esTipo(TipoParam.RIX, lop[0]);
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xdd, 0x21, ...codificarValor(lop[1].valor, 2, true, true));
                    } catch {}
                    try {
                        this.esTipo(TipoParam.DIRECCION, lop[1]);
                        bytes.push(0xdd, 0x2a, ...codificarValor(lop[1].valor, 2, true, true));
                    } catch {}
                    throw new TipoParametrosIncorrectoError(ins);
                } catch {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    try {
                        this.esTipo(TipoParam.NN, lop[1]);
                        bytes.push(0xfd, 0x21, ...codificarValor(lop[1].valor, 2, true, true));
                    } catch {}
                    try {
                        this.esTipo(TipoParam.DIRECCION, lop[1]);
                        bytes.push(0xfd, 0x2a, ...codificarValor(lop[1].valor, 2, true, true));
                    } catch {}
                    throw new TipoParametrosIncorrectoError(ins);
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
                throw new TipoParametrosIncorrectoError(ins);
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
                bytes = this.#obtCodigoOp("add", lop);
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
                throw new TipoParametrosIncorrectoError(ins);
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
                throw new TipoParametrosIncorrectoError(ins);
            case "res":
                bytes = this.#obtCodigoOp("set", lop);
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
                bytes = this.#obtCodigoOp("rlc", lop);
                bytes[3] = bytes[3]+(2<<3);
                break;
            case "rla":
                bytes.push(0x17);
                break;
            case "rlc":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                try {
                    this.esTipo(TipoParam.R, lop[0]);
                    bytes.push(0xcb, this.ValsR[lop[0].valor]);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.IX, lop[0]);
                    bytes.push(0xdd, 0xcb, ...codificarValor(lop[1].valor), 1, true, true);
                    break;
                } catch {}
                try {
                    this.esTipo(TipoParam.IY, lop[0]);
                    bytes.push(0xfd, 0xcb, ...codificarValor(lop[1].valor), 1, true, true);
                    break;
                } catch {}
                throw new TipoParametrosIncorrectoError(ins);
            case "rlca":
                bytes.push(0x07);
                break;
            case "rld":
                bytes.push(0xed, 0x6f);
                break;
            case "rr":
                bytes = this.#obtCodigoOp("rlc", lop);
                bytes[3] = bytes[3]+(3<<3);
                break;
            case "rra":
                bytes.push(0x1f);
                break;
            case "rrc":
                bytes = this.#obtCodigoOp("rlc", lop);
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
                    bytes = this.#obtCodigoOp("add", lop);
                    bytes[0] = bytes[0]+24;
                    break;
                } else if (lop.length == 2){
                    try {
                        this.esTipo(TipoParam.RHL, lop[0]);
                        this.esTipo(TipoParam.SS, lop[1]);
                        bytes.push(0xed, 66+(this.ValsSS[lop[1].valor]<<4));
                        break;
                    } catch {}
                    throw new TipoParametrosIncorrectoError(ins);
                } else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
            case "scf":
                bytes.push(0x37);
                break;
            case "set":
                bytes = this.#obtCodigoOp("set", lop);
                bytes[3] = bytes[3]+128;
                break;
            case "sla":
                bytes = this.#obtCodigoOp("rlc", lop);
                bytes[3] = bytes[3]+(4<<3);
                break;
            case "sra":
                bytes = this.#obtCodigoOp("rlc", lop);
                bytes[3] = bytes[3]+(5<<3);
                break;
            case "srl":
                bytes = this.#obtCodigoOp("rlc", lop);
                bytes[3] = bytes[3]+(7<<3);
                break;
            case "sub":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                bytes = this.#obtCodigoOp("add", lop);
                bytes[0] = bytes[0]+16;
                break;
            case "xor":
                if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
                bytes = this.#obtCodigoOp("add", lop);
                bytes[0] = bytes[0]+40;
                break;
            default:
                throw new NoImplementadoError(ins);
        }
        return bytes;
    }

/**
 *
 * Devuelve el tamaño en bytes que ocupa una instrucción ya ensamblada
 *
 * @param {String} ins Mnemotécnico, en minúsculas, a procesar
 * @param {Array} lop Array que contiene los parámetros pasados al mnemotécnico
 * @return {Number} Tamaño en bytes de la instrucción
 * @memberof ProgramaAsm
 */
#obtCodigoTam(ins, lop){
    switch (ins){
        case "adc":
            if (lop.length == 1) return this.#obtCodigoTam("add", lop);
            else if (lop.length == 2) return 2; // RHL, SS
            else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
        case "add":
            if (lop.length == 1){
                try {
                    this.esTipo(TipoParam.R, lop[0]);
                    return 1;
                } catch {}
                try {
                    this.esTipo(TipoParam.N, lop[0]);
                    return 2;
                } catch {}
                try {
                    this.esTipo(TipoParam.IX, lop[0]);
                    return 3;
                } catch {}
                try {
                    this.esTipo(TipoParam.IY, lop[0]);
                    return 3;
                } catch {}
                // A, HL -> 1
                throw new BaseError();
            } else if (lop.length == 2){
                try {
                    this.esTipo(TipoParam.RHL, lop[0]);
                    this.esTipo(TipoParam.SS, lop[1]);
                    return 1;
                } catch {}
                try {
                    this.esTipo(TipoParam.RIX, lop[0]);
                    this.esTipo(TipoParam.PP, lop[1]);
                    return 2;
                } catch {}
                try {
                    this.esTipo(TipoParam.RIY, lop[0]);
                    this.esTipo(TipoParam.RR, lop[1]);
                    return 2;
                } catch {}
                throw new BaseError();
            }
            else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
        case "and":
            if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
            return this.#obtCodigoTam("add", lop);
        case "bit":
            if (lop.length != 2) throw new NumeroParametrosIncorrectoError(ins, 2, lop.length);
            this.esTipo(TipoParam.B, lop[0]);
            try {
                this.esTipo(TipoParam.R, lop[1]);
                return 2;
            } catch {}
            try {
                this.esTipo(TipoParam.IX, lop[1]);
                return 4;
            } catch {}
            try {
                this.esTipo(TipoParam.IY, lop[1]);
                return 4;
            } catch {} // b, (HL) -> 2
            throw new BaseError();
        case "call":
            if (lop.length == 1 || lop.length == 2) return 3;
            else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
        case "ccf": return 1;
        case "cp":
            if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
            return this.#obtCodigoTam("add", lop);
        case "cpd": return 2;
        case "cpdr": return 2;
        case "cpi": return 2;
        case "cpir": return 2;
        case "cpl": return 1;
        case "daa": return 1;
        case "dec":
            if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
            try { // (HL) -> 1
                this.esTipo(TipoParam.R, lop[0]);
                return 1;
            } catch {}
            try {
                this.esTipo(TipoParam.IX, lop[0]);
                return 3;
            } catch {}
            try {
                this.esTipo(TipoParam.IY, lop[0]);
                return 3;
            } catch {}
            try {
                this.esTipo(TipoParam.RIX, lop[0]);
                return 2;
            } catch {}
            try {
                this.esTipo(TipoParam.RIY, lop[0]);
                return 2;
            } catch {}
            try {
                this.esTipo(TipoParam.SS, lop[0]);
                return 1;
            } catch {}
            throw new BaseError();
        case "di": return 1;
        case "djnz":
            if (lop.length == 1) return 2;
            else throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
        case "ei": return 1;
        case "ex":
            if (lop.length != 2) throw new NumeroParametrosIncorrectoError(ins, 2, lop.length);
            try {
                this.esTipo(TipoParam.RAF, lop[0]);
                return 1;
            } catch {}
            try {
                this.esTipo(TipoParam.RDE, lop[0]);
                return 1;
            } catch {}
            try {
                this.esTipo(TipoParam.SP, lop[0]);
                try {
                    this.esTipo(TipoParam.RHL, lop[1]);
                    return 1;
                } catch { return 2; } // SP, RIX; SP, RIY
            } catch {}
            break;
        case "exx": return 1;
        case "halt": return 1;
        case "im":
            if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
            return 2;
        case "inc":
            if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
            try { // inc (hl) -> 1
                this.esTipo(TipoParam.R, lop[0]);
                return 1;
            } catch {}
            try {
                this.esTipo(TipoParam.IX, lop[0]);
                return 3;
            } catch {}
            try {
                this.esTipo(TipoParam.IY, lop[0]);
                return 3;
            } catch {}
            try {
                this.esTipo(TipoParam.RIX, lop[0]);
                return 2;
            } catch {}
            try {
                this.esTipo(TipoParam.RIY, lop[0]);
                return 2;
            } catch {}
            try {
                this.esTipo(TipoParam.SS, lop[0]);
                return 1;
            } catch {}
            throw new BaseError();
        case "ind": return 2;
        case "indr": return 2;
        case "ini": return 2;
        case "inir": return 2;
        case "jp":
            if (lop.length == 1){
                try {
                    this.esTipo(TipoParam.HL, lop[1]);
                    if (lop[1].valor != 0) throw new BaseError();
                    return 1;
                } catch { return 2; } // NN, IX, IY
            }
            else if (lop.length == 2) return 3;
            else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
        case "jr":
            if (lop.length == 1 || lop.length == 2) return 2;
            else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
        case "ld":
            if (lop.length != 2) throw new NumeroParametrosIncorrectoError(ins, 2, lop.length);
            try {
                this.esTipo(TipoParam.IX, lop[0]);
                try {
                    this.esTipo(TipoParam.R, lop[1]);
                    return 3;
                } catch { return 4; } // IX, N; IX, NN
            } catch {}
            try {
                this.esTipo(TipoParam.IY, lop[0]);
                try {
                    this.esTipo(TipoParam.R, lop[1]);
                    return 3;
                } catch { return 4; } // IY, N; IY, NN
            } catch {}
            try {
                this.esTipo(TipoParam.R, lop[0]);
                try { // R, (HL) -> 1, (HL), R -> 1, (HL), n -> 2, HL, (nn) -> 3
                    this.esTipo(TipoParam.IX, lop[1]);
                    return 3;
                } catch {}
                try {
                    this.esTipo(TipoParam.IY, lop[1]);
                    return 3;
                } catch {}
                try {
                    this.esTipo(TipoParam.N, lop[1]);
                    return 2;
                } catch {}
                try {
                    this.esTipo(TipoParam.R, lop[1]);
                    return 1;
                } catch {}
                if (lop[0].valor == "a"){
                    try {
                        this.esTipo(TipoParam.RI, lop[1]);
                        return 2;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.RR, lop[1]);
                        return 2;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.DBC, lop[1]);
                        return 1;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.DDE, lop[1]);
                        return 1;
                    } catch {}
                    try {
                        this.esTipo(TipoParam.DIRECCION, lop[1]);
                        return 3;
                    } catch {}
                }
                throw new BaseError();
            } catch {}
            try {
                this.esTipo(TipoParam.SP, lop[0]);
                try {
                    this.esTipo(TipoParam.RHL, lop[1]);
                    return 1;
                } catch { return 2; } // SP, RIX; SP, RIY
            } catch {}
            try {
                this.esTipo(TipoParam.SS, lop[0]);
                try {
                    this.esTipo(TipoParam.NN, lop[1]);
                    return 3;
                } catch {}
                try {
                    this.esTipo(TipoParam.DIRECCION, lop[1]);
                    return 4;
                } catch {}
                throw new BaseError();
            } catch {}
            try {
                this.esTipo(TipoParam.DIRECCION, lop[0]);
                try {
                    this.esTipo(TipoParam.RA, lop[1]);
                    return 3;
                } catch {}
                try {
                    this.esTipo(TipoParam.RHL, lop[1]);
                    return 3;
                } catch { return 4; } // DIRECCION, SS; DIRECCION, RIX; DIRECCION, RIY
            } catch {}
            try {
                this.esTipo(TipoParam.RIX, lop[0]);
                return 4; // RIX, NN; RIX, DIRECCION
            } catch {}
            try {
                this.esTipo(TipoParam.RIY, lop[0]);
                return 4; // RIY, NN; RIY, DIRECCION
            } catch {}
            try {
                this.esTipo(TipoParam.RI, lop[0]);
                this.esTipo(TipoParam.RA, lop[0]);
                return 2;
            } catch {}
            try {
                this.esTipo(TipoParam.RR, lop[0]);
                this.esTipo(TipoParam.RA, lop[0]);
                return 2;
            } catch {}
            try {
                this.esTipo(TipoParam.DBC, lop[0]);
                this.esTipo(TipoParam.RA, lop[0]);
                return 1;
            } catch {}
            try {
                this.esTipo(TipoParam.DDE, lop[0]);
                this.esTipo(TipoParam.RA, lop[0]);
                return 1;
            } catch {}
            throw new BaseError();
        case "ldd": return 2;
        case "lddr": return 2;
        case "ldi": return 2;
        case "ldir": return 2;
        case "neg": return 2;
        case "nop": return 1;
        case "or":
            if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
            return this.#obtCodigoTam("add", lop);
        case "otdr": return 2;
        case "otir": return 2;
        case "outd": return 2;
        case "outi": return 2;
        case "pop":
            if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
            try {
                this.esTipo(TipoParam.QQ, lop[0]);
                return 1;
            } catch { return 2; } // RIX, RIY
        case "push":
            if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
            try {
                this.esTipo(TipoParam.QQ, lop[0]);
                return 1;
            } catch { return 2; } // RIX, RIY
        case "res":
            return this.#obtCodigoTam("set", lop);
        case "ret":
            if (lop.length == 0) return 1;
            else if (lop.length == 1) return 2; // CC
            else throw new NumeroParametrosIncorrectoError(ins, [0, 1], lop.length);
        case "reti": return 2;
        case "retn": return 2;
        case "rl": return this.#obtCodigoTam("rlc", lop);
        case "rla": return 1;
        case "rlc": // FIX: Corregir rlc: 1 parámetro siempre
            if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
            try {
                this.esTipo(TipoParam.R, lop[0]);
                return 2;
            } catch { return 4; } //IX, IY
        case "rlca": return 1;
        case "rld": return 2;
        case "rr": return this.#obtCodigoTam("rlc", lop);
        case "rra": return 1;
        case "rrc": return this.#obtCodigoTam("rlc", lop);
        case "rrca": return 1;
        case "rrd": return 1;
        case "rst":
            if (lop.length == 1) return 1; // RST
            else throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
        case "sbc":
            if (lop.length == 1) return this.#obtCodigoTam("add", lop);
            else if (lop.length == 2) return 2; // RHL, SS
            else throw new NumeroParametrosIncorrectoError(ins, [1, 2], lop.length);
        case "scf": return 1;
        case "set":
            return this.#obtCodigoTam("set", lop);
        case "sla": return this.#obtCodigoTam("rlc", lop);
        case "sra": return this.#obtCodigoTam("rlc", lop);
        case "srl": return this.#obtCodigoTam("rlc", lop);
        case "sub":
            if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
            return this.#obtCodigoTam("add", lop);
        case "xor":
            if (lop.length != 1) throw new NumeroParametrosIncorrectoError(ins, 1, lop.length);
            return this.#obtCodigoTam("add", lop);
        default:
            throw new NoImplementadoError(ins);
    }
}

    /**
     * Función auxiliar de analLexico que almacena un símbolo en el ámbito correcto
     *
     * @param {Object} obj Símbolo a almacenar
     * @see #analLexico
     * @memberof ProgramaAsm
     */
    #guardarEnAmbito(obj){
        let p = (this.estadoIPC[this.estadoIPC[this.estadoIPC.length - 1]] == 0)?"v":"f";
        if (!this.estadoIPC.length) this.simbolos.push(obj);
        else this.simbolos[this.ambitos[this.ambitos.length - 1]][p].push(obj);
    }

    /**
     *
     * Analiza léxica y sintácticamente una línea de ensamblador
     *
     * @memberof ProgramaAsm
     */
    #analLexicoSintactico(){
        let l, obj, res;
        for (let i = 0; i < this.lineas.length; i++){
            l = this.lineas[i].trim();
            if (!l.length) continue;
            obj = {};
            // Comprobar si hay etiquetas
            if (this.#r_defeti.test(l)){
                res = this.#r_defeti.exec(l);
                l = l.substring(res[0].length);
                obj.eti = ((this.caseRelevante)?res[1]:res[1].toUpperCase());
                // Añadimos la etiqueta a la lista
                plat.anadirEtiqueta(obj.eti, "loc", NaN);
                // FIX: Iterar sobre los símbolos en busca
                //if (obj.eti in this.#etisIndef) this.#etisIndef = this.#etisIndef.filter((e) => e != obj.eti);
            }
            // Comprobar si hay comentario o nada después de etiqueta
            if (!l.length || this.#r_com.test(l)){
                this.simbolos.push(obj);
                continue;
            }
            // Comprobar si hay mnemotécnico o directiva
            if (this.#r_mnemo.test(l)){
                res = this.#r_mnemo.exec(l);
                l = l.substring(res[0].length);
                obj.mnemo = ((this.caseRelevante)?res[1]:res[1].toUpperCase());
            }
            // Comprobar si hay argumentos después de mnemotécnico o directiva
            if (l.length && !this.#r_com.test(l)) obj.ops = this.parseOps(l);
            // Por último, tratar directivas selectivamente
            switch (obj.mnemo){
                case "CASE":
                    if (obj.ops && obj.ops.length == 2 && ((obj.ops[0] == 111 && obj.pos[1] == 110) || (obj.ops[0] == 79 && obj.ops[1] == 78))) this.caseRelevante = true;
                    else if (obj.ops && obj.ops.length == 3 && ((obj.ops[0] == 111 && obj.pos[1] == 102 && obj.pos[2] == 102) || (obj.ops[0] == 79 && obj.ops[1] == 70 && obj.ops[2] == 70))) this.caseRelevante = false;
                    else throw new ValorCASEInvalidoError(l);
                    break;
                case "DFS":
                    if (!obj.ops) throw new ParametroInexistenteError("DFS");
                    if (obj.ops.some((v) => v.tipo == TipoVal.SEPARADOR )) throw new MultiplesParametrosError("DFS");
                    obj.tipo = TipoSimbolo.DIRECTIVA;
                    this.#guardarEnAmbito(obj);
                    break;
                case "DFB":
                case "DWL":
                case "DWM":
                    if (!obj.ops) throw new ParametroInexistenteError(obj.mnemo);
                    obj.tipo = TipoSimbolo.DIRECTIVA;
                    this.#guardarEnAmbito(obj);
                    break;
                case "END":
                    obj.tipo = TipoSimbolo.FIN;
                    this.#guardarEnAmbito(obj);
                    return;
                case "EQU":
                    if (!obj.ops) throw new ParametroInexistenteError("EQU");
                    if (!obj.eti) throw new EtiquetaInexistenteError("EQU");
                    obj.tipo = TipoSimbolo.DIRECTIVA;
                    this.#guardarEnAmbito(obj);
                    break;
                case "IF":
                    obj.tipo = TipoSimbolo.BLOQUE_SI;
                    obj.v = [];
                    obj.f = [];
                    this.#guardarEnAmbito(obj);
                    this.estadoIPC.push(0);
                    this.ambitos.push(this.simbolos.length - 1);
                    break;
                case "ELSE":
                    this.estadoIPC[this.estadoIPC.length - 1] = 1;
                    break;
                case "ENDI":
                    if (this.estadoIPC.length == 0) throw new DirectivaENDIError();
                    this.estadoIPC.pop();
                    this.ambitos.pop();
                    break;
                case "INCL":
                    if (!obj.ops) throw new ParametroInexistenteError("INCL");
                    if (this.#r_cad.test(l)){
                        let arr = plat.cargarArchivoEnsamblador(this.#r_cad.exec(l)[1]);
                        for (let j = 0; j<arr.length; j++) this.lineas.splice(i+j, 1, arr[j]);
                    } else throw new TipoParametrosIncorrectoError("INCL");
                    break;
                case "ORG":
                    if (!obj.ops) throw new ParametroInexistenteError("ORG");
                    obj.tipo = TipoSimbolo.ORG;
                    this.#guardarEnAmbito(obj);
                    break;
                case "CPU":
                case "HEX":
                case "HOF":
                case "LIST":
                    plat.escribirLog(TipoLog.AVISO, _("av_directiva_ignorada", {"d": obj.mnemo}));
                    continue;
                default:
                    obj.tipo = TipoSimbolo.MNEMO;
                    this.#guardarEnAmbito(obj);
            }
        }
    }

    /**
     * Analiza léxica, sintáctica y semánticamente la sección de operandos de una instrucción
     *
     * @param {String} exp Cadena de caracteres a analizar léxica y sintácticamente
     * @return {Array} Array de objetos que representan el tipo de dato y el valor
     * @memberof ProgramaAsm
     */
    parseOps(exp){
        /* Análisis léxico/sintáctico */
        let sims = [];
        let res; // Resultado de la regex
        let cexp = exp;
        let ult = { tipo: null }; // Último símbolo utilizado
        while (cexp){
            let obj = {};
            if (this.#r_num.test(cexp)){
                res = this.#r_num.exec(cexp);
                cexp = cexp.substring(res[0].length);
                if (!(ult.tipo == null || ult.tipo == TipoVal.PARENTESIS_AP || ult.tipo == TipoVal.DESPLAZAMIENTO_AP || ult.tipo == TipoVal.OP || ult.tipo == TipoVal.SEPARADOR)) throw new ExpresionInvalidaError(TipoVal.NUMERO);
                obj.tipo = TipoVal.NUMERO;
                obj.valor = (() => {
                    if (res[1].startsWith("0x")) return parseInt(res[1].slice(2), 16);
                    else if (res[1].startsWith("0b")) return parseInt(res[1].slice(2), 2);
                    else if (res[1].endsWith("H") || res[1].endsWith("h")) return parseInt(res[1].slice(0, res[1].length - 1), 16);
                    else if (res[1].endsWith("B") || res[1].endsWith("b")) return parseInt(res[1].slice(0, res[1].length - 1), 2);
                    else if (res[1].endsWith("O") || res[1].endsWith("o")) return parseInt(res[1].slice(0, res[1].length - 1), 8);
                    else if (res[1].startsWith("0")) return parseInt(res[1], 8);
                    else return parseInt(res[1]);
                })();
            } else if (this.#r_reg.test(cexp)){
                res = this.#r_reg.exec(cexp);
                cexp = cexp.substring(res[0].length);
                if (!(ult.tipo == null || ult.tipo == TipoVal.DESPLAZAMIENTO_AP || ult.tipo == TipoVal.SEPARADOR)) throw new ExpresionInvalidaError(TipoVal.REGISTRO);
                obj.tipo = TipoVal.REGISTRO;
                obj.valor = res[1].toLowerCase();
            } else if (this.#r_band.test(cexp)){
                res = this.#r_band.exec(cexp);
                cexp = cexp.substring(res[0].length);
                if (ult.tipo != null) throw new ExpresionInvalidaError(TipoVal.BANDERA);
                obj.tipo = TipoVal.BANDERA;
                obj.valor = res[1].toLowerCase();
            } else if (this.#r_amb.test(cexp)){
                res = this.#r_amb_e.exec(cexp);
                cexp = cexp.substring(res[0].length);
                if (!(ult.tipo == null || ult.tipo == TipoVal.DESPLAZAMIENTO_AP || ult.tipo == TipoVal.SEPARADOR)) throw new ExpresionInvalidaError(TipoVal.AMB_C);
                obj.tipo = TipoVal.AMB_C;
                obj.valor = "c";
            } else if (this.#r_cad.test(cexp)){
                res = this.#r_cad.exec(cexp);
                cexp = cexp.substring(res[0].length);
                if (ult.tipo != TipoVal.SEPARADOR && ult.tipo != null) throw new ExpresionInvalidaError(TipoVal.CADENA);
                obj.tipo = TipoVal.CADENA;
                obj.valor = res[1];
            } else if (this.#r_op.test(cexp)){
                res = this.#r_op.exec(cexp);
                cexp = cexp.substring(res[0].length);
                let disamb = ""; // Indicador de aridad en el operador
                obj.aridad = 2;
                if (ult.tipo == TipoVal.REGISTRO){
                    if (res[1] == "+" || res[1] == "-"){
                        disamb = "o";
                        obj.aridad = 1;
                    }
                } else if (ult.tipo == TipoVal.NUMERO || ult.tipo == TipoVal.ETIQUETA || ult.tipo == TipoVal.PARENTESIS_CI){
                    if (res[1] == "+" || res[1] == "-") disamb = "x";
                }
                if (ult.tipo == TipoVal.CADENA || (ult.tipo == TipoVal.OP && obj.aridad != 1)) throw new ExpresionInvalidaError(TipoVal.OP);
                obj.tipo = TipoVal.OP;
                obj.valor = TipoOp.obtTipo(disamb+res[1]);
                if (obj.valor == TipoOp.NEG || obj.valor == TipoOp.COMP_1 || obj.valor == TipoOp.COMP_2  || obj.valor == TipoOp.POS || obj.valor == TipoOp.INV) obj.aridad = 1;
                if ((obj.aridad == 1 && !(
                    ult.tipo == TipoVal.PARENTESIS_AP ||
                    ult.tipo == TipoVal.PARENTESIS_CI ||
                    (ult.tipo == TipoVal.OP && ult.aridad == 2) ||
                    ult.tipo == null ||
                    (ult.tipo == TipoVal.REGISTRO && (obj.valor == TipoOp.OFF_P || obj.valor == TipoOp.OFF_N))
                )) ||
                (obj.aridad == 2 && !(
                    ult.tipo == TipoVal.NUMERO ||
                    ult.tipo == TipoVal.PARENTESIS_CI ||
                    ult.tipo == TipoVal.ETIQUETA
                ))) throw new ExpresionInvalidaError(TipoVal.OP);
            } else if (this.#r_eti.test(cexp)){
                res = this.#r_eti.exec(cexp);
                cexp = cexp.substring(res[0].length);
                if (!(ult.tipo == null || ult.tipo == TipoVal.PARENTESIS_AP || ult.tipo == TipoVal.DESPLAZAMIENTO_AP || ult.tipo == TipoVal.OP || ult.tipo == TipoVal.SEPARADOR)) throw new ExpresionInvalidaError(TipoVal.ETIQUETA);
                obj.tipo = TipoVal.ETIQUETA;
                obj.nombre = res[1];
            } else if (this.#r_com.test(cexp)){
                res = this.#r_com.exec(cexp);
                cexp = cexp.substring(res[0].length);
            } else if (this.#r_sep.test(cexp)){
                res = this.#r_sep.exec(cexp);
                cexp = cexp.substring(res[0].length);
                if (ult.tipo == null || ult.tipo == TipoVal.SEPARADOR || (ult.tipo == TipoVal.OP && ult.valor)) throw new ExpresionInvalidaError(TipoVal.SEPARADOR);
                obj.tipo = TipoVal.SEPARADOR;
            } else if (this.#r_par_l.test(cexp)){
                res = this.#r_par_l.exec(cexp);
                cexp = cexp.substring(res[0].length);
                if (!(ult.tipo == null || ult.tipo == TipoVal.PARENTESIS_AP || ult.tipo == TipoVal.DESPLAZAMIENTO_AP || ult.tipo == TipoVal.OP || ult.tipo == TipoVal.SEPARADOR)) throw new ExpresionInvalidaError(TipoVal.PARENTESIS_AP);
                obj.tipo = TipoVal.PARENTESIS_AP;
            } else if (this.#r_par_r.test(cexp)){
                res = this.#r_par_r.exec(cexp);
                cexp = cexp.substring(res[0].length);
                if (!(ult.tipo == TipoVal.NUMERO || ult.tipo == TipoVal.ETIQUETA || ult.tipo == TipoVal.REGISTRO || ult.tipo == TipoVal.PARENTESIS_CI)) throw new ExpresionInvalidaError(TipoVal.PARENTESIS_CI);
                obj.tipo = TipoVal.PARENTESIS_CI;
            } else if (this.#r_off_l.test(cexp)){
                res = this.#r_off_l.exec(cexp);
                cexp = cexp.substring(res[0].length);
                if (!(ult.tipo == null || ult.tipo == TipoVal.SEPARADOR)) throw new ExpresionInvalidaError(TipoVal.DESPLAZAMIENTO_AP);
                obj.tipo = TipoVal.DESPLAZAMIENTO_AP;
            } else if (this.#r_off_r.test(cexp)){
                res = this.#r_off_r.exec(cexp);
                cexp = cexp.substring(res[0].length);
                if (!(ult.tipo == TipoVal.NUMERO || ult.tipo == TipoVal.ETIQUETA || ult.tipo == TipoVal.REGISTRO || ult.tipo == TipoVal.PARENTESIS_CI)) throw new ExpresionInvalidaError(TipoVal.DESPLAZAMIENTO_CI);
                obj.tipo = TipoVal.DESPLAZAMIENTO_CI;
            } else throw new ExpresionInvalidaError(cexp);
            ult = obj;
            sims.push(obj);
        }

        /* Análisis semántico */
        /* Esto es básicamente el algoritmo shunting-yard */
        let simsp = []; // Cola de salida
        let pila = []; // Pila de operadores
        let t1, t2; // Variables temporales
        let c; // Bandera de conformidad
        let u = 0; // Contador de operadores unarios
        while (sims.length){
            let sim = sims.shift();
            switch (sim.tipo){
                case TipoVal.NUMERO:
                case TipoVal.REGISTRO:
                case TipoVal.BANDERA:
                case TipoVal.AMB_C:
                    simsp.push(sim);
                    if (u){
                        simsp.push(pila.pop());
                        u--;
                    }
                    break;
                case TipoVal.CADENA:
                    for (let l of sim.valor)
                        simsp.push({ "tipo": TipoVal.NUMERO, "valor": l.codePointAt() }, { "tipo": TipoVal.SEPARADOR });
                    simsp.pop(); // El último separador en realidad no va
                    break;
                case TipoVal.OP:
                    if (sim.aridad == 1) u++;
                    else {
                        while (pila.length){
                            t1 = pila.pop();
                            if (t1.tipo == TipoVal.OP && (t1.precedencia <= sim.precedencia)) simsp.push(t1);
                            else {
                                pila.push(t1);
                                break;
                            }
                        }
                    }
                    pila.push(sim);
                    break;
                case TipoVal.ETIQUETA:
                    t1 = plat.obtenerEtiqueta(sim.valor)[0];
                    simsp.push((t1?({ "tipo": TipoVal.NUMERO, "valor": sim.valor }):sim));
                    break;
                case TipoVal.SEPARADOR:
                    simsp.push(sim);
                    break;
                case TipoVal.PARENTESIS_AP:
                    pila.push(sim);
                    break;
                case TipoVal.PARENTESIS_CI:
                    c = false;
                    while (pila.length){
                        t1 = pila.pop();
                        if (t1.tipo == TipoVal.PARENTESIS_AP){
                            c = true;
                            break;
                        } else simsp.push(t1);
                    }
                    if (!c) throw new ExpresionInvalidaError("");
                    if (u){
                        simsp.push(pila.pop());
                        u--;
                    }
                    break;
                case TipoVal.DESPLAZAMIENTO_AP:
                    pila.push(sim);
                    t1 = sims.shift();
                    if (t1.tipo == TipoVal.REGISTRO){
                        t2 = { "tipo": TipoVal.DESPLAZAMIENTO, "valor": 0, "registro": t1.valor };
                        let t3 = sims.shift();
                        if (t3.valor == TipoOp.OFF_P) t2.sentido = true;
                        else if (t3.valor == TipoOp.OFF_N) t2.sentido = false;
                        else sims.unshift(t3);
                    } else {
                        t2 = { "tipo": TipoVal.DIRECCION, "valor": 0 };
                        sims.unshift(t1);
                    }
                    simsp.push(t2);
                    break;
                case TipoVal.DESPLAZAMIENTO_CI:
                    c = false;
                    while (pila.length){
                        t1 = pila.pop();
                        if (t1.tipo == TipoVal.DESPLAZAMIENTO_AP){
                            c = true;
                            break;
                        } else simsp.push(t1);
                    }
                    if (!c) throw new ExpresionInvalidaError("");
                    if (u){
                        simsp.push(pila.pop());
                        u--;
                    }
                    simsp.push(sim);
                    break;
            }
        }
        while (pila.length){
            t1 = pila.pop();
            if (t1.tipo == TipoVal.PARENTESIS_AP || t1.tipo == TipoVal.PARENTESIS_CI || t1.tipo == TipoVal.DESPLAZAMIENTO_AP || t1.tipo == TipoVal.DESPLAZAMIENTO_CI)
                throw new ExpresionInvalidaError("");
            simsp.push(t1);
        }

        /* Separar argumentos */
        let simsa = [[]];
        for (let i = 0; i<simsp.length; i++){
            if (simsp[i].tipo == TipoVal.SEPARADOR) simsa.push([]);
            else simsa[simsa.length - 1].push(simsp[i]);
        }
        return simsa;
    }

    /**
     * Reduce una lista de símbolos lo máximo posible en el momento de la llamada, ejecutando las operaciones representadas y substituyendo las etiquetas
     *
     * @param {Array} sims Array de símbolos a reducir
     * @return {Array} Array de símbolos reducidos
     * @memberof ProgramaAsm
     */
    reducirExpresion(sims){
        let simsw = sims;
        let simsp = [];
        let sim;
        let op1, op2;
        while (simsw.length){
            console.log(JSON.stringify(simsp));
            console.warn(JSON.stringify(simsw));
            sim = simsw.shift();
            if (sim.tipo == TipoVal.OP){
                switch (sim.valor){
                    case TipoOp.NEG:
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": op1.valor?1:0
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.COMP_1:
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": Plataforma.obtComplemento(codificarValor(op1.valor, 4, true, true), 1, 1)
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.COMP_2:
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": Plataforma.obtComplemento(codificarValor(op1.valor, 4, true, true), 1, 1)
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.POS:
                        // op1 = simsp.pop();
                        // if (op1 && op1.tipo == TipoVal.NUMERO) simsp.push(op1);
                        break;
                    case TipoOp.INV:
                        if (op1 && op1.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": parseInt(Array.from(codificarValor(op1.valor, 4, true, true).toString(2).padStart(8, "0")).reverse().join(""))
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.MUL:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": op1.valor*op2.valor
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.DIV:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO){
                            if (op2.valor == 0) throw new DivisionCeroError();
                            simsp.push({
                                "tipo": TipoVal.NUMERO,
                                "valor": Math.floor(op1.valor/op2.valor)
                            });
                        }
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.MOD:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": op1.valor%op2.valor
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.ADD:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": op1.valor+op2.valor
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.SUB:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": op1.valor-op2.valor
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.SHIFT_L:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": op1.valor<<op2.valor
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.SHIFT_R:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": op1.valor>>op2.valor
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.LT:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": (op1.valor<op2.valor)?1:0
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.LE:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": (op1.valor<=op2.valor)?1:0
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.GT:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": (op1.valor>op2.valor)?1:0
                        });
                        break;
                    case TipoOp.GE:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": (op1.valor>=op2.valor)?1:0
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.EQ:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": (op1.valor==op2.valor)?1:0
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.NEQ:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": (op1.valor!=op2.valor)?1:0
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.B_AND:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": Plataforma.obtAnd(codificarValor(op1.valor, 4, true, true), codificarValor(op2.valor, 4, true, true))
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.B_XOR:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": Plataforma.obtXor(codificarValor(op1.valor, 4, true, true), codificarValor(op2.valor, 4, true, true))
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.B_OR:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": Plataforma.obtOr(codificarValor(op1.valor, 4, true, true), codificarValor(op2.valor, 4, true, true))
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.L_AND:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": (op1.valor && op2.valor)?1:0
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                    case TipoOp.L_OR:
                        op2 = simsp.pop();
                        op1 = simsp.pop();
                        if (op1 && op1.tipo == TipoVal.NUMERO && op2 && op2.tipo == TipoVal.NUMERO) simsp.push({
                            "tipo": TipoVal.NUMERO,
                            "valor": (op1.valor || op2.valor)?1:0
                        });
                        else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                        break;
                }
            } else if (sim.tipo == TipoVal.DESPLAZAMIENTO_CI){
                op1 = simsp.pop();
                op2 = simsp.pop();
                if (op1 && op2 && op1.tipo == TipoVal.NUMERO){
                    if (op2.tipo == TipoVal.DIRECCION) op2.valor = op1.valor;
                    else if (op2.tipo == TipoVal.DESPLAZAMIENTO) op2.valor = op1.valor*((op2.sentido)?1:-1);
                    else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
                    simsp.push(op2);
                } else throw new TipoParametrosIncorrectoError("fix"); // FIX: fix
            } else if (sim.tipo == TipoVal.ETIQUETA){
                op1 = plat.obtenerEtiqueta(sim.nombre);
                if (op1[0] == undefined) throw new EtiquetaIndefinidaError(sim.nombre);
                else if (isNaN(op1[0])){
                    simsp.push(sim);
                    return [...simsp, ...simsw];
                }
                else simsp.push({ "tipo": TipoVal.NUMERO, "valor": op1[0] });
            } else simsp.push(sim);
        }
        return simsp;
    }

    /**
     * Analiza semánticamente una línea de ensamblador, resolviendo todas las referencias faltantes
     * 
     * Si este punto se resuelve correctamente, la línea de ensamblador es completamente válida y puede ser ensamblada en código objeto
     *
     * @param {Number} fin Tiempo máximo de ejecución
     * @memberof ProgramaAsm
     */
    #analSemantico(fin){
        let finalizado = false;
        let op1, inst, eti;
        while (!finalizado){
            finalizado = true;
            this.cl = parseInt(localStorage.getItem("txtEnsOrg"));
            if (Date.now() > fin) throw new BucleInfinitoError();
            for (let i = 0; i<this.simbolos.length; i++){
                inst = this.simbolos[i];
                // Etiqueta
                if (inst.eti){
                    eti = plat.obtenerEtiqueta(inst.eti);
                    plat.modificarEtiqueta(inst.eti, this.cl); // Quité "if (!eti[0])", siempre es verdadero
                }
                // Operandos
                if (inst.ops){
                    for (let j = 0; j<inst.ops.length; j++){
                        inst.ops[j] = this.reducirExpresion(inst.ops[j]);
                        if (inst.ops[j].length > 1){
                            finalizado = false;
                            continue;
                        }
                    }
                }
                //tam = this.#obtCodigoTam(inst.mnemo);
                //this.cl += tam;
            }
        }
    }

    constructor(nom){
        try {
            this.cl = parseInt(localStorage.getItem("txtEnsOrg"));
            this.lineas = plat.cargarArchivoEnsamblador(nom);
            this.#analLexicoSintactico();
            /* Esto es para evitar bucles infinitos por referencias recursivas */
            const fin = Date.now() + parseFloat(localStorage.getItem("txtPlatTMEns"));
            this.#analSemantico(fin);
        } catch (e){
            plat.escribirLog(TipoLog.ERROR, e.message);
            console.error(e);
            throw e;
        }
    }
      
        /*for (let l of lineas){
            try {
                /
                Esto puede devolver un valor de tipo:
                  - Array: la instrucción se resolvió correctamente
                  - Object: faltan etiquetas a resolver
                  - undefined: la línea está vacía
                *
                let bytes = this.analLexSint(l);
                this.bytes.push(...bytes);
                this.cl += bytes.length;
            } catch (e){
                console.log(e);
                break;
            }
        }
        while (true){
            
        }
    }*/
}
