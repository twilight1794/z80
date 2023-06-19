"use strict"

function cargarArchivoEditor(e) {
    if (!("aria-selected" in e.parentNode.getAttributeNames())){
        cambioCMI = true;
        Array.from(e.parentNode.parentNode.children).forEach((e2) => {
            if (e2.getAttribute("aria-selected") == "true"){
                sessionStorage.setItem("archivo_"+e2.textContent, cmi.getValue());
                e2.removeAttribute("aria-selected");
            }
        });
        e.parentNode.setAttribute("aria-selected", "true");
        let tmp = sessionStorage.getItem("archivo_"+e.textContent);
        if (tmp) cmi.setValue(tmp);
        else cmi.setValue(localStorage.getItem("archivo_"+e.textContent));
        cambioCMI = false;
        if (document.getElementById("chkIntTitulo").checked){
            document.title = e.textContent + " | Emulador Z80";
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
        btn[5].disabled = !cas.length;
        btn[6].disabled = (c>1);
        btn[7].disabled = (c>1);
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
        btn.addEventListener("click", e => cargarArchivoEditor(e.target));
        li.append(chk, btn);
        li.id = "archivo_"+n;
        arcs.appendChild(li);
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
            if (la.split("/").find((e) => e == n)) noti.error(_("err_archivo_existente"));
        } else localStorage.setItem("archivos", n);
        localStorage.setItem("archivo_"+n, c);
    }
    crearArchivo(nom){
        this.nuevoArchivo(nom, "");
        this.anadirArchivo(nom);
        if (document.getElementById("archivos").childElementCount == 1) this.entralizarArchivo(nom);
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
        let e = localStorage.getItem("entrada");
        if (e == nom) localStorage.removeItem("entrada");
        nodo.parentNode.removeChild(nodo);
        sessionStorage.removeItem("archivo_"+nom);
        localStorage.removeItem("archivo_"+nom);
        localStorage.setItem("archivos", localStorage.getItem("archivos").split("/").filter((e) => e != nom).join("/"));
        if (document.getElementById("archivos").childElementCount == 0) this.crearArchivo("programa");
        else {
            cargarArchivoEditor(document.querySelector("#archivos li:last-child button"));
        }
        manejarCasillasToolbar();
        if (!localStorage.getItem("entrada")) this.entralizarArchivo(localStorage.getItem("archivos").split("/")[0]);
    }
    entralizarArchivo(nom){
        let vie = document.querySelector("#archivos .entrada");
        if (vie) vie.classList.remove("entrada");
        let nodo = document.getElementById("archivo_"+nom);
        if (nodo) nodo.classList.add("entrada");
        localStorage.setItem("entrada", nom);
    }
    renombrarArchivo(nom, nom2){
        let e = localStorage.getItem("entrada");
        if (e == nom) localStorage.setItem("entrada", nom2);
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
            let e = localStorage.getItem("entrada");
            if (l){
                for (let i of l.split("/")) this.anadirArchivo(i);
                this.entralizarArchivo(e);
            } else this.crearArchivo("programa");
            document.querySelector("#archivos .entrada button").click();
        }
    }
}