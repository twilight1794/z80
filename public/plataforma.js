"use strict"

// Enums
class TipoLog {
    static INFO = new TipoLog("info");
    static AVISO = new TipoLog("aviso");
    static ERROR = new TipoLog("error");
    constructor(name){ this.name = name; }
}

// Excepciones
class BaseError extends Error {
    linea(lnum){
        this.lnum = lnum;
        this.message = "En la línea %l: ".replace("%l", lnum) + this.message;
    }
}

class SintaxisError extends BaseError {
    constructor (){
        super();
        this.message = "Error de sintaxis desconocido.";
    }
}
class NoImplementadoError extends SintaxisError {
    constructor (cmd){
        super(lnum);
        this.cmd = cmd;
        this.message = "El mnemotécnico o directiva "+cmd+" no ha sido implementado aún.";
    }
}
/*class EtiquetaFueraError extends SintaxisError {
    constructor (id){
        super();
        this.id = id;
        this.message = "La variable \""+id+"\" debe ser definida antes de cualquier instrucción.";
    }
}*/
class EtiquetaExistenteError extends SintaxisError {
    constructor (id){
        super();
        this.id = id;
        this.message = "La etiqueta \""+id+"\" ya fue declarada anteriormente.";
    }
}
class ExpresionInvalidaError extends SintaxisError {
    constructor (sim){
        super();
        this.sim = sim;
        this.message = "La expresión \""+sim+"\" es inválida.";
    }
}
// QUESTION: ¿Se mantendrá esto? Las directivas sí podrán aceptar más de dos parámetros
class NumeroParametrosExcedidoError extends SintaxisError {
    constructor(){
       super();
       this.message = "Se han recibido más de 2 parámetros en una instrucción";
    }
}
class NumeroParametrosIncorrectoError extends SintaxisError {
    constructor (ins, nc, nr){
        super();
        this.ins = ins;
        this.nc = nc;
        this.nr = nr;
        this.message = "La instrucción \""+ins+"\" esperaba "+nc.toString()+" parámetros, pero ha recibido "+nr.toString()+".";
    }
}

class ReferenciaError extends BaseError {
    constructor (){
        super();
        this.message = "Error de referencia desconocido.";
    }
}
class DireccionInvalidaError extends ReferenciaError {
    constructor (dir){
        super();
        this.message = "La dirección de memoria 0x"+dir.toString(16)+" no existe.";
    }
}

class TipoError extends BaseError {
    constructor (){
        super();
        this.message = "Error de tipo desconocido.";
    }
}
class TipoValorError extends TipoError {
    constructor (id){
        super();
        this.id = id;
        this.message = "El tipo \""+id+"\" no se reconoce.";
    }
}

class Plataforma {
    inicio;
    
    /**
     * Carga y procesa un archivo en ensamblador para su posterior ensamblado
     *
     * @param {String} nom Nombre del archivo a cargar
     * @return {Array<String>}
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
        let m = g.mem.tBodies[0].children;
        if (dir < m.length)
            return parseInt(m[dir].children[1].textContent, 16);
        else
            throw new DireccionInvalidaError(dir, -1);
    }
    /**
     * Lee dos bytes de la memoria, los interpreta como una palabra, y devuelve su valor
     *
     * @param {Number} dir Dirección de inicio de la palabra a leer
     * @return {Number} Valor de la palabra
     * @memberof Plataforma
     */
    leerPalabra(dir){
        let m = g.mem.tBodies[0].children;
        if (dir < m.length && dir+1 < m.length){
            let l = m[dir].children[1].textContent;
            let h = m[dir+1].children[1].textContent;
            return parseInt(h+l, 16);
        } else
            throw new DireccionInvalidaError(dir, -1);
    }

    /**
     * Escribe sobre un byte de la memoria
     *
     * @param {Number} dir Dirección de memoria a escribir
     * @param {*} val Valor a escribir sobre la dirección especificada
     * @memberof Plataforma
     */
    escribirMemoria(dir, val){
        let m = g.mem.tBodies[0].children;
        val.forEach(b => {
            if (b > 255) throw new ValorTamanoError(b, 1);
            if (dir < m.length){
                let p = m[dir].children;
                p[1].textContent = b.toString(16).toUpperCase();
                p[2].textContent = "-"; // FIX: Colocar función para obtener ASCII
                return;
            } else
                throw new DireccionInvalidaError(dir);
        });
    }

    // Lee un registro, y devuelve su valor
    leerRegistro(reg){
        switch(reg){
            case "A":
            case "B":
            case "C":
            case "D":
            case "E":
            case "H":
            case "L":
            case "I":
            case "R":
            case "A'":
            case "B'":
            case "C'":
            case "D'":
            case "E'":
            case "H'":
            case "L'":
                val = parseInt(document.getElementById("v-"+reg[0].toLowerCase()+((reg.length>1)?"a":"")).textContent, 16);
            case "IX":
            case "IY":
            case "SP":
            case "PC":
                val = parseInt(document.getElementById("v-"+reg.toLowerCase()).textContent, 16);
            case "BC":
            case "DE":
            case "HL":
            case "BC'":
            case "DE'":
            case "HL'":
                val = parseInt(document.getElementById("v-"+reg[0].toLowerCase()+((reg.length>2)?"a":"")).textContent + document.getElementById("v-"+reg[1].toLowerCase()+((reg.length>2)?"a":"")).textContent, 16);
        }
        return val;
    }

    // Escribe sobre un registro
    escribirRegistro(reg, val){
        switch(reg){
            case "A":
            case "B":
            case "C":
            case "D":
            case "E":
            case "H":
            case "L":
            case "I":
            case "R":
            case "A'":
            case "B'":
            case "C'":
            case "D'":
            case "E'":
            case "H'":
            case "L'":
                if (val > 255) throw new ValorTamanoError(val, 1);
                document.getElementById("v-"+reg[0].toLowerCase()+((reg.length>1)?"a":"")).textContent = val.toString(16).toUpperCase();
            case "IX":
            case "IY":
            case "SP":
            case "PC":
                if (val > 65535) throw new ValorTamanoError(val, 1);
                document.getElementById("v-"+reg.toLowerCase()).textContent = val.toString(16).toUpperCase();
            case "BC":
            case "DE":
            case "HL":
            case "BC'":
            case "DE'":
            case "HL'":
                if (val > 65535) throw new ValorTamanoError(val, 1);
                va = val.toString(16).padStart(4,"0").substring(0,2);
                vb = val.toString(16).padStart(4,"0").substring(2,4);
                document.getElementById("v-"+reg[0].toLowerCase()+((reg.length>2)?"a":"")).textContent = vb;
                document.getElementById("v-"+reg[1].toLowerCase()+((reg.length>2)?"a":"")).textContent = va;
        }
        return;
    }

    // Averigua si una bandera está activada o no
    leerBandera(band){
        return (document.getElementById("v-"+reg[0].toLowerCase()+((band.length>1)?"a":"")).textContent) == 1;
    }

    // Establece el valor de una bandera
    escribirBandera(band, val){
        document.getElementById("v-"+reg[0].toLowerCase()+((band.length>1)?"a":"")).textContent = Boolean(val);
        return;
    }

    // Cambia el valor de una bandera 
    toggleBandera(band){
        var el = document.getElementById("v-"+reg[0].toLowerCase()+((band.length>1)?"a":""))
        el.textContent = ((el.textContent == 1)?"0":"1");
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
}