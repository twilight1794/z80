"use strict"

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
class VariableFueraError extends SintaxisError {
    constructor (id){
        super();
        this.id = id;
        this.message = "La variable \""+id+"\" debe ser definida antes de cualquier instrucción.";
    }
}
class VariableExistenteError extends SintaxisError {
    constructor (id){
        super();
        this.id = id;
        this.message = "La variable \""+id+"\" ya fue declarada anteriormente.";
    }
}
class ExpresionInvalidaError extends SintaxisError {
    constructor (sim){
        super();
        this.sim = sim;
        this.message = "La expresión \""+sim+"\" es inválida.";
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
class TipoVariableError extends TipoError {
    constructor (id){
        super();
        this.id = id;
        this.message = "El tipo \""+id+"\" no se reconoce.";
    }
}

class Plataforma {
    // Lee un byte de la memoria, y devuelve su valor
    leerMemoria(dir){
        let m = g.mem.tBodies[0].children;
        if (dir < m.length)
            return parseInt(m[dir].children[1].textContent, 16);
        else
            throw new DireccionInvalidaError(dir, -1);
    }

    // Escribe sobre un byte de la memoria
    escribirMemoria(dir, val){
        let m = g.mem.tBodies[0].children;
        if (val > 255) throw new ValorTamanoError(val, 1);
        if (dir < m.length){
            let p = m[dir].children;
            p[1].textContent = val.toString(16).toUpperCase();
            p[2].textContent = "-"; // FIX: Colocar función para obtener ASCII
            return;
        } else
            throw new DireccionInvalidaError(dir);
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
}