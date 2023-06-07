"use strict"

// Enums
class TipoLog {
    static INFO = new TipoLog("info");
    static AVISO = new TipoLog("aviso");
    static ERROR = new TipoLog("error");
    constructor(name){ this.name = name; }
}

class Plataforma {
    inicio;
    
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
                return parseInt(document.getElementById("v-"+reg[0]+(reg.length == 3)?"x":"").textContent + document.getElementById("v-"+reg[1]+((reg.length == 3)?"x":"")).textContent, 16);
        }
    }

    /**
     * Escribe un valor sobre un registro
     *
     * @param {String} reg Registro a escribir
     * @param {Number} val
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
    constructor(){
        // Establecer SP
        this.escribirRegistro("SP", parseInt(localStorage.getItem("selPlatMem"))-1);
    }
}