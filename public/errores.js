"use strict"

/**
 * Clase abstracta para definir todos los errores
 *
 * @class BaseError
 * @extends {Error}
 */
class BaseError extends Error {
    generarLog(){
        plat.escribirLog(TipoLog.ERROR, this.mensaje);
    }
    constructor(args){
        super();
        if (this.constructor == BaseError) throw new Error("BaseError es una clase abstracta.");
        // NOTE: esto tal vez debería ser parte de otra función
        this.args = args;
        if (args){
            Object.entries(args).forEach((e) => {
                this.message = this.message.replaceAll("%"+e[0], e[1]);
            });
        }
    }
}

// Errores ocurridos durante la fase del análisis léxico
class LexicoError extends BaseError {
    constructor(args){ super(args); }
    linea(lnum){
        this.lnum = lnum;
        this.message = "Línea %l: ".replace("%l", lnum) + this.message;
    }
    message = "Error desconocido durante el análisis léxico.";
}
/// Errores ocurridos durante la simbolización de una línea
class ValorCASEInvalidoError extends LexicoError {
    constructor(args){ super(args); }
    message = "Valor para directiva CASE inválido: %v.";
}
class ParametroInexistenteError extends LexicoError {
    constructor(args){ super(args); }
    message = "Debes proveer parámetros al mnemotécnico o directiva %m.";
}
class MultiplesParametrosError extends LexicoError {
    constructor(args){ super(args); }
    message = "El mnemotécnico o directiva %m solo admite un parámetro.";
}
class EtiquetaInexistenteError extends LexicoError {
    constructor(args){ super(args); }
    message = "El mnemotécnico o directiva %m requiere especificar una etiqueta.";
}
class DirectivaENDIError extends LexicoError {
    constructor(){ super(); }
    message = "No existe un bloque IF para cerrar.";
}
/// Errores ocurridos durante la simbolización de parámetros
class ExpresionInvalidaError extends LexicoError {
    constructor(tipo){
        super();
        if (tipo instanceof String) this.message = "La expresión "+tipo+" es inválida";
        else if (tipo instanceof TipoVal) this.message = "No se esperaba un símbolo de tipo "+tipo.name+" en la expresión.";
    }
}
/// Errores ocurridos durante la reducción de símbolos de parámetros

// Errores ocurridos durante la fase del análisis sintáctico
class SintacticoError extends BaseError {
    constructor(args){ super(args); }
    message = "Error desconocido durante el análisis sintáctico.";
}
class NoImplementadoError extends SintacticoError {
    constructor(args){ super(args); }
    message = "El mnemotécnico o directiva %m no ha sido implementado aún."
}
class TipoParametrosIncorrectoError extends SintacticoError {
    constructor(args){ super(args); }
    message = "La instrucción %m ha recibido un parámetro de tipo incorrecto.";
}
class NumeroParametrosIncorrectoError extends SintacticoError {
    constructor (...args){
        super();
        this.args = {
            ins: args[0],
            nc: args[1],
            nr: args[2]
        }
        let nctxt = (args[1] instanceof Array)?(args[1].join(" o ")):args[1];
        this.message = "La instrucción "+args[0]+" esperaba "+nctxt+" parámetros, pero ha recibido "+args[2].toString()+".";
    }
}

// Errores ocurridos durante la fase de ejecución
class EjecucionError extends BaseError {
    constructor(args){ super(args); }
    message = "Error desconocido durante la ejecución del programa.";
}
class DireccionInvalidaError extends EjecucionError {
    constructor(args){ super(args); }
    message = "La dirección de memoria 0x%dir no existe.";
}
class ValorTamanoError extends EjecucionError {
    constructor(args){ super(args); }
    message = "El tamaño del valor es demasiado grande para un registro de %t bytes.";
} // NOTE: ¿Se llega realmente a ejecutar esta excepción?
class PilaVaciaError extends EjecucionError {
    constructor(){ super(); }
    message = "La pila ya está vacía";
}
class MemoriaLlenaError extends EjecucionError {
    constructor(){ super(); }
    message = "La pila ha llenado toda la memoria";
}

// Pseudoexcepciones
// Excepciones que no denotan un error, sino que son usadas como mecanismo para salir rápidamente de un bloque, por ello estas clases no heredan de BaseError, sino directamente de Error. Esto es, de hecho, una mala práctica, y deberá ser reescrito en futuras actualizaciones.

// Para programa_asm.esTipo
class NoEsTipoExcepcion extends Error {}