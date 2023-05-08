"use strict"

// Enums


// Analizador para un archivo Intel hexadecimal de 8 bits
class ProgramaHex {
    #ast = []
}

// Analizador de valores, para ensamblador

// Analizador para un archivo en ensamblador
class ProgramaAsm {

    /* Expresiones regulares */
    // NOTE: Esta expresión presupone que la definición de variables tiene una sintaxis diferente a las demás directivas, y que el compilador las procesará por separado

    #r_ins = /^([A-Z_0-9]+|[a-z_0-9]+)\s*/;
    #r_var = /^([A-Za-z_][A-Za-z_0-9]+)\s*:\s*([A-Z]+|[a-z]+)\s+/;
    #r_eti = /^([A-Za-z_][A-Za-z_0-9]+)\s*:/;
    //#r_id = /^[A-Za-z_][A-Za-z_0-9]+/;

    #ast = []
    get(){return this.#ast;}
    /*
    var: e: db 4,4
    eti: e:
    ins: ld a, 4
    com: ;
    */

    // Realiza el análisis léxico y sintáctico de una línea de ensamblador
    analizar (l, lnum){
        console.log("Lexing: "+lnum);
        var el = l.trim();
        if (!el.length) { return; }
        while (el.length > 0){
            if (this.#r_ins.test(cexp)){
                // Es posiblemente una instrucción o directiva
                var res = this.#r_ins.exec(cexp);
                var exp = ;
                
                return;
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