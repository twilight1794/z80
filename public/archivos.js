"use strict"

class Archivo {
    nodo;

    mostrar(){}
    guardar(){}
    descargar(){}
    quitar(){}
    renombrar(){}
    obtNombre(){
        return this.nodo.children[1].textContent;
    }

    /**
     * Crea una instancia de Archivo.
     * @param {*} n Nombre del archivo a crear.
     * @param {*} c Contenido del archivo a crear.
     * @param {*} r Bandera de recuperación. Si evalúa a verdadero, quiere decir que el archivo ya existe en LocalStorage, y solo se lleva a cabo la actualización en la interfaz
     * @memberof Archivo
     */
    constructor(n, c, r){
        let li = document.createElement("li");
        let chk = document.createElement("input");
        chk.type = "checkbox";
        let btn = document.createElement("button");
        btn.textContent = n;
        if (!r){
            let la = localStorage.getItem("archivos");
            if (la) localStorage.setItem("archivos", la + "/" + n);
            else localStorage.setItem("archivos", n);
            localStorage.setItem("archivo_"+n, c || "");
        }
        btn.addEventListener("click", (e) => {
            // Avanzar con esto mañana
            if ("aria-selected" in e.target.getAttributeNames()){
                Array.from(e.target.parentNode.children).forEach((e2) => {
                    if (e2.getAttribute("aria-selected") == "true"){
                        sessionStorage.setItem("archivo_"+e2.textContent, cm.getValue());
                        e2.removeAttribute("aria-selected");
                    }
                });
                e.target.setAttribute("aria-selected", "true");
                let tmp = sessionStorage.getItem("archivo_"+e.target.textContent);
                if (tmp) cmi.setValue(tmp);
                else cmi.setValue(localStorage.getItem("archivo_"+e.target.textContent));
            }
        });
        li.append(chk, btn);
        this.nodo = li;
        document.getElementById("archivos").appendChild(li);
    }
}

class Proyecto {
    archivos = [];

    anadirArchivo(n, c, o){
        let a = new Archivo(n, c, o);
        this.archivos.push(a);
    }
    duplicarArchivo(n){}
    salvar(){}
    constructor(d){
        if (d && d instanceof XMLDocument){
            // Para generar desde archivo XML, genera todo
        } else {
            let l = localStorage.getItem("archivos");
            if (l){
                for (let i of l.split("/")){
                    this.anadirArchivo(i, null, true);
                }
            } else {
                this.anadirArchivo("programa"+localStorage.getItem("txtExtAsm"));
                this.archivos[0].nodo.click();
            }
        }
    }
}