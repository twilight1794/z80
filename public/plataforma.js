"use strict"

// Enums
/**
 * Tipo de mensaje de registro
 *
 * @class TipoLog
 */
class TipoLog {
    static INFO = new TipoLog("info");
    static AVISO = new TipoLog("aviso");
    static ERROR = new TipoLog("error");
    constructor(name){ this.name = name; }
}

/**
 * Tipo de símbolo, para propósitos de representación en la interfaz
 *
 * @class TipoOpEns
 */
class TipoOpEns {
    static NUMERO = new TipoOpEns("numero");
    static REGISTRO = new TipoOpEns("registro");
    static REGISTRO_PAR = new TipoOpEns("registro_par");
    static BANDERA = new TipoOpEns("bandera");
    static DIRECCION = new TipoOpEns("direccion");
    static DIRECCION_R = new TipoOpEns("direccion_r");
    static DESPLAZAMIENTO = new TipoOpEns("desplazamiento");
    static BIT = new TipoOpEns("bit");
    constructor(name){ this.name = name; }
}

class Estado {
    static LISTO = new Estado("listo");
    static EJECUCION = new Estado("ejecucion");
    static ESPERA = new Estado("espera");
    constructor(name){ this.name = name; }
}

/* Funciones útiles de interpretación de bytes */

/**
 * Dado un valor entero, devuelve los bytes que deben escribirse en memoria
 * Considera el signo y el endianness
 * 
 * @param {Number} x Número a procesar
 * @param {Number} t Tamaño en bytes del valor a escribir
 * @param {Boolean} e Si verdadero, indica que el valor será little-endian, de lo contrario, big-endian
 * @param {Boolean} s Si verdadero, indica que el valor es signado, de lo contrario, es no signado
 * @return {Array<Number>} Array con los bytes a escribir
 * @see decodificarValor
 */
function codificarValor(x, t, e){
    let rango = Math.pow(256, t);
    let max = rango-1;
    let min = (-rango)/2;
    x %= rango;

    /* Signo */
    let n = ((x> -1)?x:Plataforma.obtComplemento(x, t, 2)).toString(16).padStart(t*2, "0").match(/.{2}/g);
    /* Endianness */
    return (e?([...n].reverse()):n).map((p) => parseInt(p, 16));
}

/**
 * Dado un valor codificado, devuelve el valor real, según sus características
 *
 * @param {Array<Number>} x Array de bytes codificado en memoria
 * @param {Number} t Tamaño en bytes del valor a escribir
 * @param {Boolean} e Si verdadero, indica que el valor será little-endian, de lo contrario, big-endian
 * @param {Boolean} s Si verdadero, indica que el valor es signado, de lo contrario, es no signado
 * @return {Number} Valor real representado
 * @see codificarValor
 */
function decodificarValor(x, t, e, s){
    /* Endianness */
    let n = ((e?([...x].reverse()):x).reduce((a, b) => a + b.toString(16), ""));

    /* Signo */
    let val = parseInt(n, 16);
    let rango = Math.pow(256, t);
    let max = rango/(s?2:1)-1;
    return (val>max)?(Plataforma.obtComplemento(val, t, 2)*-1):val;
}

/**
 * Dado el código de un caracter en la codificación US-ASCII, devuelve el caracter que lo representa visualmente
 *
 * @param {Number} n Punto de código del caracter
 * @return {String} Caracter representativo
 */
function ASCIIaCar(n){
    if (n == 127 || n < 32) return String.fromCharCode(9216 + n);
    else if (n > 127) return "�";
    else return String.fromCharCode(n);
}

/**
 * Clase que representa una CPU
 *
 * @class Plataforma
 */
class Plataforma {

    /**
     * Bandera que indica si hay algún programa en ejecución
     *
     * @memberof Plataforma
     */
    estado;

    /* Correspondencias Binario-Símbolos */
    /** Registros (r) */
    ValsR = ["b", "c", "d", "e", "h", "l", "hl", "a"];
    /** Pares de registros (ss) */
    ValsSS = ["bc", "de", "hl", "sp"];
    /** Pares de registros (qq) */
    ValsQQ = ["bc", "de", "hl", "af"];
    /** Pares de registros (pp) */
    ValsPP = ["bc", "de", "ix", "sp"];
    /** Pares de registros (rr) */
    ValsRR = ["bc", "de", "iy", "sp"];
    /** Banderas (cc) */
    ValsCC = ["nz", "z", "nc", "c", "po", "pe", "p", "m"];

    /* Funciones para operaciones */

    static obtAnd(op1, op2){
        let res = "";
        let a1 = op1.toString(2).padStart(8, "0");
        let a2 = op2.toString(2).padStart(8, "0");
        for (let i = 0; i<op1.length; i++){
            if (a1[i] == "1" && a2[i] == "1") res += "1";
            else res += "0";
        }
        return res;
    }

    static obtOr(op1, op2){
        let res = "";
        let a1 = op1.toString(2).padStart(8, "0");
        let a2 = op2.toString(2).padStart(8, "0");
        for (let i = 0; i<op1.length; i++){
            if (a1[i] == "1" || a2[i] == "1") res += "1";
            else res += "0";
        }
        return res;
    }

    static obtXor(op1, op2){
        let res = "";
        let a1 = op1.toString(2).padStart(8, "0");
        let a2 = op2.toString(2).padStart(8, "0");
        for (let i = 0; i<op1.length; i++){
            if (a1[i] == "1" && a2[i] == "1") res += "0";
            else if (a1[i] == "0" && a2[i] == "0") res += "0";
            else res += "1";
        }
        return res;
    }

    static obtRLC(op){
        let c = (op&128);
        let v = (op<<1)|((c==128)?1:0);
        return [v, c];
    }

    static obtRL(op, c){
        let b = (op&128);
        let v = (op<<1)|(c?1:0);
        return [v, b];
    }

    static obtRRC(op){
        let c = (op&1);
        let v = (op>>1)|((c==1)?128:0);
        return [v, c];
    }

    static obtRR(op, c){
        let b = (op&1);
        let v = (op>>1)|(c?128:0);
        return [v, b];
    }

    static obtSLA(op){
        let c = (op&128);
        let v = (op<<1)|254;
        return [v, c];
    }

    static obtSRA(op){
        let c = (op&1);
        let b = (op&128);
        let v = (op>>1)+b;
        return [v, c];
    }

    static obtSRL(op){
        let c = (op&1);
        let v = (op>>1)|127;
        return [v, c];
    }

    /**
     * 
     * Devuelve el complemento a 1 o 2 de un valor
     *
     * @param {Number} x Valor a complementar
     * @param {Number} t Tamaño en bytes del valor
     * @param {Number} o Tipo de operación: n para complemento a n
     * @return {Number} Valor complementado
     * @memberof Plataforma
     */
    static obtComplemento(x, t, o){
        return parseInt(Array.from(Math.abs(x).toString(2).padStart(t*8, "0")).map((d) => ((d == "1")?"0":"1") ).join(""), 2) + (o-1);
    }

    /* Funciones para manejar la plataforma */

    /**
     * Carga y procesa un archivo en ensamblador para su posterior ensamblado
     *
     * @param {String} nom Nombre del archivo a cargar
     * @return {Array<String>} Array que contiene las líneas de ensamblador del archivo
     * @memberof Plataforma
     */
    cargarArchivoEnsamblador(nom){
        let t = localStorage.getItem("archivo_"+nom) || "";
        t = buscarMacros(t);
        return t.split("\n");
    }

    /**
     * Escribe en memoria una secuencia de bytes
     *
     * @param {Number} dir Dirección desde la cual empezar a escribir
     * @param {Array<Number>} bytes Array con los bytes a escribir
     * @memberof Plataforma
     */
    cargarBytes(dir, bytes){
        for (let i=0; i<bytes.length; i++){
            this.escribirMemoria(dir+i, bytes[i]);
        }
    }

    /**
     * Lee un byte de la memoria, y devuelve su valor
     *
     * @param {Number} dir Dirección de memoria a leer
     * @return {Number} Valor de la posición de memoria
     * @memberof Plataforma
     */
    leerMemoria(dir){
        let t = parseInt(localStorage.getItem("selPlatMem"));
        if (dir < 0 || t < dir) throw new DireccionInvalidaError(dir);
        let s = Math.trunc(dir/16);
        let d = dir%16;
        let p = document.querySelector("#r-mem table").tBodies[0].rows;
        return parseInt(p[s].cells[1+d].textContent, 16);
    }

    /**
     * Lee dos bytes de la memoria, los interpreta como una palabra, y devuelve su valor
     *
     * @param {Number} dir Dirección de inicio de la palabra a leer
     * @return {Number} Valor de la palabra
     * @memberof Plataforma
     */
    leerPalabra(dir){
        let l = this.leerMemoria(dir);
        let h = this.leerMemoria(dir+1);
        return (h<<8)+l;
    }

    /**
     * Escribe sobre un byte de la memoria
     *
     * @param {Number} dir Dirección de memoria a escribir
     * @param {Number} val Valor a escribir sobre la dirección especificada
     * @memberof Plataforma
     */
    escribirMemoria(dir, val){
        let t = parseInt(localStorage.getItem("selPlatMem"));
        if (dir < 0 || t < dir) throw new DireccionInvalidaError(dir);
        if (val > 255) throw new ValorTamanoError(1);
        let s = Math.trunc(dir/16);
        let d = dir%16;
        let p = document.querySelector("#r-mem table").tBodies[0].rows;
        p[s].cells[1+d].textContent = val.toString(16).padStart(2, "0").toUpperCase();
        p[s].cells[17+d].textContent = ASCIIaCar(val);
    }

    /**
     * Escribe una palabra en la memoria, sobre 2 bytes de la memoria
     *
     * @param {Number} dir Dirección de inicio de la palabra a leer
     * @param {Number} val Valor a escribir sobre la dirección especificada
     * @memberof Plataforma
     */
    escribirPalabra(dir, val){
        if (val > 65535) throw new ValorTamanoError(2);
        let l = (val & 0xff);
        let h = (val & 0xff00)>>8;
        this.escribirMemoria(dir, l);
        this.escribirMemoria(dir+1, h);
    }

    /**
     * Lee un registro, y devuelve su valor
     * Para los nombres de los registros alternativos, substituir el apóstrofo por una X
     *
     * @param {String} reg Registro a leer
     * @return {Number} Valor contenido en el registro
     * @memberof Plataforma
     */
    leerRegistro(reg){
        reg = reg.toLowerCase();
        let red;
        switch(reg){
            case "a":
            case "b":
            case "c":
            case "d":
            case "e":
            case "h":
            case "l":
            case "i":
            case "r":
            case "ax":
            case "bx":
            case "cx":
            case "dx":
            case "ex":
            case "hx":
            case "lx":
                return parseInt(document.getElementById("v-"+reg).textContent, 16);
            case "ix":
            case "iy":
            case "sp":
            case "pc":
                return parseInt(document.getElementById("v-"+reg).textContent, 16);
            case "bc":
            case "de":
            case "hl":
            case "bcx":
            case "dex":
            case "hlx":
                return parseInt(document.getElementById("v-"+reg[0]+((reg.length == 3)?"x":"")).textContent + document.getElementById("v-"+reg[1]+((reg.length == 3)?"x":"")).textContent, 16);
            case "f":
            case "fx":
                return Array.from(document.querySelectorAll("#r-f td:nth-child("+((reg=="f")?2:4)+")")).reverse().reduce((a, v, i) => a + ((v.classList.contains("activo")?1:0)<<i), 0);
        }
    }

    /**
     * Escribe un valor sobre un registro
     *
     * @param {String} reg Registro a escribir
     * @param {Number} val Valor a escribir
     * @memberof Plataforma
     */
    escribirRegistro(reg, val){
        if (val instanceof Array) val = decodificarValor(val, val.length, true, false);
        reg = reg.toLowerCase();
        switch(reg){
            case "a":
            case "b":
            case "c":
            case "d":
            case "e":
            case "h":
            case "l":
            case "i":
            case "r":
            case "ax":
            case "bx":
            case "cx":
            case "dx":
            case "ex":
            case "hx":
            case "lx":
                if (val > 255) throw new ValorTamanoError(val, 1);
                document.getElementById("v-"+reg).textContent = val.toString(16).toUpperCase().padStart(2, "0");
                break;
            case "ix":
            case "iy":
            case "sp":
            case "pc":
                if (val > 65535) throw new ValorTamanoError(val, 1);
                document.getElementById("v-"+reg).textContent = val.toString(16).toUpperCase().padStart(4,"0");
                break;
            case "bc":
            case "de":
            case "hl":
            case "bcx":
            case "dex":
            case "hlx":
                if (val > 65535) throw new ValorTamanoError(val, 1);
                let va = val.toString(16).padStart(4,"0").substring(0,2);
                let vb = val.toString(16).padStart(4,"0").substring(2,4);
                document.getElementById("v-"+reg[0]+((reg.length == 3)?"x":"")).textContent = vb;
                document.getElementById("v-"+reg[1]+((reg.length == 3)?"x":"")).textContent = va;
            case "f":
            case "fx":
                if (val > 255) throw new ValorTamanoError(val, 1);
                Array.from(val.toString(2).padStart(8, "0")).forEach((e, i) => {
                    let it = document.querySelector("#r-f tr:nth-child("+(i+2)+") td:nth-child("+((reg=="f")?2:4)+")");
                    if (e=="1") it.classList.add("activo");
                    else it.classList.remove("activo");
                });
        }
    }

    /**
     * Averigua si una bandera está o no activada
     *
     * @param {String} band Bandera a comprobar
     * @return {Boolean} Valor de la bandera
     * @memberof Plataforma
     */
    leerBandera(band){
        return document.getElementById("v-"+band.toLowerCase()).classList.contains("activo");
    }

    /**
     * Establece el valor de una bandera
     *
     * @param {String} band Bandera a modificar
     * @param {Boolean} val Valor a establecer en la bandera
     * @memberof Plataforma
     */
    escribirBandera(band, val){
        let b = document.getElementById("v-"+band.toLowerCase());
        if (val) b.classList.add("activo");
        else b.classList.remove("activo");
    }

    /**
     * Intercambia el valor de una bandera 
     *
     * @param {String} band Bandera a modificar
     * @memberof Plataforma
     */
    toggleBandera(band){
        document.getElementById("v-"+band.toLowerCase()).classList.toggle("activo");
    }

    /**
     * Inserta una palabra en la pila
     *
     * @param {Number} val Valor a insertar en la pila
     * @memberof Plataforma
     */
    insertarPila(val){
        let p = document.querySelector("#r-pila table").tBodies[0];
        let dir = this.leerRegistro("SP");
        if (dir <= 1) throw new MemoriaLlenaError();
        let fila = p.insertRow();
        fila.insertCell().textContent = p.rows.length - 1;
        fila.insertCell().textContent = (dir-1).toString(16).padStart(4, "0").toUpperCase();
        let cval = fila.insertCell();
        cval.textContent = val.toString(16).toUpperCase().padStart(4, "0");
        cval.addEventListener("dblclick", iniValidarEdicion);
        cval.addEventListener("change", pilaValidarEdicion);
        cval.addEventListener("blur", pilaValidarEdicion);
        cval.addEventListener("input", (c) => rInputEdicion(c, 16) );
        this.escribirPalabra(dir-1, val);
        this.escribirRegistro("SP", dir-2);
    }

    /**
     * Quita una palabra de la pila
     *
     * @memberof Plataforma
     */
    retirarPila(){
        let p = document.querySelector("#r-pila table").tBodies[0];
        if (p.rows.length == 0) throw new PilaVaciaError();
        let dir = this.leerRegistro("SP");
        this.escribirRegistro("SP", dir+2);
        p.deleteRow(-1);
    }

    /**
     * Devuelve el valor que está en el tope de la pila
     *
     * @return Último valor agregado a la pila
     * @memberof Plataforma
     */
    leerPila(){
        let dir = this.leerRegistro("SP");
        return this.leerPalabra(dir+1);
    }

    /**
     * Establece las banderas pertinentes después de cada instrucción
     *
     * @param {String} mnemo Pseudo-mnemotécnico de la instrucción
     * @param {Array<Number>} ops Lista de operadores
     * @memberof Plataforma
     */
    estBanderasOp(mnemo, ops){
        let x1, x2;
        switch (mnemo){
            case "LD": // [I | R]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>127));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", this.leerRegistro("iff2"));
                this.escribirBandera("nf", false);
                break;
            case "LDI":
            case "LDIR":
            case "LDD":// [BC]
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (ops[0] != 1));
                this.escribirBandera("nf", false);
                break;
            case "LDDR":
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", false);
                this.escribirBandera("nf", false);
                break;
            case "CPI":
            case "CPIR":
            case "CPD":
            case "CPDR": // [res, bc, a, b]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>127));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", ((ops[2]&15)<(ops[3]&15)));
                this.escribirBandera("pf", (ops[1] != 1));
                this.escribirBandera("nf", true);
                break;
            case "ADD":
            case "ADC": // [res, a, b]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>127));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", ((ops[0]&15)<(ops[1]&15)));
                this.escribirBandera("pf", ((((ops[1]&128)^(ops[2]&128))!=128) && (((ops[0]&128)^(ops[1]&128))==128)));
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", ((ops[0]&255)<(ops[1]&255)));
                break;
            case "SUB":
            case "SBC":
            case "CP": // [res, a, b]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>127));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", ((ops[1]&15)<(ops[2]&15)));
                this.escribirBandera("pf", ((((ops[1]&128)^(ops[2]&128))==128) && (((ops[0]&128)^(ops[1]&128))==128)));
                this.escribirBandera("nf", true);
                this.escribirBandera("cf", ((ops[1]&255)<(ops[2]&255)));
                break;
            case "AND":
            case "OR": // [res]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>127));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", (mnemo=="AND"));
                this.escribirBandera("pf", (ops[0]%2));
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", false);
                break;
            case "XOR": // [res]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>127));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (ops[0]%2));
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", false);
                break;
            case "INC": // [res] !Solo de 8 bits
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>127));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", (ops[0] == 15));
                this.escribirBandera("pf", (ops[0] == 0x80));
                this.escribirBandera("nf", false);
                break;
            case "DEC": // [res]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>127));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", (ops[0] == 15));
                this.escribirBandera("pf", (ops[0] == 0x7f));
                this.escribirBandera("nf", true);
                break;
            case "CPL":
                this.escribirBandera("hf", true);
                this.escribirBandera("nf", true);
                break;
            case "NEG": // [res]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>127));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", (0<((-ops[0])&15))); // TODO: Comprobar
                this.escribirBandera("pf", (ops[0] == 0x7f));
                this.escribirBandera("nf", true);
                this.escribirBandera("cf", (ops[0] != 0xff));
                break;
            case "CCF":
                this.escribirBandera("hf", this.leerBandera("cf"));
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", !this.leerBandera("cf"));
                break;
            case "SCF":
                this.escribirBandera("hf", false);
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", true);
                break;
            case "ADD16": // [res, a, b]
                this.escribirBandera("hf", ((ops[0]&4095)<(ops[1]&4095)));
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", ((ops[0]&65535)<(ops[1]&65535)));
                break;
            case "ADC16": // [res, a, b]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>32767));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", ((ops[0]&4095)<(ops[1]&4095)));
                this.escribirBandera("pf", ((((ops[1]&32768)^(ops[2]&32768))!=32768) && (((ops[0]&32768)^(ops[1]&32768))==32768)));
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", ((ops[0]&65535)<(ops[1]&65535)));
                break;
            case "SBC16": // [res, a, b]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>32767));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", ((ops[1]&4095)<(ops[2]&4095)));
                this.escribirBandera("pf", ((((ops[1]&32768)^(ops[2]&32768))==32768) && (((ops[0]&32768)^(ops[1]&32768))==32768)));
                this.escribirBandera("nf", true);
                this.escribirBandera("cf", ((ops[1]&65535)<(ops[2]&65535)));
                break;
            case "RLCA":
            case "RLA":
            case "RRCA":
            case "RRA": // [l=bit7 r=bit0]
                this.escribirBandera("hf", false);
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", ops[0]);
                break;
            case "RLC":
            case "RL":
            case "RRC":
            case "RR":
            case "SLA":
            case "SRA": // [res, l=bit r=bit0]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>127));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (ops[0]%2));
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", ops[1]);
                break;
            case "SRL": // [res, bit0]
                this.escribirBandera("sf", false);
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (ops[0]%2));
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", ops[1]);
                break;
            case "RLD":
            case "RRD":
                x1 = decodificarValor([this.leerRegistro("a")], 1, true, true);
                this.escribirBandera("sf", (x1<0));
                this.escribirBandera("zf", (x1 == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (x1%2));
                this.escribirBandera("nf", false);
                break;
            case "BIT": // [r, b]
                this.escribirBandera("zf", (Plataforma.obtComplemento(ops[0], 1, 1)&(1<<ops[1])));
                this.escribirBandera("hf", true);
                this.escribirBandera("nf", false);
                break;
            case "IN": // [res]
                this.escribirBandera("sf", (ops[0]<0)||(ops[0]>127));
                this.escribirBandera("zf", (ops[0] == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (x1%2));
                this.escribirBandera("nf", false);
        }
    }

    /**
     * Comprueba una condición específica con banderas
     *
     * @param {Number} cc Valor CC a comprobar
     * @return {Boolean} Validez de la condición
     * @memberof Plataforma
     */
    comprobarCondicion(cc){
        switch (cc){
            case 0: return !this.leerBandera("zf");
            case 1: return this.leerBandera("zf");
            case 2: return !this.leerBandera("cf");
            case 3: return this.leerBandera("cf");
            case 4: return !this.leerBandera("pf");
            case 5: return this.leerBandera("pf");
            case 6: return !this.leerBandera("sf");
            case 7: return this.leerBandera("sf");
        }
    }

    /**
     * Añade una etiqueta a la lista de etiquetas reconocidas
     *
     * @param {String} i Nombre de la etiqueta
     * @param {String} t Tipo de dato que la etiqueta referencia
     * @param {*} v Valor a establecer a la etiqueta
     * @memberof Plataforma
     */
    anadirEtiqueta(i, t, v){
        let ev = document.getElementById("eti-"+i);
        //if (ev) throw new EtiquetaExistenteError(i); // NOTE: Ver si esto se queda
        /* ID */
        let ei = document.createElement("dt");
        ei.textContent = i;
        /* Tipo */
        switch (t.toLowerCase()){ // FIX: ¿deberíamos usar tipos enumerados?
            case "dfb":
                ei.dataset.tipo = "Byte"; break;
            case "dfs":
                ei.dataset.tipo = "Espacio"; break;
            case "dwl":
                ei.dataset.tipo = "Palabra, little-endian"; break;
            case "dwm":
                ei.dataset.tipo = "Palabra, big-endian"; break;
            case "loc":
                ei.dataset.tipo = "Localidad"; break;
            case "equ":
                ei.dataset.tipo = "Entero"; break;
        }
        /* Valor */
        ev = document.createElement("dd");
        ev.id = "eti-"+i;
        if (Number.isNaN(v)){ // En proceso de definición
            ev.className = "v-defnan";
            ev.textContent = "Pendiente...";
        } else if (v == null){ // Referenciado, pero no definido
            ev.className = "v-ref";
            ev.textContent = "No definido";
        } else { // Definido
            ev.className = "v-def";
            ev.textContent = v.toString(16).padStart(4, "0").toUpperCase();
        }
        document.querySelector("#r-eti .lvars").append(ei, ev);
    }

    /**
     * Modifica el valor de la etiqueta
     *
     * @param {String} i Identificador de la etiqueta
     * @param {*} v Valor a establecer a la etiqueta
     * @memberof Plataforma
     */
    modificarEtiqueta(i, v){
        let ev = document.getElementById("eti-"+i);
        if (!ev) throw new EtiquetaIndefinidaError(i);
        if (Number.isNaN(v)){
            ev.className = "v-defnan";
            ev.textContent = "Pendiente...";
        } else if (v == null){
            ev.className = "v-ref";
            ev.textContent = "No definido";
        } else {
            ev.className = "v-def";
            ev.textContent = v.toString(16).padStart(4, "0").toUpperCase();
        }
    }

    /**
     * Modifica el tipo de la etiqueta
     * Al principio, todas las etiquetas son marcadas como tipo Localidad
     *
     * @param {String} i Identificador de la etiqueta
     * @param {String} t Cadena que identifica el tipo de la etiqueta
     * @memberof Plataforma
     */
    modificarTipoEtiqueta(i, t){
        let ev = document.getElementById("eti-"+i);
        if (!ev) throw new EtiquetaIndefinidaError(i);
        let ei = ev.previousElementSibling;
        switch (t.toLowerCase()){ // FIX: Deberíamos usar tipos enumerados
            case "dfb":
                ei.dataset.tipo = "Byte"; break;
            case "dfl":
                ei.dataset.tipo = "Palabra doble, little-endian"; break;
            case "dfs":
                ei.dataset.tipo = "Espacio"; break;
            case "dll":
                ei.dataset.tipo = "Palabra doble, big-endian"; break;
            case "dwl":
                ei.dataset.tipo = "Palabra, little-endian"; break;
            case "dwm":
                ei.dataset.tipo = "Palabra, big-endian"; break;
            case "loc":
                ei.dataset.tipo = "Localidad"; break;
            case "equ":
                ei.dataset.tipo = "Entero"; break;
        }
    }

    /**
     * Obtiene el valor y tipo asociado a una etiqueta
     *
     * @param {String} i Identificador de la etiqueta
     * @return {Array<String, String>} Un array que contiene el valor y el tipo de la etiqueta
     * @memberof Plataforma
     */
    obtenerEtiqueta(i){
        let ev = document.getElementById("eti-"+i);
        if (!ev) return [undefined, undefined];
        let v, t;
        switch (ev.className){
            case "v-defnan": v = NaN; break;
            case "v-ref": v = null; break;
            case "v-def": v = parseInt(ev.textContent, 16); break;
        }
        switch (ev.dataset.tipo){
            case "Byte": t = "dfb"; break;
            case "Espacio": t = "dfs"; break;
            case "Palabra, little-endian": t = "dwl"; break;
            case "Palabra, big-endian": t = "dwm"; break;
            case "Localidad": t = "loc"; break;
        }
        return [v, t];
    }

    /**
     * Genera una cadena que contiene la representación del valor
     *
     * @param {TipoOpEns} t Tipo del valor
     * @param {*} v Valor a convertir a cadena
     * @return {String} Representación en cadena
     * @memberof Plataforma
     */
    imprimirValor(t, v){
        switch (t){
            case TipoOpEns.NUMERO:
                return v.toString(16).padStart(2, "0").toUpperCase()+"h";
            //case TipoOpEns.REGISTRO: //?
            //case TipoOpEns.REGISTRO_PAR: //?
            //case TipoOpEns.BANDERA:
            case TipoOpEns.DIRECCION:
                return "("+v.toString(16).padStart(4, "0").toUpperCase()+"h)";
            //case TipoOpEns.DIRECCION_R:
            case TipoOpEns.DESPLAZAMIENTO:
                return ((v>=0?"+":"-")+v.toString(16).padStart(2, "0"))+"h";
            //case TipoOpEns.BIT:
        }
    }

    /**
     * Ejecuta la instrucción que está en la dirección apuntada por el registro 
     *
     * @returns Array con información sobre la instrucción ejecutada
     * @memberof Plataforma
     */
    ejecutarInstruccion(){
        let dir = this.leerRegistro("pc");
        let cod = this.leerMemoria(dir);
        let codl = [cod];
        let op1, op2, dir1, dir2, auxv1, auxd1, auxv2, auxd2, res, tt, tm;
        switch (cod){
            case 0:
                this.escribirRegistro("pc", dir+1);
                return ["NOP", 4, 1, 1, []];
            case 2:
                this.escribirRegistro("pc", dir+1);
                op2 = this.leerRegistro("a");
                dir1 = this.leerRegistro("bc");
                this.escribirMemoria(dir1, op2);
                return ["LD", 7, 2, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(BC)"
                }, {
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }]];
            case 7:
                this.escribirRegistro("pc", dir+1);
                op1 = this.leerRegistro("a");
                auxv1 = Plataforma.obtRLC(op1);
                this.escribirRegistro("a", auxv1[0]);
                this.estBanderasOp("RLCA", [auxv1]);
                return ["RLCA", 4, 1, 1, []];
            case 8:
                this.escribirRegistro("pc", dir+1);
                auxv1 = this.leerRegistro("a");
                auxv2 = this.leerRegistro("ax");
                this.escribirRegistro("a", auxv2);
                this.escribirRegistro("ax", auxv1);
                auxv1 = this.leerRegistro("f");
                auxv2 = this.leerRegistro("fx");
                this.escribirRegistro("f", auxv2);
                this.escribirRegistro("fx", auxv1);
                return ["EX", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "AF"
                }, {
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "AF'"
                }]];
            case 0xa:
                this.escribirRegistro("pc", dir+1);
                dir1 = this.leerRegistro("bc");
                auxv1 = this.leerMemoria(dir1);
                this.escribirRegistro("a", auxv1);
                return ["LD", 7, 2, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(BC)"
                }]];
            case 0xf:
                this.escribirRegistro("pc", dir+1);
                
                op1 = this.leerRegistro("a");
                auxv1 = Plataforma.obtRRC(op1);
                this.escribirRegistro("a", auxv1[0]);
                this.estBanderasOp("RRCA", [auxv1]);
                return ["RRCA", 4, 1, 1, []];
            case 0x10:
                //op1 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                op1 = this.leerMemoria(dir+1);
                auxv1 = this.leerRegistro("b");
                if (auxv1>0){
                    this.escribirRegistro("b", auxv1-1);
                    this.escribirRegistro("pc", dir + op1 + 2);
                    tt = 13;
                    tm = 3;
                } else {
                    tt = 8;
                    tm = 2;
                }
                return ["DJNZ", tt, tm, [{
                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                    "texto": this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, op1+2)
                }]];
            case 0x12:
                this.escribirRegistro("pc", dir+1);
                op2 = this.leerRegistro("a");
                dir1 = this.leerRegistro("de");
                this.escribirMemoria(dir1, op2);
                return ["LD", 7, 2, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(DE)"
                }, {
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }]];
            case 0x17:
                this.escribirRegistro("pc", dir+1);
                op1 = this.leerRegistro("a");
                auxv1 = Plataforma.obtRL(op1);
                this.escribirRegistro("a", auxv1[0]);
                this.estBanderasOp("RLA", [auxv1]);
                return ["RLA", 4, 1, 1, []];
            case 0x18:
                op1 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                this.escribirRegistro("pc", dir + op1 + 2);
                return ["JR", 12, 3, 2, [{
                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                    "texto": this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, op1)
                }]];
            case 0x1a:
                this.escribirRegistro("pc", dir+1);
                dir1 = this.leerRegistro("de");
                val1 = this.leerMemoria(dir1);
                this.escribirRegistro("a", val1);
                return ["LD", 7, 2, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(DE)"
                }]];
            case 0x1f:
                this.escribirRegistro("pc", dir+1);
                op1 = this.leerRegistro("a");
                auxv1 = Plataforma.obtRR(op1);
                this.escribirRegistro("a", auxv1[0]);
                this.estBanderasOp("RRA", [auxv1]);
                return ["RRA", 4, 1, 1, []];
            case 0x20:
            case 0x28:
                op1 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                auxv1 = this.leerBandera("zf");
                if ((!auxv1 && cod == 0x20) || (auxv1 && cod == 0x28)){
                    this.escribirRegistro("pc", dir + op1 + 2);
                    tt = 12;
                    tm = 3;
                } else {
                    this.escribirRegistro("pc", dir+2);
                    tt = 7;
                    tm = 2;
                }
                return ["JR", tt, tm, 2, [{
                    "tipo": TipoOpEns.BANDERA,
                    "texto": ((cod == 0x20)?"N":"")+"Z"
                }, {
                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                    "texto": this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, op1)
                }]];
            case 0x22:
                this.escribirRegistro("pc", dir+3);
                dir1 = this.leerPalabra(dir+1);
                op2 = this.leerRegistro("hl");
                this.escribirMemoria(dir1, op2);
                return ["LD", 16, 5, 3, [{
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": this.imprimirValor(TipoOpEns.DIRECCION, dir1)
                }, {
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "HL"
                }]];
            case 0x27:
                this.escribirRegistro("pc", dir+1);
                op1 = this.leerRegistro("a");
                let d = [
                    this.leerBandera("cf"),
                    this.leerBandera("nf"),
                    this.leerBandera("hf"),
                ];
                auxv1 = (op1&0xf0)>>4;
                auxv2 = (op1&0x0f);

                // Obtener dif
                if (!d[0] && !d[2] && auxv1<10 && auxv2<10) res = 0;
                else if (
                    (!d[0] && d[2] && auxv1<10 && auxv2<10) ||
                    (!d[0] && auxv1<9 && auxv2>9 && auxv2<0x10)
                ) res = 6;
                else if (
                    (!d[0] && !d[2] && auxv1>9 && auxv1<0x10 && auxv1<10) ||
                    (d[0] && !d[2] && auxv2<10)
                ) res = 0x60;
                else if (
                    (d[0] && d[2]  && auxv2<10) ||
                    (d[0] && auxv2>9 && auxv2<0x10) ||
                    (!d[0] && auxv1>8 && auxv1<0x10 && auxv2>9 && auxv2<0x10) ||
                    (!d[0] && d[2] && auxv1>9 && auxv1<0x10 && auxv2<10)
                ) res = 0x66;
                else res = 0;
                // Modificar CF
                if (d[0]){
                    if (
                        (auxv1>8 && auxv1<0x10 && auxv2>9 && auxv2<0x10) ||
                        (auxv1>9 && auxv1<0x10 && auxv2<10)
                    ) this.escribirBandera("cf", true);
                }
                // Modificar HF
                if (!d[1] && auxv2<10) this.escribirBandera("hf", false);
                else if (!d[1] && auxv2>9 && auxv2<0x10) this.escribirBandera("hf", true);
                else if (d[1] && d[2]) this.escribirBandera("hf", (auxv2<6));
                this.escribirRegistro("a", op1+res);
                return ["DAA", 4, 1, 1, []];
            case 0x2a:
                this.escribirRegistro("pc", dir+3);
                dir2 = this.leerPalabra(dir+1);
                op2 = this.leerPalabra(dir2);
                this.escribirRegistro("hl", op2);
                return ["LD", 16, 5, 3, [{
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "HL"
                }, {
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": this.imprimirValor(TipoOpEns.DIRECCION, dir1)
                }]];
            case 0x2f:
                this.escribirRegistro("pc", dir+1);
                auxv1 = this.leerRegistro("a");
                auxv2 = obtComplemento(auxv1, 1);
                this.estBanderasOp("CPL");
                return ["CPL", 4, 1, 1, []];
            case 0x30:
            case 0x38:
                op1 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                auxv1 = this.leerBandera("cf");
                if ((!auxv1 && cod == 0x30) || (auxv1 && cod == 0x38)){
                    this.escribirRegistro("pc", dir + op1 + 2);
                    tt = 12;
                    tm = 3;
                } else {
                    this.escribirRegistro("pc", dir + 2);
                    tt = 7;
                    tm = 2;
                }
                return ["JR", tt, tm, 2, [{
                    "tipo": TipoOpEns.BANDERA,
                    "texto": ((cod == 0x30)?"N":"")+"C"
                }, {
                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                    "texto": this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, op1)
                }]];
            case 0x32:
                this.escribirRegistro("pc", dir+3);
                dir1 = this.leerPalabra(dir+1);
                op2 = this.leerRegistro("a");
                this.escribirMemoria(dir1, op2);
                return ["LD", 16, 5, 3, [{
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": this.imprimirValor(TipoOpEns.DIRECCION, dir1)
                }, {
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }]];
            case 0x34:
                this.escribirRegistro("pc", dir+1);
                dir1 = this.leerRegistro("hl");
                op1 = decodificarValor([this.leerMemoria(dir1)], 1, true, false) + 1;
                this.escribirMemoria(dir1, codificarValor(op1, 1, true));
                this.estBanderasOp("INC", [op1]);
                return ["INC", 11, 3, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0x35:
                this.escribirRegistro("pc", dir+1);
                dir1 = this.leerRegistro("hl");
                op1 = decodificarValor([this.leerMemoria(dir1)], 1, true, false) - 1;
                this.escribirMemoria(dir1, codificarValor(op1, 1, true));
                this.estBanderasOp("DEC", [op1]);
                return ["DEC", 11, 3, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0x36:
                this.escribirRegistro("pc", dir+2);
                op1 = this.leerMemoria(dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = this.escribirMemoria(dir2, op1);
                return ["LD", 10, 3, 2, [{
                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                    "texto": "(HL"+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, op1)+")"
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op2)
                }]];
            case 0x37:
                this.escribirRegistro("pc", dir+1);
                this.estBanderasOp("SCF");
                return ["SCF", 4, 1, 1, []];
            case 0x3A:
                this.escribirRegistro("pc", dir+3);
                dir2 = this.leerPalabra(dir+1);
                op2 = this.leerMemoria(dir2);
                this.escribirRegistro("a", op2);
                return ["LD", 13, 4, 3, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": this.imprimirValor(TipoOpEns.DIRECCION, dir2)
                }]];
            case 0x3F:
                this.escribirRegistro("pc", dir+1);
                this.estBanderasOp("CCF");
                return ["CCF", 4, 1, 1, []];
            case 0x76:
                return ["HALT", 4, 1, 1, []];
            case 0x86:
                this.escribirRegistro("pc", dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = decodificarValor([this.leerMemoria(dir2)], 1, true, false);
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                res = op1+op2;
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("ADD", [res, op1, op2]);
                return ["ADD", 7, 2, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0x8E:
                this.escribirRegistro("pc", dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = decodificarValor([this.leerMemoria(dir2)], 1, true, false);
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                auxv1 = this.leerBandera("cf");
                res = op1+op2+(auxv1?1:0);
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("ADC", [res, op1, op2]);
                return ["ADC", 7, 2, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0x96:
                this.escribirRegistro("pc", dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = decodificarValor([this.leerMemoria(dir2)], 1, true, false);
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                res = op1-op2;
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("SUB", [res, op1, op2]);
                return ["SUB", 7, 2, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0x9E:
                this.escribirRegistro("pc", dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = decodificarValor([this.leerMemoria(dir2)], 1, true, false);
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                auxv1 = this.leerBandera("cf");
                res = op1-op2-(auxv1?1:0);
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("SBC", [res, op1, op2]);
                return ["SBC", 7, 2, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0xA6:
                this.escribirRegistro("pc", dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = this.leerMemoria(dir2);
                op1 = this.leerRegistro("a");
                res = Plataforma.obtAnd(op1, op2);
                this.escribirRegistro("a", res);
                this.estBanderasOp("AND", [res, op1, op2]);
                return ["AND", 7, 2, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0xAE:
                this.escribirRegistro("pc", dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = this.leerMemoria(dir2);
                op1 = this.leerRegistro("a");
                res = Plataforma.obtXor(op1, op2);
                this.escribirRegistro("a", res);
                this.estBanderasOp("XOR", [res]);
                return ["XOR", 7, 2, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0xB6:
                this.escribirRegistro("pc", dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = this.leerMemoria(dir2);
                op1 = this.leerRegistro("a");
                res = Plataforma.obtOr(op1, op2);
                this.escribirRegistro("a", res);
                this.estBanderasOp("OR", [res, op1, op2]);
                return ["OR", 7, 2, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0xBE:
                this.escribirRegistro("pc", dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = decodificarValor([this.leerMemoria(dir2)], 1, true, false);
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                res = op1-op2;
                this.estBanderasOp("CP", [res, op1, op2]);
                return ["CP", 7, 2, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0xC3:
                this.escribirRegistro("pc", dir+3);
                op1 = this.leerPalabra(dir+1);
                this.escribirRegistro("PC", op1);
                return ["JP", 10, 3, 3, [{
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": this.imprimirValor(TipoOpEns.DIRECCION, op1)
                }]];
            case 0xC6:
                this.escribirRegistro("pc", dir+2);
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                op2 = decodificarValor([this.leerMemoria(dir+1)], 1, true, false);
                res =  op1+op2;
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("ADD", [res, op1, op2]);
                return ["ADD", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op2)
                }]];
            case 0xC9:
                auxv1 = this.leerPila();
                this.retirarPila();
                this.escribirRegistro("pc", auxv1+3);
                return ["RET", 10, 3, 1, []];
            case 0xCD:
                auxv1 = this.leerRegistro("pc");
                this.insertarPila(auxv1);
                op1 = this.leerPalabra(dir+1);
                this.escribirRegistro("pc", op1);
                return ["CALL", 17, 5, 3, [{
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": this.imprimirValor(TipoOpEns.DIRECCION, op1)
                }]];
            case 0xCE:
                this.escribirRegistro("pc", dir+2);
                op2 = decodificarValor([this.leerMemoria(dir+1)], 1, true, false);
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                auxv1 = this.leerBandera("cf");
                res = op1+op2+(auxv1?1:0);
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("ADC", [res, op1, op2]);
                return ["ADC", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op1)
                }]];
            case 0xD3:
                this.escribirRegistro("pc", dir+2);
                op1 = this.leerMemoria(dir+1);
                return ["OUT", 11, 3, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op1)
                }]];
            case 0xD6:
                this.escribirRegistro("pc", dir+2);
                op2 = decodificarValor([this.leerMemoria(dir+1)], 1, true, false);
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                res = op1-op2;
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("SUB", [res, op1, op2]);
                return ["SUB", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op2)
                }]];
            case 0xD9:
                this.escribirRegistro("pc", dir+1);
                auxv1 = this.leerRegistro("b");
                auxv2 = this.leerRegistro("bx");
                this.escribirRegistro("b", auxv2);
                this.escribirRegistro("bx", auxv1);
                auxv1 = this.leerRegistro("c");
                auxv2 = this.leerRegistro("cx");
                this.escribirRegistro("c", auxv2);
                this.escribirRegistro("cx", auxv1);
                auxv1 = this.leerRegistro("d");
                auxv2 = this.leerRegistro("dx");
                this.escribirRegistro("d", auxv2);
                this.escribirRegistro("dx", auxv1);
                auxv1 = this.leerRegistro("e");
                auxv2 = this.leerRegistro("ex");
                this.escribirRegistro("e", auxv2);
                this.escribirRegistro("ex", auxv1);
                auxv1 = this.leerRegistro("h");
                auxv2 = this.leerRegistro("hx");
                this.escribirRegistro("h", auxv2);
                this.escribirRegistro("hx", auxv1);
                auxv1 = this.leerRegistro("l");
                auxv2 = this.leerRegistro("lx");
                this.escribirRegistro("l", auxv2);
                this.escribirRegistro("lx", auxv1);
                return ["EXX", 4, 1, 1, []];
            case 0xDB:
                this.escribirRegistro("pc", dir+2);
                op1 = this.leerMemoria(dir+1);
                // Sí, vamos a simular las funciones de entrada con números aleatorios
                auxv1 = Math.floor(Math.random() * 255);
                this.escribirRegistro("a", auxv1);
                this.estBanderasOp("IN", [auxv1]);
                return ["IN", 11, 3, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op1)
                }]];
            case 0xDE:
                this.escribirRegistro("pc", dir+2);
                op2 = decodificarValor([this.leerMemoria(dir + 1)], 1, true, false);
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                auxv1 = this.leerBandera("cf");
                res = op1-op2-(auxv1?1:0);
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("SBC", [res, op1, op2]);
                return ["SBC", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op1)
                }]];
            case 0xE3:
                this.escribirRegistro("pc", dir+1);
                // QUESTION: ¿qué pasa si no hay cosas en la pila?
                dir1 = this.leerRegistro("sp");
                auxv1 = this.leerMemoria(dir1+2);
                auxv2 = this.leerRegistro("h");
                this.escribirMemoria(dir1+2, auxv2);
                this.escribirRegistro("h", auxv1);
                auxv1 = this.leerMemoria(dir1+1);
                auxv2 = this.leerRegistro("l");
                this.escribirMemoria(dir1+1, auxv2);
                this.escribirRegistro("l", auxv1);
                return ["EX", 19, 5, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(SP)"
                }, {
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "HL"
                }]];
            case 0xE6:
                this.escribirRegistro("pc", dir+2);
                op2 = this.leerMemoria(dir+1);
                op1 = this.leerRegistro("a");
                res = Plataforma.obtAnd(op1, op2);
                this.escribirRegistro("a", res);
                this.estBanderasOp("AND", [res, op1, op2]);
                return ["AND", 7, 2, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op2)
                }]];
            case 0xE9:
                this.escribirRegistro("pc", dir+1);
                op1 = this.leerRegistro("hl");
                this.escribirRegistro("pc", op1);
                return ["JP", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "HL"
                }]];
            case 0xEB:
                this.escribirRegistro("pc", dir+1);
                auxv1 = this.leerRegistro("d");
                auxv2 = this.leerRegistro("h");
                this.escribirRegistro("d", auxv2);
                this.escribirRegistro("h", auxv1);
                auxv1 = this.leerRegistro("e");
                auxv2 = this.leerRegistro("l");
                this.escribirRegistro("e", auxv2);
                this.escribirRegistro("l", auxv1);
                return ["EX", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "DE"
                }, {
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "HL"
                }]];
            case 0xEE:
                this.escribirRegistro("pc", dir+2);
                op2 = this.leerMemoria(dir+1);
                op1 = this.leerRegistro("a");
                res = Plataforma.obtXor(op1, op2);
                this.escribirRegistro("a", res);
                this.estBanderasOp("XOR", [res]);
                return ["XOR", 7, 2, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op2)
                }]];
            case 0xF3:
                this.escribirRegistro("pc", dir+1);
                this.escribirBandera("iff1", false);
                this.escribirBandera("iff2", false);
                return ["DI", 4, 1, 1, []];
            case 0xF6:
                this.escribirRegistro("pc", dir+2);
                op2 = this.leerMemoria(dir+1);
                op1 = this.leerRegistro("a");
                res = Plataforma.obtOr(op1, op2);
                this.escribirRegistro("a", res);
                this.estBanderasOp("OR", [res, op1, op2]);
                return ["OR", 7, 2, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op2)
                }]];
            case 0xF9:
                this.escribirRegistro("pc", dir+1);
                op1 = this.leerRegistro("hl");
                this.escribirRegistro("sp", op1);
                return ["LD", 6, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "SP"
                }, {
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "HL"
                }]];
            case 0xFB:
                this.escribirRegistro("pc", dir+1);
                this.escribirBandera("iff1", true);
                this.escribirBandera("iff2", true);
                return ["EI", 4, 1, 1, []];
            case 0xFE:
                this.escribirRegistro("pc", dir+2);
                op2 = decodificarValor([this.leerMemoria(dir+1)], 1, true, false);
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                res = op1-op2;
                this.estBanderasOp("CP", [res, op1, op2]);
                return ["CP", 7, 2, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op2)
                }]];
            /* Compuestos */
            /** 00dd0001 **/
            case 1: case 17: case 33: case 49:
                dir1 = (cod-1)>>4;
                op2 = this.leerPalabra(dir+1);
                this.escribirRegistro(this.ValsSS[dir1], op2);
                return ["LD", 10, 2, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsSS[dir1]
                }, {
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": this.imprimirValor(TipoOpEns.DIRECCION, op2)
                }]];
            /** 00rrr100 **/
            case 4: case 12: case 20: case 28: case 36: case 44: case 60:
                this.escribirRegistro("pc", dir+1);
                dir1 = (cod-4)>>3;
                op1 = decodificarValor([this.leerRegistro(this.ValsR[dir1])], 1, true, false) + 1;
                this.escribirRegistro(this.ValsR[dir1], codificarValor(op1, 1, true));
                this.estBanderasOp("INC", [op1]);
                return ["INC", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir1]
                }]];
            /** 00rrr101 **/
            case 5: case 13: case 21: case 29: case 37: case 45: case 61:
                this.escribirRegistro("pc", dir+1);
                dir1 = (cod-5)>>3;
                op1 = decodificarValor([this.leerRegistro(this.ValsR[dir1])], 1, true, false) - 1;
                this.escribirRegistro(this.ValsR[dir1], codificarValor(op1, 1, true));
                this.estBanderasOp("DEC", [op1]);
                return ["DEC", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir1]
                }]];
            /** 00rrr110 **/
            case 6: case 14: case 22: case 30: case 38: case 46: case 62:
                this.escribirRegistro("pc", dir+2);
                dir1 = (cod-6)>>3;
                op2 = this.leerMemoria(dir+1);
                this.escribirRegistro(this.ValsR[dir1], op2);
                return ["LD", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir1]
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op2)
                }]];
            /** 00ss0011 **/
            case 3: case 19: case 35: case 51:
                this.escribirRegistro("pc", dir+1);
                dir1 = (cod-3)>>4;
                op1 = this.leerRegistro(this.ValsSS[dir1]) + 1;
                this.escribirRegistro(this.ValsSS[dir1], op1);
                return ["INC", 6, 1, 1, [{
                    "tipo": ((dir1 == 3)?TipoOpEns.REGISTRO:TipoOpEns.REGISTRO_PAR),
                    "texto": this.ValsSS[dir1]
                }]];
            /** 00ss1001 **/
            case 9: case 25: case 41: case 57:
                this.escribirRegistro("pc", dir+2);
                dir2 = (cod-3)>>4;
                op1 = this.leerRegistro("hl");
                op2 = this.leerRegistro(this.ValsSS[dir2]);
                res =  op1+op2;
                this.escribirRegistro(this.ValsSS[dir2], res);
                this.estBanderasOp("ADD", [res, op1, op2]);
                return ["ADD", 11, 3, 1, [{
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "HL"
                }, {
                    "tipo": ((dir2 == 3)?TipoOpEns.REGISTRO:TipoOpEns.REGISTRO_PAR),
                    "texto": this.ValsSS[dir2]
                }]];
            /** 00ss1011 **/
            case 11: case 27: case 43: case 59:
                this.escribirRegistro("pc", dir+1);
                dir1 = (cod-11)>>4;
                op1 = this.leerRegistro(this.ValsSS[dir1]) - 1;
                this.escribirRegistro(this.ValsSS[dir1], op1);
                return ["DEC", 6, 1, 1, [{
                    "tipo": ((dir1 == 3)?TipoOpEns.REGISTRO:TipoOpEns.REGISTRO_PAR),
                    "texto": this.ValsSS[dir1]
                }]];
            /** 01110rrr **/
            case 112: case 113: case 114: case 115: case 116: case 117: case 119:
                this.escribirRegistro("pc", dir+1);
                dir2 = cod-112;
                op2 = this.leerRegistro(this.ValsR[dir2]);
                dir1 = this.leerRegistro("hl");
                this.escribirMemoria(dir1, op2);
                return ["LD", 7, 2, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }, {
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 01rrr110 **/
            case 70: case 78: case 86: case 94: case 102: case 110: case 126:
                this.escribirRegistro("pc", dir+1);
                dir1 = (cod-70)>>3;
                dir2 = this.leerRegistro("hl");
                op2 = this.leerMemoria(dir2);
                this.escribirRegistro(this.ValsR[dir1], op2);
                return ["LD", 7, 2, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir1]
                }, {
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            /** 01rrrr'r'r' **/
            case 64: case 72: case 80: case 88: case 96: case 104: case 120: case 65: case 73: case 81: case 89: case 97: case 105: case 121: case 66: case 74: case 82: case 90: case 98: case 106: case 122: case 67: case 75: case 83: case 91: case 99: case 107: case 123: case 68: case 76: case 84: case 92: case 100: case 108: case 124: case 69: case 77: case 85: case 93: case 101: case 109: case 125: case 71: case 79: case 87: case 95: case 103: case 111: case 127:
                this.escribirRegistro("pc", dir+1);
                dir1 = (cod & 56)>>3;
                dir2 = cod & 7;
                op1 = this.leerRegistro(this.ValsR[dir2]);
                this.escribirRegistro(this.ValsR[dir1], op1);
                return ["LD", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir1]
                }, {
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10000rrr **/
            case 128: case 129: case 130: case 131: case 132: case 133: case 135:
                this.escribirRegistro("pc", dir+1);
                dir2 = cod-128;
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                op2 = decodificarValor([this.leerRegistro(this.ValsR[dir2])], 1, true, false);
                res =  op1+op2;
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("ADD", [res, op1, op2]);
                return ["ADD", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10001rrr **/
            case 136: case 137: case 138: case 139: case 140: case 141: case 143:
                this.escribirRegistro("pc", dir+1);
                dir2 = cod-136;
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                op2 = decodificarValor([this.leerRegistro(this.ValsR[dir2])], 1, true, false);
                auxv1 = this.leerBandera("cf");
                res = op1+op2+(auxv1?1:0);
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("ADC", [res, op1, op2]);
                return ["ADC", 4, 4, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10010rrr **/
            case 144: case 145: case 146: case 147: case 148: case 149: case 151:
                this.escribirRegistro("pc", dir+1);
                dir2 = cod-144;
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                op2 = decodificarValor([this.leerRegistro(this.ValsR[dir2])], 1, true, false);
                res = op1-op2;
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("SUB", [res, op1, op2]);
                return ["SUB", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10011rrr **/
            case 152: case 153: case 154: case 155: case 156: case 157: case 159:
                this.escribirRegistro("pc", dir+1);
                dir2 = cod-152;
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                op2 = decodificarValor([this.leerRegistro(this.ValsR[dir2])], 1, true, false);
                auxv1 = this.leerBandera("cf");
                res = op1-op2-(auxv1?1:0);
                this.escribirRegistro("a", codificarValor(res, 1, true));
                this.estBanderasOp("SBC", [res, op1, op2]);
                return ["SBC", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10100rrr **/
            case 160: case 161: case 162: case 163: case 164: case 165: case 167:
                this.escribirRegistro("pc", dir+1);
                dir2 = cod-160;
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                op2 = decodificarValor([this.leerRegistro(this.ValsR[dir2])], 1, true, false);
                res = Plataforma.obtAnd(op1, op2);
                this.escribirRegistro("a", res);
                this.estBanderasOp("AND", [res, op1, op2]);
                return ["AND", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10101rrr **/
            case 168: case 169: case 170: case 171: case 172: case 173: case 175:
                this.escribirRegistro("pc", dir+2);
                dir2 = cod-168;
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, true);
                op2 = decodificarValor([this.leerRegistro(this.ValsR[dir2])], 1, true, false);
                res = Plataforma.obtXor(op1, op2);
                this.escribirRegistro("a", res);
                this.estBanderasOp("XOR", [res]);
                return ["XOR", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10110rrr **/
            case 176: case 177: case 178: case 179: case 180: case 181: case 183:
                this.escribirRegistro("pc", dir+2);
                dir2 = cod-176;
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                op2 = decodificarValor([this.leerRegistro(this.ValsR[dir2])], 1, true, false);
                res = Plataforma.obtOr(op1, op2);
                this.escribirRegistro("a", res);
                this.estBanderasOp("OR", [res, op1, op2]);
                return ["OR", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10111rrr **/
            case 184: case 185: case 186: case 187: case 188: case 189: case 183:
                this.escribirRegistro("pc", dir+1);
                dir2 = cod-184;
                op2 = decodificarValor([this.leerRegistro(this.ValsR[dir2])], 1, true, false);
                op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                res = op1-op2;
                this.estBanderasOp("CP", [res, op1, op2]);
                return ["CP", 7, 2, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 11ccc000 **/
            case 192: case 200: case 208: case 216: case 224: case 232: case 240: case 248:
                dir1 = (cod-192)>>3;
                op1 = this.comprobarCondicion(dir1);
                if (op1){
                    tt = 11;
                    tm = 3;
                    auxv1 = this.leerPila();
                    this.retirarPila();
                    this.escribirRegistro("pc", auxv1);
                } else {
                    this.escribirRegistro("pc", dir+1);
                    tt = 4;
                    tm = 1;
                }
                return ["RET", tt, tm, 1, [{
                    "tipo": TipoOpEns.BANDERA,
                    "texto": this.ValsCC[dir1]
                }]];
            /** 11ccc010 **/
            case 194: case 202: case 210: case 218: case 226: case 234: case 242: case 250:
                dir1 = (cod-194)>>3;
                op1 = this.comprobarCondicion(dir1);
                op2 = this.leerPalabra(dir+1);
                this.escribirRegistro("pc", (op1?op2:(dir+3)));
                return ["JP", 10, 3, 3, [{
                    "tipo": TipoOpEns.BANDERA,
                    "texto": this.ValsCC[dir1]
                }, {
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": this.imprimirValor(TipoOpEns.DIRECCION, op2)
                }]];
            /** 11ccc100 **/
            case 196: case 204: case 212: case 220: case 228: case 236: case 244: case 252:
                dir1 = (cod-196)>>3;
                op1 = this.comprobarCondicion(dir1);
                op2 = this.leerPalabra(dir+1);
                if (op1){
                    tt = 17;
                    tm = 5;
                    auxv1 = this.leerRegistro("pc");
                    this.insertarPila(auxv1);
                    this.escribirRegistro("pc", op2);
                } else {
                    this.escribirRegistro("pc", dir+3);
                    tt = 10;
                    tm = 3;
                }
                return ["CALL", tt, tm, 3, [{
                    "tipo": TipoOpEns.BANDERA,
                    "texto": this.ValsCC[dir1]
                }, {
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": this.imprimirValor(TipoOpEns.DIRECCION, op2)
                }]];
            /** 11qq0001 **/
            case 193: case 209: case 225: case 241:
                dir1 = (cod-193)>>4;
                op1 = this.leerPila();
                this.retirarPila();
                this.escribirRegistro(this.ValsQQ[dir1], op1);
                return ["POP", 10, 3, 1, [{
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": this.ValsQQ[dir1]
                }]];
            /** 11qq0101 **/
            case 197: case 213: case 229: case 245:
                dir1 = (cod-197)>>4;
                op1 = this.leerRegistro(this.ValsQQ[dir1]);
                this.insertarPila(op1);
                return ["PUSH", 11, 3, 1, [{
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": this.ValsQQ[dir1]
                }]];
            /** 11ttt111 **/
            case 199: case 207: case 215: case 223: case 231: case 239: case 247: case 255:
                this.escribirRegistro("pc", dir+1);
                op1 = (cod-199)>>3;
                auxv1 = this.leerRegistro("pc");
                this.insertarPila(auxv1);
                this.escribirRegistro("pc", op1*8);
                return ["RST", 11, 3, 1, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": this.imprimirValor(TipoOpEns.NUMERO, op1*8)
                }]];
            /* Multibyte */
            case 0xCB:
                dir = dir+1;
                cod = this.leerMemoria(dir);
                codl.push(cod);
                switch (cod){
                    case 0x06:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        auxv1 = Plataforma.obtRLC(op1);
                        this.escribirMemoria(dir1, auxv1[0]);
                        this.estBanderasOp("RLC", [auxv1]);
                        return ["RLC", 15, 4, 2, [{
                            "tipo": TipoOpEns.DIRECCION_R,
                            "texto": "(HL)"
                        }]];
                    case 0x0E:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        auxv1 = Plataforma.obtRRC(op1);
                        this.escribirMemoria(dir1, auxv1[0]);
                        this.estBanderasOp("RRC", [auxv1]);
                        return ["RRC", 15, 4, 2, [{
                            "tipo": TipoOpEns.DIRECCION_R,
                            "texto": "(HL)"
                        }]];
                    case 0x16:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        auxv1 = Plataforma.obtRL(op1);
                        this.escribirMemoria(dir1, auxv1[0]);
                        this.estBanderasOp("RL", [auxv1]);
                        return ["RL", 15, 4, 2, [{
                            "tipo": TipoOpEns.DIRECCION_R,
                            "texto": "(HL)"
                        }]];
                    case 0x1E:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        auxv1 = Plataforma.obtRR(op1);
                        this.escribirMemoria(dir1, auxv1[0]);
                        this.estBanderasOp("RR", [auxv1]);
                        return ["RR", 15, 4, 2, [{
                            "tipo": TipoOpEns.DIRECCION_R,
                            "texto": "(HL)"
                        }]];
                    case 0x26:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        auxv1 = Plataforma.obtSLA(op1);
                        this.escribirMemoria(dir1, auxv1[0]);
                        this.estBanderasOp("SLA", [auxv1]);
                        return ["SLA", 15, 4, 2, [{
                            "tipo": TipoOpEns.DIRECCION_R,
                            "texto": "(HL)"
                        }]];
                    case 0x2E:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        auxv1 = Plataforma.obtSRA(op1);
                        this.escribirMemoria(dir1, auxv1[0]);
                        this.estBanderasOp("SRA", [auxv1]);
                        return ["SRA", 15, 4, 2, [{
                            "tipo": TipoOpEns.DIRECCION_R,
                            "texto": "(HL)"
                        }]];
                    case 0x3E:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        auxv1 = Plataforma.obtSRL(op1);
                        this.escribirMemoria(dir1, auxv1[0]);
                        this.estBanderasOp("SRL", [auxv1]);
                        return ["SRL", 15, 4, 2, [{
                            "tipo": TipoOpEns.DIRECCION_R,
                            "texto": "(HL)"
                        }]];
                    /* 00000rrr */
                    case 0: case 1: case 2: case 3: case 4: case 5: case 7:
                        this.escribirRegistro("pc", dir+1);
                        op1 = this.leerRegistro(this.ValsR[cod]);
                        auxv1 = Plataforma.obtRLC(op1);
                        this.escribirRegistro(this.ValsR[cod], auxv1[0]);
                        this.estBanderasOp("RLC", [auxv1]);
                        return ["RLC", 8, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[cod]
                        }]];
                    /* 00001rrr */
                    case 8: case 9: case 10: case 11: case 12: case 13: case 15:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod-8);
                        op1 = this.leerRegistro(this.ValsR[dir1]);
                        auxv1 = Plataforma.obtRRC(op1);
                        this.escribirRegistro(this.ValsR[dir1], auxv1[0]);
                        this.estBanderasOp("RRC", [auxv1]);
                        return ["RRC", 8, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[dir1]
                        }]];
                    /* 00010rrr */
                    case 16: case 17: case 18: case 19: case 20: case 21: case 23:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod-16);
                        op1 = this.leerRegistro(this.ValsR[dir1]);
                        auxv1 = Plataforma.obtRL(op1);
                        this.escribirRegistro(this.ValsR[dir1], auxv1[0]);
                        this.estBanderasOp("RL", [auxv1]);
                        return ["RL", 8, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[dir1]
                        }]];
                    /* 00011rrr */
                    case 24: case 25: case 26: case 27: case 28: case 29: case 31:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod-24);
                        op1 = this.leerRegistro(this.ValsR[dir1]);
                        auxv1 = Plataforma.obtRR(op1);
                        this.escribirRegistro(this.ValsR[dir1], auxv1[0]);
                        this.estBanderasOp("RR", [auxv1]);
                        return ["RR", 8, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[dir1]
                        }]];
                    /* 00100rrr */
                    case 32: case 33: case 34: case 35: case 36: case 37: case 39:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod-32);
                        op1 = this.leerRegistro(this.ValsR[dir1]);
                        auxv1 = Plataforma.obtSLA(op1);
                        this.escribirRegistro(this.ValsR[dir1], auxv1[0]);
                        this.estBanderasOp("SLA", [auxv1]);
                        return ["SLA", 8, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[dir1]
                        }]];
                    /* 00101rrr */
                    case 40: case 41: case 42: case 43: case 44: case 45: case 47:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod-40);
                        op1 = this.leerRegistro(this.ValsR[dir1]);
                        auxv1 = Plataforma.obtSRA(op1);
                        this.escribirRegistro(this.ValsR[dir1], auxv1[0]);
                        this.estBanderasOp("SRA", [auxv1]);
                        return ["SRA", 8, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[dir1]
                        }]];
                    /* 00111rrr */
                    case 56: case 57: case 58: case 59: case 60: case 61: case 63:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod-56);
                        op1 = this.leerRegistro(this.ValsR[dir1]);
                        auxv1 = Plataforma.obtSRL(op1);
                        this.escribirRegistro(this.ValsR[dir1], auxv1[0]);
                        this.estBanderasOp("SRL", [auxv1]);
                        return ["SRL", 8, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[dir1]
                        }]];
                    /* 01bbb110 */
                    case 70: case 78: case 86: case 94: case 102: case 110: case 118: case 126:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod-70)>>3;
                        auxd1 = this.leerRegistro("hl");
                        auxv1 = this.leerMemoria(auxd1);
                        this.estBanderasOp("BIT", [auxv1, dir1]);
                        return ["BIT", 12, 3, 2, [{
                            "tipo": TipoOpEns.BIT,
                            "texto": dir1
                        }, {
                            "tipo": TipoOpEns.DIRECCION_R,
                            "texto": "(HL)"
                        }]];
                    /* 01bbbrrr */
                    case 64: case 65: case 66: case 67: case 68: case 69: case 71:
                    case 72: case 73: case 74: case 75: case 76: case 77: case 79:
                    case 80: case 81: case 82: case 83: case 84: case 85: case 87:
                    case 88: case 89: case 90: case 91: case 92: case 93: case 95:
                    case 96: case 97: case 98: case 99: case 100: case 101: case 103:
                    case 104: case 105: case 106: case 107: case 108: case 109: case 111:
                    case 112: case 113: case 114: case 115: case 116: case 117: case 119:
                    case 120: case 121: case 122: case 123: case 124: case 125: case 127:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod & 15)>>3;
                        dir2 = (cod & 7);
                        op2 = this.leerRegistro(this.ValsR[dir2]);
                        this.estBanderasOp("BIT", [op2, dir1]);
                        return ["BIT", 8, 2, 2, [{
                            "tipo": TipoOpEns.BIT,
                            "texto": dir1
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[dir2]
                        }]];
                    /* 10bbb110 */
                    case 134: case 142: case 150: case 158: case 166: case 174: case 182: case 190:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod-134)>>3;
                        dir2 = this.leerRegistro("hl");
                        op2 = this.leerMemoria(auxd1);
                        this.escribirMemoria(dir2, (op2-(1<<dir1)));
                        return ["RES", 15, 4, 2, [{
                            "tipo": TipoOpEns.BIT,
                            "texto": dir1
                        }, {
                            "tipo": TipoOpEns.DIRECCION_R,
                            "texto": "(HL)"
                        }]];
                    /* 10bbbrrr */
                    case 128: case 129: case 130: case 131: case 132: case 133: case 135:
                    case 136: case 137: case 138: case 139: case 140: case 141: case 143:
                    case 144: case 145: case 146: case 147: case 148: case 149: case 151:
                    case 152: case 153: case 154: case 155: case 156: case 157: case 159:
                    case 160: case 161: case 162: case 163: case 164: case 165: case 167:
                    case 168: case 169: case 170: case 171: case 172: case 173: case 175:
                    case 176: case 177: case 178: case 179: case 180: case 181: case 183:
                    case 184: case 185: case 186: case 187: case 188: case 189: case 191:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod & 15)>>3;
                        dir2 = (cod & 7);
                        op2 = this.leerRegistro(this.ValsR[dir2]);
                        this.escribirRegistro(this.ValsR[dir2], (op2-(1<<dir1)));
                        return ["RES", 8, 4, 2, [{
                            "tipo": TipoOpEns.BIT,
                            "texto": dir1
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[dir2]
                        }]];
                    /* 11bbb110 */
                    case 198: case 206: case 214: case 222: case 230: case 238: case 246: case 254:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod-134)>>3;
                        dir2 = this.leerRegistro("hl");
                        op2 = this.leerMemoria(auxd1);
                        this.escribirMemoria(dir2, (op2|(1<<dir1)));
                        return ["SET", 15, 4, 2, [{
                            "tipo": TipoOpEns.BIT,
                            "texto": dir1
                        }, {
                            "tipo": TipoOpEns.DIRECCION_R,
                            "texto": "(HL)"
                        }]];
                    /* 11bbbrrr */
                    case 192: case 193: case 194: case 195: case 196: case 197: case 199:
                    case 200: case 201: case 202: case 203: case 204: case 205: case 207:
                    case 208: case 209: case 210: case 211: case 212: case 213: case 215:
                    case 216: case 217: case 218: case 219: case 220: case 221: case 223:
                    case 224: case 225: case 226: case 227: case 228: case 229: case 231:
                    case 232: case 233: case 234: case 235: case 236: case 237: case 239:
                    case 240: case 241: case 242: case 243: case 244: case 245: case 247:
                    case 248: case 249: case 250: case 251: case 252: case 253: case 255:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod & 15)>>3;
                        dir2 = (cod & 7);
                        op2 = this.leerRegistro(this.ValsR[dir2]);
                        this.escribirRegistro(this.ValsR[dir2], (op2|(1<<dir1)));
                        return ["SET", 8, 2, 2, [{
                            "tipo": TipoOpEns.BIT,
                            "texto": dir1
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[dir2]
                        }]];
                    default:
                        throw new CodigoIlegalError(codl);
                }
            case 0xED:
                dir = dir+1;
                cod = this.leerMemoria(dir);
                codl.push(cod);
                switch (cod){
                    case 0x44:
                        this.escribirRegistro("pc", dir+1);
                        op1 = this.leerRegistro("a");
                        res = Plataforma.obtComplemento(op1, 1, 2);
                        this.escribirRegistro("a", res);
                        this.estBanderasOp("NEG", [res]);
                        return ["NEG", 8, 2, 2, []];
                    case 0x45:
                        this.escribirRegistro("pc", dir+1);
                        return ["RETN", 14, 4, 2, []];
                    case 0x46:
                        this.escribirRegistro("pc", dir+1);
                        return ["IM", 8, 2, 2, [{
                            "tipo": TipoOpEns.NUMERO,
                            "texto": "00"
                        }]];
                    case 0x47:
                        this.escribirRegistro("pc", dir+1);
                        op2 = this.leerRegistro("a");
                        this.escribirRegistro("i", op2);
                        return ["LD", 9, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "I"
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "A"
                        }]];
                    case 0x4D:
                        this.escribirRegistro("pc", dir+1);
                        return ["RETI", 14, 4, 2, []];
                    case 0x4F:
                        this.escribirRegistro("pc", dir+1);
                        op2 = this.leerRegistro("a");
                        this.escribirRegistro("r", op2);
                        return ["LD", 9, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "R"
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "A"
                        }]];
                    case 0x56:
                        this.escribirRegistro("pc", dir+1);
                        return ["IM", 8, 2, 2, [{
                            "tipo": TipoOpEns.NUMERO,
                            "texto": "01"
                        }]];
                    case 0x57:
                        this.escribirRegistro("pc", dir+1);
                        op2 = this.leerRegistro("i");
                        this.escribirRegistro("a", op2);
                        this.estBanderasOp("LD", [op2]);
                        return ["LD", 9, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "A"
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "I"
                        }]];
                    case 0x5E:
                        this.escribirRegistro("pc", dir+1);
                        return ["IM", 8, 2, 2, [{
                            "tipo": TipoOpEns.NUMERO,
                            "texto": "02"
                        }]];
                    case 0x5F:
                        this.escribirRegistro("pc", dir+1);
                        op2 = this.leerRegistro("r");
                        this.escribirRegistro("a", op2);
                        this.estBanderasOp("LD", [op2]);
                        return ["LD", 9, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "A"
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "R"
                        }]];
                    case 0x67:
                        this.escribirRegistro("pc", dir+1);
                        op1 = this.leerRegistro("a");
                        dir2 = this.leerRegistro("hl");
                        op2 = this.leerMemoria(dir2);
                        auxv1 = op1&15;
                        this.escribirRegistro("a", (op1&240)+(op2&15));
                        this.escribirMemoria(dir2, (auxv1<<4)+(op2>>4));
                        this.estBanderasOp("RRD", []);
                        return ["RRD", 18, 5, 2, []];
                    case 0x6F:
                        this.escribirRegistro("pc", dir+1);
                        op1 = this.leerRegistro("a");
                        dir2 = this.leerRegistro("hl");
                        op2 = this.leerMemoria(dir2);
                        auxv1 = op1&15;
                        this.escribirRegistro("a", (op1&240)+((op2&240)>>4));
                        this.escribirMemoria(dir2, ((op2&15)<<4)+auxv1);
                        this.estBanderasOp("RLD", []);
                        return ["RLD", 18, 5, 2, []];
                    case 0xA0:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        dir2 = this.leerRegistro("de");
                        this.escribirMemoria(dir2, op1);
                        this.escribirRegistro("de", dir2+1);
                        this.escribirRegistro("hl", dir1+1);
                        auxv1 = this.leerRegistro("bc");
                        this.escribirRegistro("bc", auxv1-1);
                        this.estBanderasOp("LDI", [res]);
                        return ["LDI", 16, 4, 2, []];
                    case 0xA1:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        this.escribirRegistro("a", op1);
                        this.escribirRegistro("hl", dir1+1);
                        auxv1 = this.leerRegistro("bc");
                        this.escribirRegistro("bc", auxv1-1);
                        this.estBanderasOp("CPI", [res, auxv1]);
                        return ["CPI", 16, 4, 2, []];
                    case 0xA2:
                        this.escribirRegistro("pc", dir+1);
                        return ["INI", 16, 4, 2, []];
                    case 0xA3:
                        this.escribirRegistro("pc", dir+1);
                        return ["OUTI", 16, 4, 2, []];
                    case 0xA8:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        dir2 = this.leerRegistro("de");
                        this.escribirMemoria(dir2, op1);
                        this.escribirRegistro("de", dir2-1);
                        this.escribirRegistro("hl", dir1-1);
                        auxv1 = this.leerRegistro("bc");
                        this.escribirRegistro("bc", auxv1-1);
                        this.estBanderasOp("LDD", [res]);
                        return ["LDD", 16, 4, 2, []];
                    case 0xA9:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        this.escribirRegistro("a", op1);
                        this.escribirRegistro("hl", dir1-1);
                        auxv1 = this.leerRegistro("bc");
                        this.escribirRegistro("bc", auxv1-1);
                        this.estBanderasOp("CPD", [res, auxv1]);
                        return ["CPD", 16, 4, 2, []];
                    case 0xAA:
                        this.escribirRegistro("pc", dir+1);
                        return ["IND", 16, 4, 2, []];
                    case 0xAB:
                        this.escribirRegistro("pc", dir+1);
                        return ["OUTD", 16, 4, 2, []];
                    case 0xB0:
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        dir2 = this.leerRegistro("de");
                        this.escribirMemoria(dir2, op1);
                        this.escribirRegistro("de", dir2+1);
                        this.escribirRegistro("hl", dir1+1);
                        auxv1 = this.leerRegistro("bc");
                        this.escribirRegistro("bc", auxv1-1);
                        if (auxv1 > 1){
                            this.escribirRegistro("pc", dir-1);
                            tt = 21;
                            tm = 5;
                        } else {
                            this.escribirRegistro("pc", dir+1);
                            tt = 16;
                            tm = 4;
                        }
                        this.estBanderasOp("LDIR", [res]);
                        return ["LDIR", tt, tm, 2, []];
                    case 0xB1:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        this.escribirRegistro("a", op1);
                        this.escribirRegistro("hl", dir1+1);
                        auxv1 = this.leerRegistro("bc");
                        this.escribirRegistro("bc", auxv1-1);
                        if (auxv1 > 1){
                            this.escribirRegistro("pc", dir-1);
                            tt = 21;
                            tm = 5;
                        } else {
                            this.escribirRegistro("pc", dir+1);
                            tt = 16;
                            tm = 4;
                        }
                        this.estBanderasOp("CPIR", [res, auxv1]);
                        return ["CPIR", tt, tm, 2, []];
                    case 0xB2:
                        this.escribirRegistro("pc", dir+1);
                        return ["INIR", 16, 4, 2, []];
                    case 0xB3:
                        this.escribirRegistro("pc", dir+1);
                        return ["OTIR", 16, 4, 2, []];
                    case 0xB8:
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        dir2 = this.leerRegistro("de");
                        this.escribirMemoria(dir2, op1);
                        this.escribirRegistro("de", dir2-1);
                        this.escribirRegistro("hl", dir1-1);
                        auxv1 = this.leerRegistro("bc");
                        this.escribirRegistro("bc", auxv1-1);
                        if (auxv1 > 1){
                            this.escribirRegistro("pc", dir-1);
                            tt = 21;
                            tm = 5;
                        } else {
                            this.escribirRegistro("pc", dir+1);
                            tt = 16;
                            tm = 4;
                        }
                        this.estBanderasOp("LDDR", [res]);
                        return ["LDDR", 16, 4, 2, []];
                    case 0xB9:
                        dir1 = this.leerRegistro("hl");
                        op1 = this.leerMemoria(dir1);
                        op2 = this.leerRegistro("a");
                        this.escribirRegistro("hl", dir1-1);
                        auxv1 = this.leerRegistro("bc");
                        this.escribirRegistro("bc", auxv1-1);
                        if (auxv1 > 1){
                            this.escribirRegistro("pc", dir-1);
                            tt = 21;
                            tm = 5;
                        } else {
                            this.escribirRegistro("pc", dir+1);
                            tt = 16;
                            tm = 4;
                        }
                        this.estBanderasOp("CPDR", [res, auxv1, op1, op2]);
                        return ["CPDR", 16, 4, 2, []];
                    case 0xBA:
                        this.escribirRegistro("pc", dir+1);
                        return ["INDR", 21, 5, 2, []];
                    case 0xBB:
                        this.escribirRegistro("pc", dir+1);
                        return ["OTDR", 21, 5, 2, []];
                    /* 01dd0011*/
                    case 67: case 83: case 99: case 115:
                        this.escribirRegistro("pc", dir+3);
                        dir2 = (cod-67)>>4;
                        op2 = this.leerRegistro(this.ValsSS[dir2]);
                        dir1 = this.leerPalabra(dir+1);
                        this.escribirPalabra(dir1, op2);
                        return ["LD", 20, 6, 4, [{
                            "tipo": TipoOpEns.DIRECCION,
                            "texto": this.imprimirValor(TipoOpEns.DIRECCION, dir1)
                        }, {
                            "tipo": (dir2==3)?TipoOpEns.REGISTRO:TipoOpEns.REGISTRO_PAR,
                            "texto": this.ValsSS[dir2]
                        }]];
                    /* 01dd1011 */
                    case 75: case 91: case 107: case 123:
                        this.escribirRegistro("pc", dir+3);
                        dir1 = (cod-75)>>4;
                        dir2 = this.leerPalabra(dir+1);
                        op2 = this.leerPalabra(dir2);
                        this.escribirRegistro(this.ValsSS[dir1]);
                        this.escribirPalabra(dir1, op2);
                        return ["LD", 20, 6, 4, [{
                            "tipo": (dir1==3)?TipoOpEns.REGISTRO:TipoOpEns.REGISTRO_PAR,
                            "texto": this.ValsSS[dir1]
                        }, {
                            "tipo": TipoOpEns.DIRECCION,
                            "texto": this.imprimirValor(TipoOpEns.DIRECCION, dir2)
                        }]];
                    /* 01rrr000 */
                    case 64: case 72: case 80: case 88: case 96: case 104: case 112: case 120:
                        this.escribirRegistro("pc", dir+1);
                        dir2 = (cod-64)>>3;
                        return ["OUT", 12, 3, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "(C)"
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR(dir2)
                        }]];
                    /* 01rrr001 */
                    case 65: case 73: case 81: case 89: case 97: case 105: case 113: case 121:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod-65)>>3;
                        auxv1 = Math.floor(Math.random() * 255);
                        this.escribirRegistro("C", auxv1);
                        this.estBanderasOp("IN", [auxv1]);
                        return ["IN", 12, 3, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR(dir1)
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "(C)"
                        }]];
                    /* 01ss0010 */
                    case 66: case 82: case 98: case 114:
                        this.escribirRegistro("pc", dir+1);
                        dir2 = (cod-66)>>4;
                        op1 = this.leerRegistro("hl");
                        op2 = this.leerRegistro(this.ValsSS[dir2]);
                        auxv1 = this.leerBandera("cf");
                        res = op1-op2-(auxv1?1:0);
                        this.escribirRegistro("hl", res);
                        this.estBanderasOp("SBC", [res, op1, op2]);
                        return ["SBC", 15, 4, 2, [{
                            "tipo": TipoOpEns.REGISTRO_PAR,
                            "texto": "HL"
                        }, {
                            "tipo": (dir2==3)?TipoOpEns.REGISTRO:TipoOpEns.REGISTRO_PAR,
                            "texto": this.ValsSS[dir2]
                        }]];
                    /* 01ss1010 */
                    case 74: case 90: case 106: case 122:
                        this.escribirRegistro("pc", dir+1);
                        dir2 = (cod-74)>>4;
                        op1 = this.leerRegistro("hl");
                        op2 = this.leerRegistro(this.ValsSS[dir2]);
                        auxv1 = this.leerBandera("cf");
                        res = op1+op2+(auxv1?1:0);
                        this.escribirRegistro("hl", res);
                        this.estBanderasOp("ADC", [res, op1, op2]);
                        return ["ADC", 15, 4, 2, [{
                            "tipo": TipoOpEns.REGISTRO_PAR,
                            "texto": "HL"
                        }, {
                            "tipo": (dir2==3)?TipoOpEns.REGISTRO:TipoOpEns.REGISTRO_PAR,
                            "texto": this.ValsSS[dir2]
                        }]];
                    default:
                        throw new CodigoIlegalError(codl);
                }
            case 0xDD:
            case 0xFD:
                dir = dir+1;
                cod = this.leerMemoria(dir);
                codl.push(cod);
                switch (cod){
                    case 0x21:
                        this.escribirRegistro("pc", dir+3);
                        op2 = this.leerPalabra(dir+1);
                        this.escribirRegistro((codl[0] == 0xDD)?"ix":"iy", op2);
                        return ["LD", 14, 4, 4, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": (codl[0] == 0xDD)?"IX":"IY"
                        }, {
                            "tipo": TipoOpEns.NUMERO,
                            "texto": this.imprimirValor(TipoOpEns.NUMERO, op2)
                        }]];
                    case 0x22:
                        this.escribirRegistro("pc", dir+3);
                        op1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        dir1 = this.leerPalabra(dir+1);
                        this.escribirPalabra(dir1, op1);
                        return ["LD", 20, 6, 4, [{
                            "tipo": TipoOpEns.DIRECCION,
                            "texto": this.imprimirValor(TipoOpEns.DIRECCION, dir1)
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": (codl[0] == 0xDD)?"IX":"IY"
                        }]];
                    case 0x23:
                        this.escribirRegistro("pc", dir+1);
                        op1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy") + 1;
                        this.escribirRegistro((codl[0] == 0xDD)?"ix":"iy", op1);
                        return ["INC", 10, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": (codl[0] == 0xDD)?"IX":"IY"
                        }]];
                    case 0x2A:
                        this.escribirRegistro("pc", dir+3);
                        dir2 = this.leerPalabra(dir+1);
                        op2 = this.leerPalabra(dir2);
                        this.escribirRegistro((codl[0] == 0xDD)?"ix":"iy", op2);
                        return ["LD", 20, 6, 4, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": (codl[0] == 0xDD)?"IX":"IY"
                        }, {
                            "tipo": TipoOpEns.DIRECCION,
                            "texto": this.imprimirValor(TipoOpEns.DIRECCION, dir2)
                        }]];
                    case 0x2B:
                        this.escribirRegistro("pc", dir+1);
                        op1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy") - 1;
                        this.escribirRegistro((codl[0] == 0xDD)?"ix":"iy", op1);
                        return ["DEC", 10, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": (codl[0] == 0xDD)?"IX":"IY"
                        }]];
                    case 0x34:
                        this.escribirRegistro("pc", dir+2);
                        dir1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd1 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                        op1 = decodificarValor([this.leerMemoria(dir1+auxd1)], 1, true, false)+1;
                        this.escribirPalabra(dir1+auxd1, op1);
                        this.estBanderasOp("INC", [op1]);
                        return ["INC", 23, 6, 3, [{
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                        }]];
                    case 0x35:
                        this.escribirRegistro("pc", dir+2);
                        dir1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd1 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                        op1 = decodificarValor([this.leerMemoria(dir1+auxd1)], 1, true, false)-1;
                        this.escribirPalabra(dir1+auxd1, op1);
                        this.estBanderasOp("DEC", [op1]);
                        return ["DEC", 23, 6, 3, [{
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                        }]];
                    case 0x36:
                        this.escribirRegistro("pc", dir+3);
                        dir1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd1 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                        op1 = decodificarValor([this.leerMemoria(dir1+auxd1)], 1, true, true)-1;
                        op2 = decodificarValor([this.leerMemoria(dir+2)], 1, true, true);
                        this.escribirPalabra(dir1+auxd1, op1);
                        return ["LD", 23, 6, 3, [{
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                        }, {
                            "tipo": TipoOpEns.NUMERO,
                            "texto": this.imprimirValor(TipoOpEns.NUMERO, op2)
                        }]];
                    case 0x86:
                        this.escribirRegistro("pc", dir+2);
                        dir2 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd2 = decodificarValor([this.leerMemoria(dir+1)], 1, true, false);
                        op1 = decodificarValor([this.leerMemoria(dir1+auxd1)], 1, true, true);
                        op2 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                        res = op1+op2;
                        this.escribirRegistro("a", codificarValor(res, 1, true));
                        this.estBanderasOp("ADD", [res, op1, op2]);
                        return ["ADD", 19, 5, 3, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "A"
                        }, {
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd2)+")"
                        }]];
                    case 0x8E:
                        this.escribirRegistro("pc", dir+2);
                        dir2 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd2 = decodificarValor([this.leerMemoria(dir+1)], 1, true, false);
                        op1 = decodificarValor([this.leerMemoria(dir1+auxd1)], 1, true, true);
                        op2 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                        auxv1 = this.leerBandera("cf");
                        res = op1+op2+(auxv1?1:0);
                        this.escribirRegistro("a", codificarValor(res, 1, true));
                        this.estBanderasOp("ADC", [res, op1, op2]);
                        return ["ADC", 19, 5, 3, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "A"
                        }, {
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd2)+")"
                        }]];
                    case 0x96:
                        this.escribirRegistro("pc", dir+2);
                        dir2 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd2 = decodificarValor([this.leerMemoria(dir+1)], 1, true, false);
                        op2 = decodificarValor([this.leerMemoria(dir1+auxd1)], 1, true, true);
                        op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                        res = op1-op2;
                        this.escribirRegistro("a", codificarValor(res, 1, true));
                        this.estBanderasOp("SUB", [res, op1, op2]);
                        return ["SUB", 19, 5, 3, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "A"
                        }, {
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd2)+")"
                        }]];
                    case 0x9E:
                        this.escribirRegistro("pc", dir+2);
                        dir2 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd2 = decodificarValor([this.leerMemoria(dir+1)], 1, true, false);
                        op2 = decodificarValor([this.leerMemoria(dir2+auxd2)], 1, true, true);
                        op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                        auxv1 = this.leerBandera("cf");
                        res = op1-op2-(auxv1?1:0);
                        this.escribirRegistro("a", codificarValor(res, 1, true));
                        this.estBanderasOp("SBC", [res, op1, op2]);
                        return ["SBC", 19, 5, 3, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "A"
                        }, {
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd2)+")"
                        }]];
                    case 0xA6:
                        this.escribirRegistro("pc", dir+2);
                        dir1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd1 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                        op1 = this.leerMemoria(dir1+auxd1);
                        op2 = this.leerRegistro("a");
                        res = Plataforma.obtAnd(op1, op2);
                        this.escribirRegistro("a", res);
                        this.estBanderasOp("AND", [res, op1, op2]);
                        return ["AND", 19, 5, 3, [{
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                        }]];
                    case 0xAE:
                        this.escribirRegistro("pc", dir+2);
                        dir1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd1 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                        op1 = this.leerMemoria(dir2+auxd1);
                        op2 = this.leerRegistro("a");
                        res = Plataforma.obtXor(op1, op2);
                        this.escribirRegistro("a", res);
                        this.estBanderasOp("XOR", [res]);
                        return ["XOR", 19, 5, 3, [{
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                        }]];
                    case 0xB6:
                        this.escribirRegistro("pc", dir+2);
                        dir1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd1 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                        op1 = this.leerMemoria(dir1+auxd1);
                        op2 = this.leerRegistro("a");
                        res = Plataforma.obtOr(op1, op2);
                        this.escribirRegistro("a", res);
                        this.estBanderasOp("OR", [res, op1, op2]);
                        return ["OR", 19, 5, 3, [{
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                        }]];
                    case 0xBE:
                        this.escribirRegistro("pc", dir+2);
                        dir2 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd2 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                        op2 = this.leerMemoria(dir2+auxd2);
                        op1 = decodificarValor([this.leerRegistro("a")], 1, true, false);
                        res = op1-op2;
                        this.estBanderasOp("CP", [res, op1, op2]);
                        return ["CP", 19, 5, 3, [{
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd2)+")"
                        }]];
                    case 0xCB:
                        dir = dir+2;
                        cod = this.leerMemoria(dir);
                        codl.push(cod);
                        dir1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd1 = decodificarValor([this.leerMemoria(dir-1)], 1, true, true);
                        op1 = this.leerMemoria(dir1+auxd1);
                        switch (cod){
                            case 6:
                                auxv2 = Plataforma.obtRLC(op1);
                                this.escribirMemoria(dir1+auxv1, auxv2[0]);
                                this.estBanderasOp("RLC", [auxv2]);
                                return ["RLC", 23, 6, 4, [{
                                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                                    "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                                }]];
                            case 0x0E:
                                auxv2 = Plataforma.obtRRC(op1);
                                this.escribirMemoria(dir1+auxv1, auxv2[0]);
                                this.estBanderasOp("RRC", [auxv2]);
                                return ["RRC", 23, 6, 4, [{
                                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                                    "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                                }]];
                            case 0x16:
                                auxv2 = Plataforma.obtRL(op1);
                                this.escribirMemoria(dir1+auxv1, auxv2[0]);
                                this.estBanderasOp("RL", [auxv2]);
                                return ["RL", 23, 6, 4, [{
                                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                                    "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                                }]];
                            case 0x1E:
                                auxv2 = Plataforma.obtRR(op1);
                                this.escribirMemoria(dir1+auxv1, auxv2[0]);
                                this.estBanderasOp("RR", [auxv2]);
                                return ["RR", 23, 6, 4, [{
                                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                                    "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                                }]];
                            case 0x26:
                                auxv2 = Plataforma.obtSLA(op1);
                                this.escribirMemoria(dir1+auxv1, auxv2[0]);
                                this.estBanderasOp("SLA", [auxv2]);
                                return ["SLA", 23, 6, 4, [{
                                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                                    "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                                }]];
                            case 0x2E:
                                auxv2 = Plataforma.obtSRA(op1);
                                this.escribirMemoria(dir1+auxv1, auxv2[0]);
                                this.estBanderasOp("SRA", [auxv2]);
                                return ["SRA", 23, 6, 4, [{
                                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                                    "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                                }]];
                            case 0x3E:
                                auxv2 = Plataforma.obtSRL(op1);
                                this.escribirMemoria(dir1+auxv1, auxv2[0]);
                                this.estBanderasOp("SRL", [auxv2]);
                                return ["SRL", 23, 6, 4, [{
                                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                                    "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                                }]];
                            /* 11bbb110 */
                            case 198: case 206: case 214: case 222: case 230: case 238: case 246: case 254:
                                dir2 = (cod-198)>>3;
                                this.escribirMemoria(dir1+auxd1, (op1|(1<<dir2)));
                                return ["SET", 23, 6, 4, [{
                                    "tipo": TipoOpEns.BIT,
                                    "texto": dir2
                                },{
                                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                                    "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                                }]];
                            /* 10bbb110 */
                            case 134: case 142: case 150: case 158: case 166: case 174: case 182: case 190:
                                dir2 = (cod-134)>>3;
                                this.escribirMemoria(dir1+auxd1, (op1-(1<<dir2)));
                                return ["RES", 23, 6, 4, [{
                                    "tipo": TipoOpEns.BIT,
                                    "texto": dir2
                                },{
                                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                                    "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                                }]];
                            /* 01bbb110 */
                            case 70: case 78: case 86: case 94: case 102: case 110: case 118: case 126:
                                dir2 = (cod-70)>>3;
                                this.estBanderasOp("BIT", [op1, dir2]);
                                return ["BIT", 20, 5, 4, [{
                                    "tipo": TipoOpEns.BIT,
                                    "texto": dir2
                                },{
                                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                                    "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                                }]];
                            default:
                                throw new CodigoIlegalError(codl);
                        }
                    case 0xE1:
                        this.escribirRegistro("pc", dir+1);
                        op1 = this.leerPila();
                        this.retirarPila();
                        this.escribirRegistro((codl[0] == 0xDD)?"ix":"iy", op1);
                        return ["POP", 14, 4, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": (codl[0] == 0xDD)?"IX":"IY"
                        }]];
                    case 0xE3:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = this.leerRegistro("sp");
                        op1 = this.leerPalabra(dir1);
                        op2 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        this.escribirRegistro((codl[0] == 0xDD)?"ix":"iy", op1);
                        this.escribirPalabra(dir1, op2);
                        return ["EX", 23, 6, 2, [{
                            "tipo": TipoOpEns.DIRECCION_R,
                            "texto": "(SP)"
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": (codl[0] == 0xDD)?"IX":"IY"
                        }]];
                    case 0xE5:
                        this.escribirRegistro("pc", dir+1);
                        op1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        this.insertarPila(op1);
                        return ["PUSH", 15, 4, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": (codl[0] == 0xDD)?"IX":"IY"
                        }]];
                    case 0xE9:
                        op1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        this.escribirRegistro("pc", op1);
                        return ["JP", 8, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": (codl[0] == 0xDD)?"IX":"IY"
                        }]];
                    case 0xF9:
                        this.escribirRegistro("pc", dir+1);
                        op1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        this.escribirRegistro("sp", op1);
                        return ["LD", 14, 4, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "SP"
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": (codl[0] == 0xDD)?"IX":"IY"
                        }]];
                    /* 00rr1001 */
                    case 9: case 25: case 41: case 57:
                        this.escribirRegistro("pc", dir+1);
                        dir1 = (cod-9)>>4;
                        op1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        op2 = this.leerRegistro(this.ValsRR[dir1]);
                        res = op1+op2;
                        this.escribirRegistro((codl[0] == 0xDD)?"ix":"iy", res);
                        this.estBanderasOp("ADD", [res, op1, op2]);
                        return ["ADD", 15, 4, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": (codl[0] == 0xDD)?"IX":"IY"
                        }, {
                            "tipo": (dir1 < 2)?TipoOpEns.REGISTRO_PAR:TipoOpEns.REGISTRO,
                            "texto": this.ValsRR[dir1]
                        }]];
                    /* 01110rrr */
                    case 112: case 113: case 114: case 115: case 116: case 117: case 118: case 119:
                        this.escribirRegistro("pc", dir+2);
                        dir2 = cod-112;
                        op2 = this.leerRegistro(this.ValsR[dir2]);
                        dir1 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd1 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                        this.escribirMemoria(dir1+auxd1, op2);
                        return ["LD", 19, 5, 3, [{
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd1)+")"
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[dir2]
                        }]];
                    /* 01rrr110 */
                    case 70: case 78: case 86: case 94: case 102: case 110: case 118: case 126:
                        this.escribirRegistro("pc", dir+2);
                        dir1 = (cod-70)>>3;
                        dir2 = this.leerRegistro((codl[0] == 0xDD)?"ix":"iy");
                        auxd2 = decodificarValor([this.leerMemoria(dir+1)], 1, true, true);
                        op2 = this.leerMemoria(dir2+auxd2);
                        this.escribirRegistro(this.ValsR[dir1], op2);
                        return ["LD", 19, 5, 3, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[dir1]
                        }, {
                            "tipo": TipoOpEns.DESPLAZAMIENTO,
                            "texto": "("+((codl[0] == 0xDD)?"IX":"IY")+this.imprimirValor(TipoOpEns.DESPLAZAMIENTO, auxd2)+")"
                        }]];
                    default:
                        throw new CodigoIlegalError(codl);
                }
            default:
                throw new CodigoIlegalError(codl);
        }
    }

    /**
     * Envía un mensaje al registro de mensajes
     *
     * @param {TipoLog} tipo Tipo de mensaje a escribir en el registro de mensajes
     * @param {String} mensaje Mensaje a escribir en el registro de mensajes
     * @memberof Plataforma
     */
    escribirLog(tipo, mensaje){
        let log = document.querySelector("#r-msg ul");
        let li = document.createElement("li");
        switch (tipo){
            case TipoLog.INFO:
                li.className = "info";
                break;
            case TipoLog.AVISO:
                li.className = "aviso";
                break;
            case TipoLog.ERROR:
                li.className = "error";
                break;
        }
        let time = document.createElement("time");
        time.textContent = new Intl.DateTimeFormat("es-MX", {
            hour12: true,
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          }).format(Date.now());
        let txt = document.createElement("span");
        txt.textContent = mensaje;
        li.append(time, txt);
        log.appendChild(li);
    }

    /**
     * Ejecuta el programa, y modifica la interfaz en consecuencia
     *
     * @param {Boolean} todo Si es verdadero, ejecuta el programa hasta encontrar un HALT, de lo contrario, solo ejecuta una instrucción
     * @param {Number} fin
     * @memberof Plataforma
     */
    ejecutar(fin){
        let inst, li;
        let ol = document.getElementById("hist_inst");
        let eTamInst = document.getElementById("outTamInst");
        let eTiempo2MHz = document.getElementById("outTiempo2MHz");
        let eTiempoT = document.getElementById("outTiempoT");
        let eTiempoM = document.getElementById("outTiempoM");
        let eNumInst = document.getElementById("outNumInst");
        let eTiempo2MHzT = document.getElementById("outTiempo2MHzT");
        let eTiempoTT = document.getElementById("outTiempoTT");
        let eTiempoMT = document.getElementById("outTiempoMT");
        if (eNumInst.textContent == "—") eNumInst.textContent = "0";
        if (eTiempo2MHzT.textContent == "—") eTiempo2MHzT.textContent = "0";
        if (eTiempoTT.textContent == "—") eTiempoTT.textContent = "0";
        if (eTiempoMT.textContent == "—") eTiempoMT.textContent = "0";
        while (true){
            try {
                if (fin && Date.now() > fin) throw new BucleInfinitoError();
                inst = this.ejecutarInstruccion();
            } catch (e){
                if ("mostrar" in e) e.mostrar();
                else console.error(e);
                throw e;
            }
            /* Datos principales */
            document.getElementById("outUltInstMnemo").textContent = inst[0];
            let e = document.getElementById("outUltInstParams");
            e.textContent = "";
            if (inst[4].length > 0){
                inst[4].forEach((p, i) => {
                    let el = document.createElement("span");
                    let eld = document.createElement("span");
                    switch (p.tipo){
                        case TipoOpEns.NUMERO:
                            eld.textContent = p.texto;
                            el.dataset.tipo = _("tipo_numero");
                            el.classList.add("tipo_numero");
                            break;
                        case TipoOpEns.REGISTRO:
                            eld.textContent = p.texto.toUpperCase();
                            el.dataset.tipo = _("tipo_registro");
                            el.classList.add("tipo_registro");
                            break;
                        case TipoOpEns.REGISTRO_PAR:
                            eld.textContent = p.texto.toUpperCase();
                            el.dataset.tipo = _("tipo_registro_par");
                            el.classList.add("tipo_registro_par");
                            break;
                        case TipoOpEns.BANDERA:
                            eld.textContent = p.texto.toUpperCase();
                            el.dataset.tipo = _("tipo_bandera");
                            el.classList.add("tipo_bandera");
                            break;
                        case TipoOpEns.DIRECCION:
                            eld.textContent = p.texto;
                            el.dataset.tipo = _("tipo_direccion");
                            el.classList.add("tipo_direccion");
                            break;
                        case TipoOpEns.DIRECCION_R:
                            eld.textContent = p.texto;
                            el.dataset.tipo = _("tipo_direccion_r");
                            el.classList.add("tipo_direccion_r");
                            break;
                        case TipoOpEns.DESPLAZAMIENTO:
                            eld.textContent = p.texto;
                            el.dataset.tipo = _("tipo_desplazamiento");
                            el.classList.add("tipo_desplazamiento");
                            break;
                        case TipoOpEns.BIT:
                            eld.textContent = p.texto;
                            el.dataset.tipo = _("tipo_bit");
                            el.classList.add("tipo_bit");
                    }
                    el.appendChild(eld);
                    e.appendChild(el);
                    if (i == 0 && inst[4].length > 1) e.appendChild(document.createTextNode(", "));
                });
            }
            /* Copia en histórico */
            li = document.createElement("li");
            li.innerHTML = e.parentNode.children[0].textContent + " " + e.innerHTML;
            ol.appendChild(li);
            /* Datos de tabla */
            eTamInst.textContent = inst[3];
            eTiempo2MHz.textContent = inst[1]/2.5;
            eTiempoT.textContent = inst[1];
            eTiempoM.textContent = inst[2];
            eNumInst.textContent = parseInt(eNumInst.textContent) + 1;
            eTiempo2MHzT.textContent = parseInt(eTiempo2MHzT.textContent) + inst[1]/2.5;
            eTiempoTT.textContent = parseInt(eTiempoTT.textContent) + inst[1];
            eTiempoMT.textContent = parseInt(eTiempoMT.textContent) + inst[2];
            if (inst[0] == "HALT"){
                plat.escribirLog(TipoLog.INFO, _("msg_ejecucion_finalizada"));
                break;
            } else if (!fin) break;
        }
    }
    
    /**
     * Establece el estado de la CPU
     *
     * @param {Estado} es Estado: si verdadero, en ejecución, de lo contrario, en espera
     * @memberof Plataforma
     */
    estEstado(es){
        this.estado = es;
        let eti = document.getElementById("outEstado");
        switch (es){
            case Estado.LISTO:
                eti.textContent = _("estado_listo"); break;
            case Estado.EJECUCION:
                eti.textContent = _("estado_ejecucion"); break;
            case Estado.ESPERA:
                eti.textContent = _("estado_pausa");
        }
    }

    constructor(){
        this.estEstado(Estado.LISTO);
        // Establecer SP
        this.escribirRegistro("SP", parseInt(localStorage.getItem("selPlatMem"))-1);
    }
}