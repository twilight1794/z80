"use strict"

// Enums
class TipoLog {
    static INFO = new TipoLog("info");
    static AVISO = new TipoLog("aviso");
    static ERROR = new TipoLog("error");
    constructor(name){ this.name = name; }
}

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

/* Funciones útiles de interpretación de bytes */

/**
 * Dado un valor entero, devuelve los bytes que deben escribirse en memoria
 * Considera el signo y el endianness
 * 
 * @param {Number} x Número a procesar
 * @param {Number} t Tamaño en bytes del valor a escribir
 * @return {Array<Number>} Array con los bytes a escribir
 * @see obtNumLittleEndian
 */
function obtLittleEndianNum(x, t){
    /* Signo */
    let n;
    if (x>-1) n = x.toString(16).padStart(t*2, "0");
    else n = (parseInt(Array.from(Math.abs(x).toString(2).padStart(t*8, 0)).map((d) => ((d=="1")?0:1) ).join(""), 2) + 1).toString(16).padStart(t*8, "0");
    /* Endianness */
    return n.substring(n.length-t*2).match(/.{2}/g).reverse().map((p) => parseInt(p, 16) );
}

/**
 * Dado un valor codificado, devuelve el valor real, según sus características
 *
 * @param {Number} x Número codificado en memoria
 * @param {Number} t Tamaño en bytes del valor a escribir
 * @param {Boolean} s Si verdadero, indica que el valor es signado, de lo contrario, es no signado
 * @return {Number} Valor real representado
 * @see obtLittleEndianNum
 */
function obtNumLittleEndian(x, t, s){
    if (t == 2) return x; // Al no manejar palabras signadas, el valor obtenido ya es el correcto
    else if (!s) return x; // Lo mismo con bytes no signados
    // En este punto, el número debe ser de 1 byte, y signado
    else if (x < 128) return x;
    else return Plataforma.obtComplemento(x, 2)*-1;
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
    inicio = 0;

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

    /* Operaciones comunes */
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

    /**
     * 
     * Devuelve el complemento a 1 o 2 de un valor
     *
     * @param {Number} x Valor a complementar
     * @param {Number} t Tipo de operación: n para complemento a n
     * @return {Number} Valor complementado
     * @memberof Plataforma
     */
    static obtComplemento(x, t){
        return parseInt(Array.from(x.toString(2).padStart(8, "0")).map((d) => ((d == "1")?"0":"1") ).join(""), 2) + (t-1);
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
        //t = this.preprocesar();
        return t.split("\n");
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
        if (dir < 0 || t < dir) throw new DireccionInvalidaError({"dir": dir});
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
        if (dir < 0 || t < dir) throw new DireccionInvalidaError({"dir": dir});
        if (val > 255) throw new ValorTamanoError({"t": 1});
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
        if (val > 65535) throw new ValorTamanoError({"t": 2});
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
                document.getElementById("v-"+reg).textContent = val.toString(16).toUpperCase();
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
        cval.addEventListener("change", pilaValidarEdicion );
        cval.addEventListener("blur", pilaValidarEdicion );
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
     * Comprueba una condición específica con banderas
     *
     * @param {Number} cc Valor CC a comprobar
     * @return {Boolean} Validez de la condición
     * @memberof Plataforma
     */
    comprobarCondicion(cc){
        switch (cc){
            case 0:
                return !this.leerBandera("zf");
            case 1:
                return this.leerBandera("zf");
            case 2:
                return !this.leerBandera("cf");
            case 3:
                return this.leerBandera("cf");
            case 4:
                return !this.leerBandera("pf");
            case 5:
                return this.leerBandera("pf");
            case 6:
                return !this.leerBandera("sf");
            case 7:
                return this.leerBandera("sf");
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
                // TODO: Regresar
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
                val1 = this.leerMemoria(dir1);
                this.escribirRegistro("a", val1);
                return ["LD", 7, 2, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(BC)"
                }]];
            case 0xf:
                this.escribirRegistro("pc", dir+1);
                // TODO: Regresar
                return ["RRCA", 4, 1, 1, []];
            case 0x10:
                op1 = obtNumLittleEndian(this.leerMemoria(dir+1), 1, true);
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
                    "texto": op1+2
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
                // TODO: Regresar
                return ["RLA", 4, 1, 1, []];
            case 0x18:
                op1 = obtNumLittleEndian(this.leerMemoria(dir+1), 1, true);
                this.escribirRegistro("pc", dir + op1 + 2);
                return ["JR", 12, 3, 2, [{
                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                    "texto": op1 + 2
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
                // TODO: Regresar
                return ["RRA", 4, 1, 1, []];
            case 0x20:
            case 0x28:
                op1 = obtNumLittleEndian(this.leerMemoria(dir+1), 1, true);
                auxv1 = this.leerBandera("zf");
                if ((!aux && cod == 20) || (aux && cod == 28)){
                    this.escribirRegistro("pc", dir + op1 + 2);
                    tt = 12;
                    tm = 3;
                } else {
                    tt = 7;
                    tm = 2;
                }
                return ["JR", tt, tm, 2, [{
                    "tipo": TipoOpEns.BANDERA,
                    "texto": ((cod == 20)?"N":"")+"Z"
                }, {
                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                    "texto": op1 + 2
                }]];
            case 0x22:
                this.escribirRegistro("pc", dir+3);
                dir1 = this.leerPalabra(dir+1);
                op2 = this.leerRegistro("hl");
                this.escribirMemoria(dir1, op2);
                return ["LD", 16, 5, 3, [{
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": "("+dir1+")"
                }, {
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "HL"
                }]];
            case 0x27:
                // TODO: Regresar
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
                    "texto": "("+dir1+")"
                }]];
            case 0x2f:
                this.escribirRegistro("pc", dir+1);
                auxv1 = this.leerRegistro("a");
                auxv2 = obtComplemento(auxv1, 1);
                return ["CPL", 4, 1, 1, []];
            case 0x30:
            case 0x38:
                op1 = obtNumLittleEndian(this.leerMemoria(dir+1), 1, true);
                auxv1 = this.leerBandera("cf");
                if ((!aux && cod == 30) || (aux && cod == 38)){
                    this.escribirRegistro("pc", dir + op1 + 2);
                    tt = 12;
                    tm = 3;
                } else {
                    tt = 7;
                    tm = 2;
                }
                return ["JR", tt, tm, 2, [{
                    "tipo": TipoOpEns.BANDERA,
                    "texto": ((cod == 30)?"N":"")+"C"
                }, {
                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                    "texto": op1 + 2
                }]];
            case 0x32:
                this.escribirRegistro("pc", dir+3);
                dir1 = this.leerPalabra(dir+1);
                op2 = this.leerRegistro("a");
                this.escribirMemoria(dir1, op2);
                return ["LD", 16, 5, 3, [{
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": "("+dir1+")"
                }, {
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }]];
            case 0x36:
                this.escribirRegistro("pc", dir+2);
                op1 = this.leerMemoria(dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = this.escribirMemoria(dir2, op1);
                return ["LD", 10, 3, 2, [{
                    "tipo": TipoOpEns.DESPLAZAMIENTO,
                    "texto": "(HL+"+op1+")"
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op2
                }]];
            case 0x34:
                this.escribirRegistro("pc", dir+1);
                dir1 = this.leerRegistro("hl");
                op1 = obtNumLittleEndian(this.leerMemoria(dir1), 1, true) + 1;
                this.escribirMemoria(dir1, obtLittleEndianNum(op1, 1));
                this.escribirBandera("sf", (op1<0));
                this.escribirBandera("zf", (op1 == 0));
                this.escribirBandera("hf", (op1 == 16));
                this.escribirBandera("pf", (op1 == 0x80));
                this.escribirBandera("nf", false);
                return ["INC", 11, 3, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0x35:
                this.escribirRegistro("pc", dir+1);
                dir1 = this.leerRegistro("hl");
                op1 = obtNumLittleEndian(this.leerMemoria(dir1), 1, true) - 1;
                this.escribirMemoria(dir1, obtLittleEndianNum(op1, 1));
                this.escribirBandera("sf", (op1<0));
                this.escribirBandera("zf", (op1 == 0));
                this.escribirBandera("hf", (op1 == 15));
                this.escribirBandera("pf", (op1 == 0x7f));
                this.escribirBandera("nf", true);
                return ["DEC", 11, 3, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0x37:
                this.escribirRegistro("pc", dir+1);
                this.escribirBandera("cf", true);
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
                    "texto": "("+op2+")"
                }]];
            case 0x3F:
                this.escribirRegistro("pc", dir+1);
                this.escribirBandera("cf", false);
                return ["CCF", 4, 1, 1, []];
            case 0x76:
                this.escribirRegistro("pc", dir+1);
                return ["HALT", 4, 1, 1, []];
            case 0x86:
                this.escribirRegistro("pc", dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = obtNumLittleEndian(this.leerMemoria(dir2), 1, true);
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                res = op1+op2;
                this.escribirRegistro("a",  obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128));
                this.escribirBandera("nf", false);
                // TODO: Carry flag
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
                op2 = obtNumLittleEndian(this.leerMemoria(dir2), 1, true);
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                auxv1 = this.leerBandera("cf");
                res = op1+op2+(auxv1?1:0);
                this.escribirRegistro("a", obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128));
                this.escribirBandera("nf", false);
                // TODO: Carry flag
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
                op2 = obtNumLittleEndian(this.leerMemoria(dir2), 1, true);
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                res = op1-op2;
                this.escribirRegistro("a", obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128));
                this.escribirBandera("nf", true);
                // TODO: Carry flag
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
                op2 = obtNumLittleEndian(this.leerMemoria(dir2), 1, true);
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                auxv1 = this.leerBandera("cf");
                res = op1-op2-(auxv1?1:0);
                this.escribirRegistro("a", obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128));
                this.escribirBandera("nf", true);
                // TODO: Carry flag
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
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", false);
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
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", false);
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
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", false);
                return ["OR", 7, 2, 1, [{
                    "tipo": TipoOpEns.DIRECCION_R,
                    "texto": "(HL)"
                }]];
            case 0xBE:
                this.escribirRegistro("pc", dir+1);
                dir2 = this.leerRegistro("hl");
                op2 = obtNumLittleEndian(this.leerMemoria(dir2), 1, true);
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                res = op2-op1;
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", true);
                // TODO: Carry flag
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
                    "texto": op1
                }]];
            case 0xC6:
                this.escribirRegistro("pc", dir+2);
                op1 = obtNumLittleEndian(this.leerRegistro("A"), 1, true);
                op2 = obtNumLittleEndian(this.leerMemoria(dir+1), 1, true);
                res =  op1+op2;
                this.escribirRegistro("A", obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                // TODO: Carry flag
                return ["ADD", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op1
                }]];
            case 0xC9:
                auxv1 = this.leerPila();
                this.retirarPila();
                this.escribirRegistro("pc", auxv1);
                return ["RET", 10, 3, 1, []];
            case 0xCD:
                auxv1 = this.leerRegistro("pc");
                this.insertarPila(auxv1);
                op1 = this.leerPalabra(dir+1);
                this.escribirRegistro("pc", op1);
                return ["CALL", 17, 5, 3, [{
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": op1
                }]];
            case 0xCE:
                this.escribirRegistro("pc", dir+2);
                op2 = obtNumLittleEndian(this.leerMemoria(dir+1), 1, true);
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                auxv1 = this.leerBandera("cf");
                res = op1+op2+(auxv1?1:0);
                this.escribirRegistro("a", obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128));
                this.escribirBandera("nf", false);
                // TODO: Carry flag
                return ["ADC", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op1,
                }]];
            case 0xD3:
                this.escribirRegistro("pc", dir+2);
                op1 = this.leerMemoria(dir+1);
                return ["OUT", 11, 3, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op1.toString(16).padStart(2, "0")
                }]];
            case 0xD6:
                this.escribirRegistro("pc", dir+2);
                op2 = obtNumLittleEndian(this.leerMemoria(dir+1), 1, true);
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                res = op1-op2;
                this.escribirRegistro("a", obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128));
                this.escribirBandera("nf", true);
                // TODO: Carry flag
                return ["SUB", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op2.toString(16).padStart(2, "0")
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
                return ["IN", 11, 3, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op1.toString(16).padStart(2, "0")
                }]];
            case 0xDE:
                this.escribirRegistro("pc", dir+2);
                op2 = obtNumLittleEndian(this.leerMemoria(dir + 1), 1, true);
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                auxv1 = this.leerBandera("cf");
                res = op1-op2-(auxv1?1:0);
                this.escribirRegistro("a", obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128));
                this.escribirBandera("nf", true);
                // TODO: Carry flag
                return ["SBC", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op1.toString(16).padStart(2, "0")
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
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", false);
                return ["AND", 7, 2, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op2.toString(16).padStart(2, "0")
                }]];
            case 0xE9:
                // NOTE: hacer notar a Danjiro de la discrepancia en la sintaxis (HL) y HL
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
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", false);
                return ["XOR", 7, 2, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op2.toString(16).padStart(2, "0")
                }]];
            case 0xF3:
                this.escribirRegistro("pc", dir+1);
                return ["DI", 4, 1, 1, []];
            case 0xF6:
                this.escribirRegistro("pc", dir+2);
                op2 = this.leerMemoria(dir+1);
                op1 = this.leerRegistro("a");
                res = Plataforma.obtOr(op1, op2);
                this.escribirRegistro("a", res);
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", false);
                return ["OR", 7, 2, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op2.toString(16).padStart(2, "0")
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
                return ["EI", 4, 1, 1, []];
            case 0xFE:
                this.escribirRegistro("pc", dir+2);
                op2 = obtNumLittleEndian(this.leerMemoria(dir+1), 1, true);
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                res = op2-op1;
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", true);
                // TODO: Carry flag
                return ["CP", 7, 2, 2, [{
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op2.toString(16).padStart(2, "0")
                }]];
            /* Compuestos */
            /** 00dd0001 **/
            case 1: case 17: case 33: case 49:
                op1 = (cod-1)>>4;
                op2 = this.leerPalabra(dir+1);
                this.escribirRegistro(this.ValsSS[op1], op2);
                return ["LD", 10, 2, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsSS[op1]
                }, {
                    "tipo": TipoOpEns.DIRECCION,
                    "texto":  op2.toString(16).padStart(4, "0")
                }]];
            /** 00rrr100 **/
            case 4: case 12: case 20: case 28: case 36: case 44: case 60:
                this.escribirRegistro("pc", dir+1);
                dir1 = (cod-4)>>3;
                op1 = obtNumLittleEndian(this.leerRegistro(this.ValsR[dir1]), 1, true) + 1;
                this.escribirRegistro(this.ValsR[dir1], obtLittleEndianNum(op1, 1));
                this.escribirBandera("sf", (op1<0));
                this.escribirBandera("zf", (op1 == 0));
                this.escribirBandera("hf", (op1 == 16));
                this.escribirBandera("pf", (op1 == 0x80));
                this.escribirBandera("nf", false);
                return ["INC", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[op1]
                }]];
            /** 00rrr101 **/
            case 5: case 13: case 21: case 29: case 37: case 45: case 61:
                this.escribirRegistro("pc", dir+1);
                dir1 = (cod-5)>>3;
                op1 = obtNumLittleEndian(this.leerRegistro(this.ValsR[dir1]), 1, true) - 1;
                this.escribirRegistro(this.ValsR[dir1], obtLittleEndianNum(op1, 1));
                this.escribirBandera("sf", (op1<0));
                this.escribirBandera("zf", (op1 == 0));
                this.escribirBandera("hf", (op1 == 15));
                this.escribirBandera("pf", (op1 == 0x7f));
                this.escribirBandera("nf", true);
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
                    "texto": this.ValsR[op1]
                }, {
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": op2.toString(16).padStart(4, "0")
                }]];
            /** 00ss0011 **/
            case 3: case 19: case 35: case 51:
                this.escribirRegistro("pc", dir+1);
                dir1 = (cod-3)>>4;
                op1 = this.leerRegistro(this.ValsSS[dir1]) + 1;
                this.escribirRegistro(this.ValsSS[dir1], op1);
                return ["INC", 6, 1, 1, [{
                    "tipo": ((dir1 == 3)?TipoOpEns.REGISTRO:REGISTRO_PAR),
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
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                // TODO: Carry flag
                return ["ADD", 11, 3, 1, [{
                    "tipo": TipoOpEns.REGISTRO_PAR,
                    "texto": "HL"
                }, {
                    "tipo": ((dir2 == 3)?TipoOpEns.REGISTRO:REGISTRO_PAR),
                    "texto": this.ValsSS[dir2]
                }]];
            /** 00ss1011 **/
            case 11: case 27: case 43: case 59:
                this.escribirRegistro("pc", dir+1);
                dir1 = (cod-11)>>4;
                op1 = this.leerRegistro(this.ValsSS[dir1]) - 1;
                this.escribirRegistro(this.ValsSS[dir1], op1);
                return ["DEC", 6, 1, 1, [{
                    "tipo": ((dir1 == 3)?TipoOpEns.REGISTRO:REGISTRO_PAR),
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
                dir1 = cod & 56;
                dir2 = cod & 7;
                op1 = this.leerRegistro(dir2);
                this.escribirRegistro(dir1);
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
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                op2 = obtNumLittleEndian(this.leerRegistro(this.ValsR[dir2]), 1, true);
                res =  op1+op2;
                this.escribirRegistro("a", obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                // TODO: Carry flag
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
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                op2 = obtNumLittleEndian(this.leerRegistro(this.ValsR[dir2]), 1, true);
                auxv1 = this.leerBandera("cf");
                res = op1+op2+(auxv1?1:0);
                this.escribirRegistro("a", obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128));
                this.escribirBandera("nf", false);
                // TODO: Carry flag
                return ["ADC", 4, 4, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10010rrr **/
            case 144: case 145: case 146: case 147: case 148: case 149: case 151:
                this.escribirRegistro("pc", dir+2);
                dir2 = cod-144;
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                op2 = obtNumLittleEndian(this.leerRegistro(this.ValsR[dir2]), 1, true);
                res = op1-op2;
                this.escribirRegistro("a", obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128));
                this.escribirBandera("nf", true);
                // TODO: Carry flag
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
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                op2 = obtNumLittleEndian(this.leerRegistro(this.ValsR[dir2]), 1, true);
                auxv1 = this.leerBandera("cf");
                res = op1-op2-(auxv1?1:0);
                this.escribirRegistro("a", obtLittleEndianNum(res, 1));
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128));
                this.escribirBandera("nf", true);
                // TODO: Carry flag
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
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                op2 = obtNumLittleEndian(this.leerRegistro(this.ValsR[dir2]), 1, true);
                res = Plataforma.obtAnd(op1, op2);
                this.escribirRegistro("a", res);
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", false);
                return ["AND", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10101rrr **/
            case 168: case 169: case 170: case 171: case 172: case 173: case 175:
                this.escribirRegistro("pc", dir+2);
                dir2 = cod-168;
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                op2 = obtNumLittleEndian(this.leerRegistro(this.ValsR[dir2]), 1, true);
                res = Plataforma.obtXor(op1, op2);
                this.escribirRegistro("a", res);
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", false);
                return ["XOR", 4, 1, 1, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10110rrr **/
            case 176: case 177: case 178: case 179: case 180: case 181: case 183:
                this.escribirRegistro("pc", dir+2);
                dir2 = cod-176;
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                op2 = obtNumLittleEndian(this.leerRegistro(this.ValsR[dir2]), 1, true);
                res = Plataforma.obtOr(op1, op2);
                this.escribirRegistro("a", res);
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                this.escribirBandera("hf", false);
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", false);
                this.escribirBandera("cf", false);
                return ["OR", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": this.ValsR[dir2]
                }]];
            /** 10111rrr **/
            case 184: case 185: case 186: case 187: case 188: case 189: case 183:
                this.escribirRegistro("pc", dir+1);
                dir2 = cod-184;
                op2 = obtNumLittleEndian(this.leerMemoria(dir2), 1, true);
                op1 = obtNumLittleEndian(this.leerRegistro("a"), 1, true);
                res = op2-op1;
                this.escribirBandera("sf", (res<0));
                this.escribirBandera("zf", (res == 0));
                // TODO: Half flag
                this.escribirBandera("pf", (res > 127 || res < -128)); //?
                this.escribirBandera("nf", true);
                // TODO: Carry flag
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
                this.escribirRegistro("pc", (op1?op2:(dir+1)));
                return ["JP", 10, 3, 3, [{
                    "tipo": TipoOpEns.BANDERA,
                    "texto": this.ValsCC[dir1]
                }, {
                    "tipo": TipoOpEns.DIRECCION,
                    "texto": op2.toString(16).padStart(4, "0")
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
                    "texto": op2.toString(16).padStart(4, "0")
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
                    "texto": (op1*8).toString(16).padStart(2, "0")
                }]];
            /* Multibyte */
            case 0xCB:
                dir = dir+1;
                cod = this.leerMemoria(dir);
                codl.push(cod);
            case 0xDD:
                dir = dir+1;
                cod = this.leerMemoria(dir);
                codl.push(cod);
            case 0xED:
                dir = dir+1;
                cod = this.leerMemoria(dir);
                codl.push(cod);
                switch (cod){
                    case 0x45:
                        this.escribirRegistro("pc", dir+1);
                        return ["RETN", 14, 4, 2, []];
                    case 0x46:
                        this.escribirRegistro("pc", dir+1);
                        return ["IM", 8, 2, 2, [{
                            "tipo": TipoOpEns.NUMERO,
                            "texto": "00"
                        }]];
                    case 0x56:
                        this.escribirRegistro("pc", dir+1);
                        return ["IM", 8, 2, 2, [{
                            "tipo": TipoOpEns.NUMERO,
                            "texto": "01"
                        }]];
                    case 0x5E:
                        this.escribirRegistro("pc", dir+1);
                        return ["IM", 8, 2, 2, [{
                            "tipo": TipoOpEns.NUMERO,
                            "texto": "02"
                        }]];
                }
                break;
            case 0xFD:
                dir = dir+1;
                cod = this.leerMemoria(dir);
                codl.push(cod);
                switch (cod){
                    case 0x21:
                        this.escribirRegistro("pc", dir+3);
                        op2 = this.leerPalabra(dir+1);
                        this.escribirRegistro("iy", op2);
                        return ["LD", 14, 4, 4, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "IY"
                        }, {
                            "tipo": TipoOpEns.NUMERO,
                            "texto": op2.toString(16).padStart(4, "0")
                        }]];
                    case 0x22:
                        this.escribirRegistro("pc", dir+3);
                        op1 = this.leerRegistro("iy");
                        dir1 = this.leerPalabra(dir+1);
                        this.escribirPalabra(dir1, op1);
                        return ["LD", 20, 6, 4, [{
                            "tipo": TipoOpEns.DIRECCION,
                            "texto": "("+dir1+")"
                        }, {
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "IY"
                        }]];
                    case 0x23:
                        this.escribirRegistro("pc", dir+1);
                        op1 = this.leerRegistro("iy") + 1;
                        this.escribirRegistro("iy", op1);
                        return ["INC", 10, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "IY"
                        }]];
                    case 0x2A:
                        this.escribirRegistro("pc", dir+3);
                        dir2 = this.leerPalabra(dir+1);
                        op2 = this.leerPalabra(dir2);
                        this.escribirRegistro("iy", op2);
                        return ["LD", 20, 6, 4, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "IY"
                        }, {
                            "tipo": TipoOpEns.DIRECCION,
                            "texto": "("+op2.toString(16).padStart(4, "0")+")"
                        }]];
                    case 0x2B:
                        this.escribirRegistro("pc", dir+1);
                        op1 = this.leerRegistro("iy") - 1;
                        this.escribirRegistro("iy", op1);
                        return ["DEC", 10, 2, 2, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": "IY"
                        }]];
                    case 0x34:
                        this.escribirRegistro("pc", dir+1);
                        op1 = obtNumLittleEndian(this.leerMemoria(dir+1), 1, true) + 1;
                        this.escribirRegistro(this.ValsR[dir1], obtLittleEndianNum(op1, 1));
                        this.escribirBandera("sf", (op1<0));
                        this.escribirBandera("zf", (op1 == 0));
                        this.escribirBandera("hf", (op1 == 16));
                        this.escribirBandera("pf", (op1 == 0x80));
                        this.escribirBandera("nf", false);
                        return ["INC", 4, 1, 1, [{
                            "tipo": TipoOpEns.REGISTRO,
                            "texto": this.ValsR[op1]
                        }]];
                    case 0x35:
                    case 0x86:
                    case 0x8E:
                    case 0x96:
                    case 0x9E:
                    case 0xA6:
                    case 0xAE:
                    case 0xB6:
                    case 0xBE:
                    case 0xCB:
                    case 0xE1:
                    case 0xE3:
                    case 0xE5:
                    case 0xE9:
                    case 0xF9:
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
        time.textContent = (new Date()).toISOString();
        let txt = document.createElement("span");
        txt.textContent = mensaje;
        li.append(time, txt);
        log.appendChild(li);
    }

    /**
     * Ejecuta el programa, y modifica la interfaz en consecuencia
     *
     * @param {Boolean} todo Si es verdadero, ejecuta el programa hasta encontrar un HALT, de lo contrario, solo ejecuta una instrucción
     * @memberof Plataforma
     */
    ejecutar(todo){
        let inst;
        let instIni = document.getElementById("outNumInst");
        if (instIni.textContent == "—"){
            instIni.textContent = "0";
            document.getElementById("outTiempo2MHzT").textContent = "0";
            document.getElementById("outTiempo2MHzT").textContent = "0";
            document.getElementById("outTiempoTT").textContent = "0";
            document.getElementById("outTiempoMT").textContent = "0";
        }
        while (true){
            inst = this.ejecutarInstruccion();
            console.log(inst);
            document.getElementById("outUltInstMnemo").textContent = inst[0];
            let e = document.getElementById("outUltInstParams");
            e.textContent = "";
            if (inst[4].length > 0){
                inst[4].forEach((p, i) => {
                    let el = document.createElement("span");
                    el.textContent = p.texto;
                    switch (p.tipo){
                        case TipoOpEns.NUMERO:
                            el.dataset.tipo = _("tipo_numero");
                            break;
                        case TipoOpEns.REGISTRO:
                            el.dataset.tipo = _("tipo_registro");
                            break;
                        case TipoOpEns.REGISTRO_PAR:
                            el.dataset.tipo = _("tipo_registro_par");
                            break;
                        case TipoOpEns.BANDERA:
                            el.dataset.tipo = _("tipo_bandera");
                            break;
                        case TipoOpEns.DIRECCION:
                            el.dataset.tipo = _("tipo_direccion");
                            break;
                        case TipoOpEns.DIRECCION_R:
                            el.dataset.tipo = _("tipo_direccion_r")
                            break;
                        case TipoOpEns.DESPLAZAMIENTO:
                            el.dataset.tipo = _("tipo_desplazamiento");
                            break;
                        case TipoOpEns.BIT:
                            el.dataset.tipo = _("tipo_bit");
                    }
                    e.appendChild(el);
                    if (i == 0) e.appendChild(document.createTextNode(", "));
                });
            }
            document.getElementById("outTamInst").textContent = inst[3];
            document.getElementById("outTiempo2MHz").textContent = inst[1]/2.5;
            document.getElementById("outTiempoT").textContent = inst[1];
            document.getElementById("outTiempoM").textContent = inst[2];
            let c1 = document.getElementById("outNumInst");
            c1.textContent = parseInt(c1.textContent) + 1;
            let c2 = document.getElementById("outTiempo2MHzT");
            c2.textContent = parseInt(c2.textContent) + inst[1]/2.5;
            let c3 = document.getElementById("outTiempoTT");
            c3.textContent = parseInt(c3.textContent) + inst[1];
            let c4 = document.getElementById("outTiempoMT");
            c4.textContent = parseInt(c4.textContent) + inst[2];
            if (!todo) break;
        }
    }

    constructor(){
        // Establecer SP
        this.escribirRegistro("SP", parseInt(localStorage.getItem("selPlatMem"))-1);
    }
}