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
     * Ejecuta la instrucción que está en la dirección apuntada por el registro 
     *
     * @returns Array con información sobre la instrucción ejecutada
     * @memberof Plataforma
     */
    ejecutarInstruccion(){
        let dir = this.leerRegistro("pc");
        let cod = this.leerMemoria(dir);
        let op1, op2, dir1, dir2, auxv1, auxd1, auxv2, auxd2, res;
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
                // TODO: Implementar f, fx
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
                }
                return ["DJNZ", [13, 8], [3, 2], [{
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
                if ((!aux && cod == 20) || (aux && cod == 28)) this.escribirRegistro("pc", dir + op1 + 2);
                return ["JR", [12, 7], [3, 2], 2, [{
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
                if ((!aux && cod == 30) || (aux && cod == 38)) this.escribirRegistro("pc", dir + op1 + 2);
                return ["JR", [12, 7], [3, 2], 2, [{
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
                this.escribirRegistro("pc", dir1);
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
                    "tipo": Tipo.DIRECCION,
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
                auxv1 = this.leerRegistro("bc");
                auxv2 = this.leerRegistro("bcx");
                this.escribirRegistro("bc", auxv2);
                this.escribirRegistro("bcx", auxv1);
                auxv1 = this.leerRegistro("de");
                auxv2 = this.leerRegistro("dex");
                this.escribirRegistro("de", auxv2);
                this.escribirRegistro("dex", auxv1);
                auxv1 = this.leerRegistro("hl");
                auxv2 = this.leerRegistro("hlx");
                this.escribirRegistro("hl", auxv2);
                this.escribirRegistro("hlx", auxv1);
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
                return ["SBC", 7, 2, 2, [{
                    "tipo": TipoOpEns.REGISTRO,
                    "texto": "A"
                }, {
                    "tipo": TipoOpEns.NUMERO,
                    "texto": op1.toString(16).padStart(2, "0")
                }]];
            case 0xE3:
            case 0xE6:
            case 0xE9:
            case 0xEB:
            case 0xEE:
            case 0xF3:
            case 0xF6:
            case 0xF9:
            case 0xFB:
            case 0xFE:
            /* Compuestos */
            case 0xCB:
            case 0xDD:
            case 0xED:
            case 0xFD:
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
        document.getElementById("outNumInst").textContent = "0";
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
            let c1 = document.getElementById("outNumInst").textContent;
            document.getElementById("outNumInst").textContent = parseInt(c1) + 1;
            let c2 = document.getElementById("outTiempo2MHz").textContent;
            document.getElementById("outTiempo2MHzT").textContent = parseInt(c2) + inst[1]/2.5;
            let c3 = document.getElementById("outTiempoT").textContent;
            document.getElementById("outTiempoTT").textContent = parseInt(c3) + inst[1];
            let c4 = document.getElementById("outTiempoM").textContent;
            document.getElementById("outTiempoMT").textContent = parseInt(c4) + inst[2];
            if (!todo) break;
        }
    }

    constructor(){
        // Establecer SP
        this.escribirRegistro("SP", parseInt(localStorage.getItem("selPlatMem"))-1);
    }
}