"use strict"

/**
 * Clase abstracta para definir todos los errores
 *
 * @class BaseError
 * @extends {Error}
 */
class BaseError extends Error {
    mostrar(){
        let msg;
        if (!(this instanceof EjecucionError)) msg = _("mensaje_err", {"l": this.obj.lnum, "m": this.message});
        else msg = this.message;
        plat.escribirLog(TipoLog.ERROR, msg);
    }
    constructor(msg, args){
        super();
        console.log("Creando Excepción: "+msg);
        if (this.constructor == BaseError) throw new Error("BaseError es una clase abstracta.");
        this.message = _(msg, args);
    }
}

// Errores ocurridos durante la fase del análisis léxico
class LexicoError extends BaseError {
    constructor(){
        if (arguments) super(...arguments);
        else super("err_lexico");
    }
}
/// Errores ocurridos durante la simbolización de una línea
class ValorCASEInvalidoError extends LexicoError {
    constructor(o, v){ super("err_valorcaseinvalido", {"v": v}); this.obj = o; }
}
class ParametroInexistenteError extends LexicoError {
    constructor(o){ super("err_parametroinexistente", {"m": o.mnemo}); this.obj = o; }
}
class MultiplesParametrosError extends LexicoError {
    constructor(o){ super("err_multiplesparametros", {"m": o.mnemo}); this.obj = o; }
}
class EtiquetaInexistenteError extends LexicoError {
    constructor(o){ super("err_etiquetainexistente", {"m": o.mnemo}); this.obj = o; }
}
class DirectivaENDIError extends LexicoError {
    constructor(o){ super("err_directivaendi"); this.obj = o; }
}
/// Errores ocurridos durante la simbolización de parámetros
class ExpresionInvalidaError extends LexicoError {
    constructor(tipo){
        if (typeof tipo == "string"){
            if (tipo.startsWith("[")) super("err_expresioninvalida_cadcorchetes", {e: tipo});
            else super("err_expresioninvalida_cad", {e: tipo});
        }
        else if (tipo instanceof TipoVal) super("err_expresioninvalida_tipoval", {e: tipo.name});
    }
}

// Errores ocurridos durante la fase del análisis sintáctico
class SintacticoError extends BaseError {
    constructor(){
        if (arguments) super(...arguments);
        else super("err_sintactico");
    }
}
class NoImplementadoError extends SintacticoError {
    constructor(m){ super("err_noimplementado", {"m": m}); }
}
class TipoParametrosIncorrectoError extends SintacticoError {
    constructor(m){ super("err_tipoparametrosincorrecto", {"m": m}); }
}
class NumeroParametrosIncorrectoError extends SintacticoError {
    constructor (ins, ne, nr){
        super("err_numeroparametrosincorrecto", {
            "ins": ins,
            "ne": (ne instanceof Array)?(ne.join(" o ")):ne,
            "nr": nr
        });
    }
}
class DesplazamientoNoAdmitidoError extends SintacticoError {
    constructor(o){ super("err_desplazamientonoadmitido"); this.obj = o; }
}

// Errores ocurridos durante la reducción de símbolos de parámetros: errores semánticos
class SemanticoError extends BaseError {
    constructor(){
        if (arguments) super(...arguments);
        else super("err_semantico");
    }
}
class DivisionCeroError extends SemanticoError {
    constructor(){ super("err_division_cero"); }
}
class EtiquetaIndefinidaError extends SemanticoError {
    constructor(i){ super("err_etiquetaindefinida", {"i": i}); }
}
class BucleInfinitoError extends SemanticoError {
    constructor(){ super("err_bucleinfinito"); }
}

// Errores ocurridos durante la fase de ejecución
class EjecucionError extends BaseError {
    constructor(){
        if (arguments) super(...arguments);
        else super("err_ejecucion");
    }
}
class DireccionInvalidaError extends EjecucionError {
    constructor(dir){ super("err_direccioninvalida", {"dir": dir}); }
}
class ValorTamanoError extends EjecucionError {
    constructor(t){ super("err_valortamano", {"t": t}); }
}
class PilaVaciaError extends EjecucionError {
    constructor(){ super("err_pilavacia"); }
}
class MemoriaLlenaError extends EjecucionError {
    constructor(){ super("err_memoriallena"); }
}
class CodigoIlegalError extends EjecucionError {
    constructor(b){ super("err_codigoilegal", {"b": b.join(", ")}); }
}

// Pseudoexcepciones
// Excepciones que no denotan un error, sino que son usadas como mecanismo para salir rápidamente de un bloque, por ello estas clases no heredan de BaseError, sino directamente de Error. Esto es, de hecho, una mala práctica, y deberá ser reescrito en futuras actualizaciones.

// Para programa_asm.esTipo
class NoEsTipoExcepcion extends Error {}