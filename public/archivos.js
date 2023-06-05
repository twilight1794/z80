"use strict"

function cargarArchivoEditor(e) {
    if (!("aria-selected" in e.target.parentNode.getAttributeNames())){
        cambioCMI = true;
        Array.from(e.target.parentNode.parentNode.children).forEach((e2) => {
            if (e2.getAttribute("aria-selected") == "true"){
                sessionStorage.setItem("archivo_"+e2.textContent, cmi.getValue());
                e2.removeAttribute("aria-selected");
            }
        });
        e.target.parentNode.setAttribute("aria-selected", "true");
        let tmp = sessionStorage.getItem("archivo_"+e.target.textContent);
        if (tmp) cmi.setValue(tmp);
        else cmi.setValue(localStorage.getItem("archivo_"+e.target.textContent));
        cambioCMI = false;
        if (document.getElementById("chkIntTitulo").checked){
            document.title = e.target.textContent + " | Emulador Z80";
        }
    }
}

function manejarCasillasToolbar() {
    let cas = Array.from(document.querySelectorAll("#archivos [type=checkbox]"));
    let btn = Array.from(document.querySelectorAll("#menuArchivoAcciones button"));
    let c = 0;
    for (let e of cas){ if (e.checked) c++; }
    if (c>0){
        btn[1].disabled = (c>1);
        btn[2].disabled = false;
        btn[3].disabled = (c>1);
        btn[4].disabled = (c>1);
        btn[5].disabled = (cas.length == 1);
        btn[6].disabled = (c>1);
    } else btn.forEach((e) => { if (e.id != "btnAccionesNuevo") e.disabled = true; });
}

class Proyecto {
    /**
     * Añade un archivo existente a la interfaz
     *
     * @param {String} n Nombre del archivo a añadir.
     * @memberof Proyecto
     */
    anadirArchivo(n){
        let li = document.createElement("li");
        let chk = document.createElement("input");
        let arcs = document.getElementById("archivos");
        chk.type = "checkbox";
        chk.addEventListener("change", manejarCasillasToolbar);
        let btn = document.createElement("button");
        btn.textContent = n;
        btn.addEventListener("click", cargarArchivoEditor);
        li.append(chk, btn);
        li.id = "archivo_"+n;
        arcs.appendChild(li);
        if (arcs.childElementCount == 1) li.classList.add("entrada");
        sessionStorage.setItem("archivo_"+n, localStorage.getItem("archivo_"+n));
    }

    /**
     * Inicializa el almacenamiento para un nuevo archivo
     *
     * @param {String} n Nombre del archivo a crear.
     * @param {String} c Contenido del archivo a crear.
     * @memberof Proyecto
     */
    nuevoArchivo(n, c){
        let la = localStorage.getItem("archivos");
        if (la) {
            localStorage.setItem("archivos", la + "/" + n);
            if (la.split("/").find((e) => e == n)) throw Error("Archivo existente");
        } else localStorage.setItem("archivos", n);
        localStorage.setItem("archivo_"+n, c);
    }
    crearArchivo(nom){
        this.nuevoArchivo(nom, "");
        this.anadirArchivo(nom);
        document.querySelector("#archivos button").click();
    }
    visualizarArchivo(nom){
        let win = window.open("", nom, "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes");
        win.document.body.innerHTML = "<pre>"+localStorage.getItem("archivo_"+nom)+"</pre>";
    }
    guardarArchivo(nom){
        let ss = sessionStorage.getItem("archivo_"+nom);
        localStorage.setItem("archivo_"+nom, ss);
        document.getElementById("archivo_"+nom).classList.remove("guardar");
        document.title = document.title.replace("★ ", "");
    }
    descargarArchivo(nom){
        // FIX: manejar los dos tipos de archivos ya implementados
        let a = document.createElement("a");
        a.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(localStorage.getItem("archivo_"+nom)));
        a.setAttribute("download", "ddd");
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    duplicarArchivo(nom, nom2){
        this.nuevoArchivo(nom2, localStorage.getItem("archivo_"+nom));
        this.anadirArchivo(nom2);
        document.querySelector("#archivo_"+nom2+" button").click();
     }
    borrarArchivo(nom){
        let nodo = document.querySelector("#archivo_"+nom);
        nodo.parentNode.removeChild(nodo);
        sessionStorage.removeItem("archivo_"+nom);
        localStorage.removeItem("archivo_"+nom);
        localStorage.setItem("archivos", localStorage.getItem("archivos").split("/").filter((e) => e != nom).join("/"));
        if (document.getElementById("archivos").childElementCount == 0) this.crearArchivo("programa");
        manejarCasillasToolbar();
    }
    renombrarArchivo(nom, nom2){
        this.nuevoArchivo(nom2, localStorage.getItem("archivo_"+nom));
        this.anadirArchivo(nom2);
        this.borrarArchivo(nom);
     }

    salvar(){}
    constructor(d){
        if (d && d instanceof XMLDocument){
            // Para generar desde archivo XML, genera todo
        } else {
            let l = localStorage.getItem("archivos");
            if (l){
                for (let i of l.split("/")){ this.anadirArchivo(i); }
                document.querySelector("#archivos button").click();
            } else this.crearArchivo("programa");
        }
    }
}