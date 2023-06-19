/* 
Requisitos para el programa que lee macros:
-Los  con nombres tienen que ser diferentes, y que el uno no esté incluido en el de otro.
-Solo se puede leer una macro por código.
-Tienen que tener el formato:
  +De declaración: Prueba: MACRO #tres, #cuatro,
                      LD A, cuatro
                      LD B, tres
                      LD A, cuatro
                      LD C, tres
                      MEND 
  +De llamado: Prueba valor1, valor2,

*/

class Parametros{
    constructor(nombre, nombreSustituido){
        this.nombre;
        this.nombreSustituido;
    }
}
  //macro.Parametro.nombre = tres
class Macros{
    constructor(nombre, listaParametros, instrucciones){
        this.nombre;
        this.listaParametros = [];
        this.instrucciones;
  
    }
  }

  
  function buscarMacros(prueba){
    //let regExMacro = /[a-zA-Z0-9]+[:][\s]*[MACRO][[\s#a-zA-Z0-9,.]+]*[MEND]/gm;
    let regExMacro = /[a-zA-Z0-9]+[:][\s]*[MACRO]+[\s]*[(#)(\s#a-zA-Z0-9,.)]*[\n]*[[\s#a-zA-Z0-9,.]+]*[MEND]/gm;
    let m = [];
    let arregloMacros = [];
    let i = 0;
    
    //Se buscan coincidencias y se guardan en un arreglo
    while ((m = regExMacro.exec(prueba)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
        if (m.index === regExMacro.lastIndex) {
            
        regExMacro.lastIndex++;
        }
        
        let bloqueMacros = new Macros();
        //Lógica lista de objeto Parámetros dentro de un objeto Macro
        /*let pruebaParam = new Parametros();
        pruebaParam.nombre = "hola charlie";
        pruebaParam.nombreSustituido = "hola kobeh";
        bloqueMacros.listaParametros.push(pruebaParam);*/
        
    // The result can be accessed through the `m`-variable.
        m.forEach((match) => {bloqueMacros.instrucciones = match});
        arregloMacros[i] = bloqueMacros;
        i++;
        
    }
    
    
    //borrar las declaraciones de macros
    
    for(k = 0; k < arregloMacros.length; k++){
        while(prueba.includes(arregloMacros[k].instrucciones) === true ){
            prueba = prueba.replace(arregloMacros[k].instrucciones, "");
        }
  
    }
    
    // Se crea un arreglo de objetos donde cada objeto separa por partes las macroinstrucciones y su nombre
    let dosPuntos;
    
    
    for(j = 0; j < arregloMacros.length; j++){
        let cont = 0;
        //Asignamos nombre correspondiente a la Macro al atributo "nombre" del objeto dentro de nuestra lista de MACROS
        dosPuntos = arregloMacros[j].instrucciones.lastIndexOf(':');
        arregloMacros[j].nombre = arregloMacros[j].instrucciones.slice(0, dosPuntos);
        //
        //Quitamos el nombre
        arregloMacros[j].instrucciones = arregloMacros[j].instrucciones.replace(arregloMacros[j].nombre + ":", '');
        arregloMacros[j].instrucciones = arregloMacros[j].instrucciones.replace('MACRO', '');
        /*#tres, #cuatro,
            LD A, cuatro
            LD B, tres
            LD A, cuatro
            LD C, tres
            MEND */
        /*Decisión de diseño: Todos los parámetros deberán terminar con una coma,  aunque sea el último:
            hola: MACRO #tres, #cuatro,
  
        */
        while(arregloMacros[j].instrucciones.includes("#") === true){
            let paramTemp;
            let param = new Parametros();
            let indexGato = arregloMacros[j].instrucciones.indexOf('#');
            let coma = arregloMacros[j].instrucciones.indexOf(',');
            paramTemp = arregloMacros[j].instrucciones.slice(indexGato, coma + 1);
            param.nombre = paramTemp;
            param.nombre = param.nombre.replace("#", '');
            param.nombre = param.nombre.replace(",", '');
            arregloMacros[j].listaParametros.push(param);
            /*console.log("#######");
            console.log(paramTemp);
            console.log("#######");*/
            arregloMacros[j].instrucciones = arregloMacros[j].instrucciones.replace(paramTemp, '');
            
            
  
  
            
        }
        arregloMacros[j].instrucciones = arregloMacros[j].instrucciones.replace('MEND', '');
        arregloMacros[j].instrucciones = arregloMacros[j].instrucciones.replace('\n', '');
        arregloMacros[j].instrucciones = arregloMacros[j].instrucciones.replace('\t', '');
        arregloMacros[j].instrucciones = arregloMacros[j].instrucciones.trim();
        
    }
  
    
    //Se remplazan llamados de macros sin parámetros con sus respectivas macroinstrucciones. Se concatena con \n para que otras macros puedan contener el nombre de otra macro en ellas
    for(k = 0; k < arregloMacros.length; k++){
        
        prueba = prueba.replaceAll(arregloMacros[k].nombre + "\n", arregloMacros[k].instrucciones + "\n");        
   
    }
    
    //Se remplazan macros con parámetros
    for(k = 0; k < arregloMacros.length; k++){
        
        while(prueba.includes(arregloMacros[k].nombre) === true ){
  
            let indiceParam = prueba.indexOf(arregloMacros[k].nombre);
            console.log(indiceParam);
            let indiceSaltoDeLinea; 
            //se busca el primer salto de línea
            for(let o = indiceParam; o < prueba.length; o++){
                if(prueba[o] === "\n"){
                    indiceSaltoDeLinea = o;
                    o = prueba.length;
                }
            }
            console.log(indiceSaltoDeLinea);
            let pruebaParam = prueba.slice(indiceParam, indiceSaltoDeLinea);
            let sustituyendoParams = prueba.slice(indiceParam, indiceSaltoDeLinea);
            
  
            pruebaParam = pruebaParam.replace(arregloMacros[k].nombre, '');
            pruebaParam.trim();
            let macroPrueba = new Macros();
            macroPrueba = arregloMacros[k];
            
            
            //Se asignan los parámetros llamados que se sustituirán en los parámetros de la macro
            for(let o = 0; o < arregloMacros[k].listaParametros.length; o++){
                
                
                let coma = pruebaParam.indexOf(',');
                let aux = pruebaParam.slice(0, coma + 1);
                aux = aux.replace(",", '');
                aux = aux.trim();
            
                macroPrueba.listaParametros[o].nombreSustituido = aux;
                
                pruebaParam = pruebaParam.slice(coma + 1);
                macroPrueba.instrucciones = macroPrueba.instrucciones.replaceAll(macroPrueba.listaParametros[o].nombre, macroPrueba.listaParametros[o].nombreSustituido);
                //prueba = prueba.replace(sustituyendoParams, macroPrueba.instrucciones);
                //console.log(prueba);
  
    
            }
            prueba = prueba.replace(sustituyendoParams, macroPrueba.instrucciones);
            //console.log(prueba);
           
  
            //Sustituir en la cadena principal la macro con parámetros actual
            /*for(let c = 0; c < arregloMacros[k].listaParametros.length; c++){
                //Para cada uno 
            }*/
            
           
        }
        
        
       
  
    }
    //console.log(prueba);
    /*let pruebaListaParam = new Parametros();
        pruebaListaParam = arregloMacros[0].listaParametros;
        for(w = 0; w < arregloMacros[0].listaParametros.length; w++){
             console.log(arregloMacros[w].listaParametros);
        }
       */
   return prueba; 
}