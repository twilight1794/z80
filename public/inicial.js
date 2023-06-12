"use strict"

/* Enums */

/**
 *
 * Designa el formato de descarga de un archivo
 * @class TipoDescarga
 */
class TipoDescarga {
    static Asm = new TipoDescarga("asm");
    static Hex = new TipoDescarga("hex");
}

/* Arrays y diccionarios de datos */

/* Lista de acciones asociadas a una configuración */
window.funsConfig = {
    selTemaTema: (v) => {
        if (v == "Sistema") document.body.classList.remove("tema-c", "tema-o");
        else if (v == "Claro"){
            document.body.classList.remove("tema-o");
            document.body.classList.add("tema-c");
        } else if (v == "Oscuro"){
            document.body.classList.remove("tema-c");
            document.body.classList.add("tema-o");
        }
    },
    colorClaroCM: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-c-m", v); },
    colorClaroFM: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-f-m", v); },
    colorClaroBM: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-b-m", v); },
    colorClaroCA: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-c-a", v); },
    colorClaroFA: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-f-a", v); },
    colorClaroHA: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-h-a", v); },
    colorClaroCT: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-c-t", v); },
    colorClaroFT: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-f-t", v); },
    colorClaroActT: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-act-t", v); },
    colorClaroBW: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-b-w", v); },
    colorClaroCBr: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-c-br", v); },
    colorClaroCActBr: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-cact-br", v); },
    colorClaroCdBr: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-cd-br", v); },
    colorClaroFBr: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-f-br", v); },
    colorClaroFActBr: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-fact-br", v); },
    colorClaroFdBr: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-fd-br", v); },
    colorClaroCBbh: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-c-bbh", v); },
    colorClaroCActBbh: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-cact-bbh", v); },
    colorClaroCdBbh: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-cd-bbh", v); },
    colorClaroFBbh: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-f-bbh", v); },
    colorClaroFActBbh: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-fact-bbh", v); },
    colorClaroFdBbh: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-fd-bbh", v); },
    colorClaroSBand: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-s-band", v); },
    colorClaroIArc: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-i-arc", v); },
    colorClaroCInfo: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-c-info", v); },
    colorClaroFInfo: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-f-info", v); },
    colorClaroCAviso: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-c-aviso", v); },
    colorClaroFAviso: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-f-aviso", v); },
    colorClaroCError: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-c-error", v); },
    colorClaroFError: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-f-error", v); },
    colorOscuroCM: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-c-m", v); },
    colorOscuroFM: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-f-m", v); },
    colorOscuroBM: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-b-m", v); },
    colorOscuroCA: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-c-a", v); },
    colorOscuroFA: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-f-a", v); },
    colorOscuroHA: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-h-a", v); },
    colorOscuroCT: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-c-t", v); },
    colorOscuroFT: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-f-t", v); },
    colorOscuroActT: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-act-t", v); },
    colorOscuroBW: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-b-w", v); },
    colorOscuroCB: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-c-b", v); },
    colorOscuroCdB: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-cd-b", v); },
    colorOscuroFB: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-f-b", v); },
    colorOscuroFdB: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-fd-b", v); },
    colorOscuroSBand: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-s-band", v); },
    colorOscuroIArc: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-i-arc", v); },
    colorOscuroCInfo: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-c-info", v); },
    colorOscuroFInfo: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-f-info", v); },
    colorOscuroCAviso: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-c-aviso", v); },
    colorOscuroFAviso: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-f-aviso", v); },
    colorOscuroCError: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-c-error", v); },
    colorOscuroFError: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-f-error", v); },
    txtEdAutoGuardadoTiempo: (v) => {
        let val = parseInt(v);
        clearInterval(window.autog);
        if (val > 0) window.autog = setInterval(() => { console.log("Intervalo!"); }, val*1000);
    },
    txtEdTipo: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--txtEdTipo", v); },
    txtEdTipoTam: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--txtEdTipoTam", v); },
    txtEdTab: (v) => { cmi.setOption("tabSize", v); },
    txtEdSalto: (v) => { cmi.setOption("lineSeparator", ((v == "crlf")?"\r":"")+"\n"); },
    selPlatMem: () => {
        iniMem();
        document.getElementById("outMemTam").textContent = document.getElementById("selPlatMem").selectedOptions[0].textContent.split(" ").slice(0, -1).join(" ");
    },
    txtIntTipo: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--txtIntTipo", v); },
    selIntIdioma: (v) => {
        if (v == "qaa") v = navigator.language.match(/[a-z]+/)[0]; // qaa -> Código para 'Sistema'
        if (idisp.indexOf(v) == -1) v == "en";
        window.msgs = window["loc-"+v];
        if (msgs){
            let nodos = document.querySelectorAll("html :not([translate=no]) *:not([translate=no])");
            let nodo, idcad;
            for (let i = 0; i < nodos.length; i++){
                nodo = nodos[i].childNodes[0];
                if (nodos[i].hasChildNodes() && nodo.nodeType == 3){
                    idcad = nodo.nodeValue.match(/\$([A-Za-z0-9\._]+)/)?.[1];
                    if (idcad) nodo.textContent = msgs[idcad];
                }
            }
        }
    },
    chkIntTitulo: (v) => { if (!v) document.title = msgs["nombre_app"]; }
}

/* Lista de funciones asociadas a una combinación de teclas */
// TODO: ¿volver esto una opción configurable?
window.combTeclas = {
    "M-f n": btnAccionesNuevo,
    "M-f a": btnAbrirAsm,
    "M-f b": btnAbrirHex,
    "M-f c": btnAbrirProj,
    "M-f g": btnAccionesVisualizar,
    "M-f h": btnAccionesGuardar,
    "M-f i": btnAccionesDuplicar,
    "M-f j": btnAccionesBorrar,
    "M-f k": btnAccionesRenombrar,
    "M-f l": btnAccionesEntralizar,
    "M-f d": null,
    "M-f e": null,
    "M-f f": null,
    "M-f x": btnCerrarProj,
    "M-f y": null,
/*    "C-x": null,
    "C-c": null,
    "C-v": null,*/
    "C-b": btnBuscar,
    "M-e c": btnEnsamblar,
    "M-e e": null,
    "M-e a": null,
    "M-e d": null,
    "M-e r": null,
    "M-a a": btnManual,
    "M-a p": null,
    "M-a r": null,
    "M-a m": null,
    "M-a s": btnAcercaDe,
}

function valorSignado(hex){
    var n = parseInt(hex, 16);
    var b = 2**(hex.length*4);
    return (n >= b/2)?("-"+(b-n).toString()):n.toString();
}

/* Localización */

/**
 * Devuelve una cadena ya localizada
 * _ es por familiaridad con gettext
 *
 * @param {String} id Identificador de la cadena a localizar
 * @param {Object} params Lista de parámetros a substituir dentro de la cadena localizada
 * @return {String} Cadena localizada y procesada
 */
function _(id, params){
    let m = window.msgs?.[id];
    let p = Object.entries(params || {});
    for (let i = 0; i<p.length; i++) m = m.replaceAll("%"+p[i][0], p[i][1]);
    return m;
}

/* Funciones de eventos */

/* Funciones de Barra de menú */
function btnAbrirAsm(){
    document.getElementById("archivoAsm").click();
}
function btnAbrirHex(){
    document.getElementById("archivoHex").click();
}
function btnAbrirProj(){
    document.getElementById("archivoProj").click();
}
function btnCerrarProj(){
    let guardar = Array.from(document.querySelectorAll("#archivos .guardar"));
    if (guardar.length > 0) mostrarDialogo("dlgCerrarNoGuardadoConfirmacion", { "nom": nom }, (o) => {
        switch (o["@"]){
            case "s":
                guardar.forEach((e) => proy.guardarArchivo(e.children[1].textContent));
            case "n":
                guardar.forEach((e) => proy.borrarArchivo(e.children[1].textContent));
        }
    });
    else mostrarDialogo("dlgCerrarConfirmacion", { "nom": nom }, (o) => {
        if (o["@"] == "s") guardar.forEach((e) => proy.borrarArchivo());
    });
    // QUESTION: ¿basta con comprobar los archivos?
    // FIX: comprobar que no haya nada en ejecución
}
function btnBuscar(){
    document.getElementById("btnMenuBuscar").children[0].click();
}
function btnInsX(e){
    if (cmi.getSelection().length > 0) cmi.replaceSelection(e.textContent);
    else {
        var cursor = cmi.getCursor();
        cmi.replaceRange(e.textContent, cursor);
    }
}
function btnEnsamblar(){
    // Limpiar antes de cualquier otra cosa
    btnRestablecer();

    let a = document.querySelector("#archivos .entrada") || document.querySelector("#archivo [aria-selected=true]");
    window.prog = new ProgramaAsm(a.textContent);
    plat.escribirLog(TipoLog.INFO, _("msg_ensamblado_finalizado"));
}
function btnEjecutar(){
    document.getElementById("btnMenuEjecutar").children[0].click();
    try {
        plat.ejecutar(true);
        plat.escribirLog(TipoLog.INFO, _("msg_ejecucion_finalizada"));
    } catch {}
}
function btnAvanzar(){
    document.getElementById("btnMenuEjecutar").children[0].click();
    plat.ejecutar(false);
}
function btnDetener(){
    plat.estPC(0);  // FIX: Implementa estPC
                    // FIX: Implementar prog.inicio, para indicar en dónde debe empezar a ejecutarse esto
}
function btnRestablecer(){}
function btnManual(){
    document.getElementById("btnMenuManual").children[0].click();
}
function btnAcercaDe(){
    mostrarDialogo("dlgAcercaDe", {
        "version": document.querySelector("meta[name=versionNumero]").getAttribute("content"),
        "fecha": document.querySelector("meta[name=versionFecha]").getAttribute("content"),
        "commit": document.querySelector("meta[name=versionCommit]").getAttribute("content"),
        "sistema": window?.NL_OS || "Web",
        "neu": window?.NL_VERSION || "N/A",
        "ua": navigator.userAgent,
    });
}

/* Funciones de Barra de herramientas de Navegación */
function btnAccionesNuevo(){
    mostrarDialogo("dlgNuevoArchivo", null, (o) => {
        if (o["@"] == "k" && o.txtDlgNuevoArchivoNombre)
            proy.crearArchivo(o.txtDlgNuevoArchivoNombre);
    });
}
function btnAccionesVisualizar(){
    let nom = document.querySelector("#archivos :checked");
    proy.visualizarArchivo(nom);
}
function btnAccionesGuardar(){
    Array.from(document.querySelectorAll("#archivos :checked")).forEach((e) => {
        proy.guardarArchivo(e.nextElementSibling.textContent);
    });
}
function btnAccionesDescargar(){
    let nom = document.querySelector("#archivos :checked");
    mostrarDialogo("dlgDescargar", {"ext": localStorage.getItem("txtExtAsm")}, null, [
        ["btnDlgDescargarAsm", "click", () => proy.descargarArchivo(nom, TipoDescarga.Asm)],
        ["btnDlgDescargarHex", "click", () => proy.descargarArchivo(nom, TipoDescarga.Hex)]
    ]);
}
function btnAccionesDuplicar(){
    let nom = document.querySelector("#archivos :checked");
    mostrarDialogo("dlgNuevoArchivo", null, (o) => {
        if (o["@"] == "k" && o.txtDlgNuevoArchivoNombre)
            proy.duplicarArchivo(nom.nextElementSibling.textContent, o.txtDlgNuevoArchivoNombre);
    });
}
function btnAccionesBorrar(){
    let noms = Array.from(document.querySelectorAll("#archivos :checked"));
    let nog = noms.some((e) => { return e.parentNode.classList.contains("guardar"); });
    if (nog) mostrarDialogo("dlgBorrarConfirmacion", null, (o) => {
        if (o["@"] == "s") noms.forEach((e) => proy.borrarArchivo(e.nextElementSibling.textContent));
    });
    else noms.forEach((e) => proy.borrarArchivo(e.nextElementSibling.textContent));
}
function btnAccionesRenombrar(){
    let nom = document.querySelector("#archivos :checked");
    mostrarDialogo("dlgNuevoArchivo", null, (o) => {
        if (o["@"] == "k" && o.txtDlgNuevoArchivoNombre)
            proy.renombrarArchivo(nom.nextElementSibling.textContent, o.txtDlgNuevoArchivoNombre);
    });
}
function btnAccionesEntralizar(){
    let vie = document.querySelector("#archivos .entrada");
    if (vie) vie.classList.remove("entrada");
    let nom = document.querySelector("#archivos :checked");
    nom.classList.add("entrada");
}

/* Funciones de Buscar y reemplazar */
/**
 * Genera una expresión regular de acuerdo a las opciones especificadas por el usuario
 *
 * @param {String} patron Entrada del usuario a buscar dentro del editor
 * @param {String} acc Id del botón pulsado
 */
function genRegex(patron, acc){
    let pat = document.getElementById("txtByrReemplazar").value;
    let modo = document.querySelectorAll("[name=modoBusq]:checked").value;
    let cap = document.getElementById("chkByrOpcCase").checked;
    /* Patrón */
    switch (modo){
        case "normal":
            break;
        case "escape":
            break;
        case "regex":
            
            break;
    }
    /* Banderas */
    let band = (acc=="btnByrReemplazarTodo")?"g":"";
    if (cap) band += "i";
}
function outByr(e){ e.target.textContent = ""; }
function btnByrBuscar(){
    let ent = document.getElementById("txtBuscar").value;
    let regex = genRegex(ent, "btnByrBuscar");
    //[...temp0.textContent.matchAll(new RegExp(temp1.textContent, 'gi'))]
}
function btnByrReemplazar(){

}
function btnByrReemplazarTodo(){

}

/* Eventos de edición manual */
function iniValidarEdicion(c) {
    c.target.contentEditable = true;
    c.target.dataset.ultimoValor = c.target.textContent;
}
function pilaValidarEdicion(c){
    rValidarEdicion(c, 16);
    // Actualización en memoria
    let dir = parseInt(c.target.previousElementSibling.textContent, 16);
    plat.escribirPalabra(dir, parseInt(c.target.textContent, 16));
}

function memoriaValidarEdicion(c) {
    c.target.contentEditable = false;
    if (!c.target.textContent.length) c.target.textContent = c.target.dataset.ultimoValor;
    if (!c.target.classList.contains("ascii")) {
        c.target.textContent = c.target.textContent.padStart(2, "0");
    }
    // Actualización en la pila
    let fCel = Array.from(c.target.parentNode.children);
    let fFil = Array.from(c.target.parentNode.parentNode.children);
    let celP = document.querySelector("#r-pila tbody tr:last-child td:nth-child(2)");
    if (celP){
        let dirP = parseInt(celP.textContent, 16);
        let d = fCel.indexOf(c.target);
        let s = fFil.indexOf(c.target.parentNode);
        if (s*16+d >= dirP){
            let dirReal = s*16+((d%2==0)?d:d-1);
            let em = Array.from(document.querySelectorAll("#r-pila tbody td:nth-child(2)")).find((e) => dirReal == parseInt(e.textContent, 16) );
            em.nextElementSibling.textContent = plat.leerPalabra(dirReal).toString(16).padStart(4, "0").toUpperCase();
        }
    }
}
function memoriaInputEdicion(c) {
    let f = Array.from(c.target.parentNode.children);
    let e = c.target;
    let otro, val;
    if (e.classList.contains("ascii")) {
        otro = f[f.indexOf(e) - 16];
        val = e.textContent.charCodeAt(0);
        // val = 160 -> En el navegador, introducir un espacio es introducir un nbsp
        val = (val == 160) ? 32 : val;
        if (e.textContent.length > 1 || (e.textContent.length == 1 && !(val > 31 && val < 127)))
            e.textContent = e.dataset.ultimoValor;
        else if (e.textContent.length) {
            e.dataset.ultimoValor = e.textContent;
            otro.textContent = val.toString(16).padStart(2, "0").toUpperCase();
        }
    } else {
        otro = f[f.indexOf(c.target) + 16];
        e.textContent = e.textContent.toUpperCase();
        if (e.textContent.length > 2 || (!(/^[0-9A-F]?[0-9A-F]?$/).test(e.textContent)))
            e.textContent = e.dataset.ultimoValor.toUpperCase();
        else if (e.textContent.length) {
            e.dataset.ultimoValor = e.textContent;
            otro.textContent = ASCIIaCar(parseInt(e.textContent, 16));
        }
    }
    if (e.textContent.length) {
        let range = document.createRange();
        let sel = window.getSelection();
        range.setStart(e.childNodes[0], e.textContent.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
}
function rValidarEdicion(c, t) {
    let e = c.target;
    e.contentEditable = false;
    e.textContent = e.textContent.padStart(t / 4, "0");
}
function rInputEdicion(c, t) {
    let r = (t == 8) ? (/^[0-9A-F]?[0-9A-F]?$/) : (/^[0-9A-F]?[0-9A-F]?[0-9A-F]?[0-9A-F]?$/);
    let e = c.target;
    e.textContent = e.textContent.toUpperCase();
    if (e.textContent.length > t / 4 || (!r.test(e.textContent)))
        e.textContent = e.dataset.ultimoValor;
    else e.dataset.ultimoValor = e.textContent;
    if (e.textContent.length) {
        let range = document.createRange();
        let sel = window.getSelection();
        range.setStart(e.childNodes[0], e.textContent.length);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

/* Eventos de CodeMirror */
function onChangeCMI(cm){
    let t = cm.getValue().length;
    let u = (t >= 1000)?(t.toFixed(1) + " KB"):(t + " byte" + (t!=1?"s":""));
    document.getElementById("outArcTam").textContent = u;
    let e = document.querySelector("#archivos [aria-selected]");
    if (e && !cambioCMI){
        e.classList.add("guardar");
        sessionStorage.setItem("archivo_"+e.children[1].textContent, cm.getValue());
        if (document.getElementById("chkIntTitulo").checked && document.title.indexOf("★") == -1){
            document.title = "★ " + document.title;
        }
    }
}
function onInputCMI(cm){
    let c = cm.getCursor();
    document.getElementById("outArcLin").textContent = _("out_arclin_aria_label") + " " + (c.line + 1);
    document.getElementById("outArcCol").textContent = _("out_arccol_aria_label") + " " + (c.ch + 1);
}

/* Configuración */
/**
 * Establece y aplica un valor en la configuración.
 *
 * @param {String} p Propiedad a establecer.
 * @param {String} v Valor a establecer. Si es nulo, se establecen los valores guardados, y si no hay, se establecen los predeterminados
 */
function estConfig(p, v){
    let val = v;
    let cfg = document.getElementById(p);
    try {
        if (val != undefined) localStorage.setItem(p, v.toString());
        else {
            val = localStorage.getItem(p);
            if (!val){
                if (cfg.tagName == "INPUT" && cfg.type == "checkbox") val = cfg.checked.toString();
                else val = cfg.value;
                localStorage.setItem(p, val);
            }
        }
        if (cfg.tagName == "INPUT" && cfg.type == "checkbox") cfg.checked = val;
        else cfg.value = val;
        let f = funsConfig[p];
        if (f) f(val);
    } catch { throw new Error("Ha ocurrido un error al almacenar la configuración \""+p+"\"."); }
}

function estConfigIni(d){
    for (let e of document.querySelectorAll("#r-cfg :is(select, input)")){
        if (e.tagName == "INPUT" && e.type == "checkbox")
            estConfig(e.id, d?e.checked:null);
        else estConfig(e.id, d?e.value:null);
        e.addEventListener("change", (e2) => {
            if (e2.target.tagName == "INPUT" && e2.target.type == "checkbox")
                estConfig(e2.target.id, e2.target.checked);
            else estConfig(e2.target.id, e2.target.value);
        });
    }
}

/* Inicialización de memoria */
function iniMem(){
    let t = parseInt(localStorage.getItem("selPlatMem"));
    let mem = document.querySelector("#r-mem table");
    mem.children[1].textContent = "";
    for (let i=0; i<(t/16); i++){
        let nFila = mem.children[1].insertRow();
        var tof = document.createElement("th");
        tof.textContent = (i*16).toString(16).toUpperCase().padStart(4, "0");
        nFila.appendChild(tof);
        for (let j=0; j<16; j++) nFila.insertCell().textContent = "00";
        for (let j=0; j<16; j++) {
            let c = nFila.insertCell();
            c.textContent = "␀";
            c.classList.add("ascii");
        }
    }
}

/* Eventos de botones de Barra de actividades */
function btnMenuActividades(e){
    let act = e.target.parentNode.getAttribute("aria-selected") == "true";
    Array.from(e.target.parentNode.parentNode.children).forEach((ee) => {
        if (ee.getAttribute("aria-selected") == "true") ee.removeAttribute("aria-selected");
    });
    Array.from(e.target.parentNode.parentNode.parentNode.getElementsByTagName("section")).forEach((ee) => {
        ee.removeAttribute("aria-current");
    });
    if (act){
        e.target.parentNode.removeAttribute("aria-selected");
        document.getElementById(e.target.parentNode.getAttribute("aria-controls")).removeAttribute("aria-current");
    } else {
        e.target.parentNode.setAttribute("aria-selected", "true");
        document.getElementById(e.target.parentNode.getAttribute("aria-controls")).setAttribute("aria-current", "page");
    }
}

/**
 * Muestra y maneja un cuadro de diálogo
 *
 * @param {String} id ID del cuadro de diálogo a mostrar
 * @param {Object} params Diccionario de valores a substituir
 * @param {Function} fun Función a llamar con el valor retornado por el diálogo
 * @param {Array} evs Array con eventos a asignar, con la forma [id, evento, función]
 */
function mostrarDialogo(id, params, fun, evs){
    let dlgO = document.getElementById(id);
    if (!dlgO) throw Error("AL");
    let btn = dlgO.dataset?.botones;
    if (!btn) throw Error("AL");
    let dlg = document.createElement("dialog");
    let html = dlgO.innerHTML;
    if (params)
        for (let r of Object.entries(params))
            html = html.replaceAll("%"+r[0], r[1]);
    dlg.innerHTML = html;
    let pie = document.createElement("footer");
    for (let c of btn){
        let btn = document.createElement("button");
        switch (c){
            case "a":
                btn.textContent = _("btn_gen_a");
                btn.value = "a";
                break;
            case "c":
                btn.textContent = _("btn_gen_c");
                btn.value = "c";
                break;
            case "k":
                btn.textContent = _("btn_gen_k");
                btn.value = "k";
                break;
            case "n":
                btn.textContent = _("btn_gen_n");
                btn.value = "n";
                break;
            case "s":
                btn.textContent = _("btn_gen_s");
                btn.value = "s";
                break;
            default:
                throw new Error("Debes especificar un patrón de botones válido");
        }
        pie.appendChild(btn);
    }
    if (evs)
        for (let r of evs)
            document.getElementById(r[0]).addEventListener(r[1], r[2]);
    dlg.children[0].appendChild(pie);
    if (fun) dlg.addEventListener("close", () => {
        let ret = { "@": dlg.returnValue };
        Array.from(dlg.querySelectorAll(":is(select, input)[id]")).forEach((e) => {
            ret[e.id] = (e.tagName == "INPUT" && e.type == "checkbox")?e.checked:e.value;
        });
        fun(ret);
    });
    document.body.appendChild(dlg);
    dlg.showModal();
}

window.addEventListener("DOMContentLoaded", () => {
    /* Localización */
    window.idisp = Array.from(document.querySelectorAll("#selIntIdioma option")).map((e) => e.value).filter((e) => e != "qaa");
    // Cargar cadenas
    // TODO: hacer que se carguen sólo cuando se necesiten, en vez de todos a la vez
    idisp.forEach((i) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "cadenas/"+i+".xml", false);
        //xhr.responseType = "document";
        xhr.overrideMimeType("text/xml");
        xhr.onload = () => {
            if (xhr.readyState === xhr.DONE && xhr.status === 200){
                window["loc-"+i] = {};
                Array.from(xhr.responseXML.getElementsByTagName("string")).forEach((e) => {
                    window["loc-"+i][e.getAttribute("name")] = e.textContent;
                });
                funsConfig.selIntIdioma(document.getElementById("selIntIdioma").value);
            }
        };
        xhr.send();
    });

    /* Estado */
    document.getElementById("outEstado").textContent = "Listo";

    /* CodeMirror */
    window.cmi = CodeMirror(document.querySelector("#codemirror"), {
        lineNumbers: true,
        gutters: ["CodeMirror-linenumbers", "breakpoints"],
    });
    cmi.setSize("100%", "100%");
    cmi.on("gutterClick", (cm, n) => {
        var info = cm.lineInfo(n);
        cm.setGutterMarker(n, "breakpoints", info.gutterMarkers ? null : (() => {
            var marker = document.createElement("u");
            marker.classList.add("bp");
            marker.textContent = "●";
            return marker;
        })());
    });
    cmi.on("change", onChangeCMI);
    cmi.on("cursorActivity", onInputCMI);
    onChangeCMI(cmi);
    onInputCMI(cmi);
    // Al cambiar el contenido del editor al cambiar de archivo, el sistema piensa que se ha editado el archivo. Esta bandera evita ese comportamiento.
    window.cambioCMI = false;

    /* Configuración */
    estConfigIni();
    document.getElementById("btnRestConfig").addEventListener("click", (e) => {
        e.target.form.reset();
        estConfigIni(true);
    });

    /* Creación de proyecto y plataforma de inicio */
    window.proy = new Proyecto();
    window.plat = new Plataforma();

    /* Asignación de eventos de Archivo */
    document.getElementById("archivoAsm").addEventListener("change", (e) => {
        for (let a of e.target.files){
            var reader = new FileReader();
            reader.readAsText(a, "UTF-8");
            reader.onload = function (e2){
                proy.anadirArchivo(a.name.split(".").slice(0, -1).join("."), e2.target.result);
            }
            reader.onerror = function (){ console.error("Error leyendo archivo"); }
        }
    });

    /* Asignación de eventos Barra de menú  */
    document.getElementById("btnAbrirAsm").addEventListener("click", btnAbrirAsm);
    document.getElementById("btnAbrirHex").addEventListener("click", btnAbrirHex);
    document.getElementById("btnAbrirProj").addEventListener("click", btnAbrirProj);
    document.getElementById("btnCerrarProj").addEventListener("click", btnCerrarProj);
    document.getElementById("btnBuscar").addEventListener("click", btnBuscar);
    document.getElementById("btnEnsamblar").addEventListener("click", btnEnsamblar);
    Array.from(document.querySelectorAll(":is(#f_dir, #f_mnemo) button")).forEach((e) => {
        e.addEventListener("click", (e2) => { btnInsX(e2.target); });
    });
    document.getElementById("btnManual").addEventListener("click", btnManual);
    document.getElementById("btnAcercaDe").addEventListener("click", btnAcercaDe);

    /* Asignación de eventos Actividades */
    Array.from(document.querySelectorAll("#menuActividades button")).forEach((e) => {
        e.addEventListener("click", btnMenuActividades);
        e.addEventListener("mouseover", (e2) => {
            e2.target.parentNode.classList.add("hint--right");
            e2.target.parentNode.setAttribute("aria-label", e2.target.textContent.trim());
        });
        e.addEventListener("mouseout", (e2) => {
            e2.target.parentNode.classList.remove("hint--right");
            e2.target.parentNode.removeAttribute("aria-label");
        });
    });

    /* Asignación de eventos a botones de barra de herramientas */
    Array.from(document.querySelectorAll("#menuArchivoAcciones button, #menuMensajesAcciones :is(button, label)")).forEach((e) => {
        e.addEventListener("mouseover", (e2) => {
            e2.target.parentNode.classList.add("hint--bottom-right");
            e2.target.parentNode.setAttribute("aria-label", e2.target.textContent.trim());
        });
        e.addEventListener("mouseout", (e2) => {
            e2.target.parentNode.classList.remove("hint--bottom-right");
            e2.target.parentNode.removeAttribute("aria-label");
        });
        if (e.getAttribute("aria-disabled") == "true") e.disabled = true;
    });

    /* Asignación de eventos Barra de herramientas Explorador */
    document.getElementById("btnAccionesNuevo").addEventListener("click", btnAccionesNuevo);
    document.getElementById("btnAccionesVisualizar").addEventListener("click", btnAccionesVisualizar);
    document.getElementById("btnAccionesGuardar").addEventListener("click", btnAccionesGuardar);
    document.getElementById("btnAccionesDescargar").addEventListener("click", btnAccionesDescargar);
    document.getElementById("btnAccionesDuplicar").addEventListener("click", btnAccionesDuplicar);
    document.getElementById("btnAccionesBorrar").addEventListener("click", btnAccionesBorrar);
    document.getElementById("btnAccionesRenombrar").addEventListener("click", btnAccionesRenombrar);
    document.getElementById("btnAccionesEntralizar").addEventListener("click", btnAccionesEntralizar);

    /* Asignación de eventos de Buscar y reemplazar */
    document.getElementById("outByr").addEventListener("dblclick", outByr);
    document.getElementById("btnByrBuscar").addEventListener("click", btnByrBuscar);
    document.getElementById("btnByrReemplazar").addEventListener("click", btnByrReemplazar);
    document.getElementById("btnByrReemplazarTodo").addEventListener("click", btnByrReemplazarTodo);

    /* Asignación de eventos Barra de herramientas Mensajes */
    document.getElementById("btnAccionesLimpiarMsgs").addEventListener("click", 
    btnAccionesLimpiarMsgs);
    document.getElementById("chkAccionesMostrarInfo").addEventListener("change", chkAccionesMostrarInfo);
    document.getElementById("chkAccionesMostrarAviso").addEventListener("change", chkAccionesMostrarAviso);
    document.getElementById("chkAccionesMostrarError").addEventListener("change", chkAccionesMostrarError);

    /* Asignación de eventos a valores de interfaz */
    /** Eventos de Memoria **/
    Array.from(document.querySelectorAll("#r-mem td")).forEach((e) => {
        e.addEventListener("dblclick", iniValidarEdicion );
        e.addEventListener("change", memoriaValidarEdicion );
        e.addEventListener("blur", memoriaValidarEdicion );
        e.addEventListener("input", memoriaInputEdicion );
    });
    /** Eventos de Pila **/
    /** Eventos de Registros **/
    Array.from(document.querySelectorAll(":is(#r-r, #r-rx, #r-e) td:not(:empty, #v-iff1, #v-iff2)")).forEach((e) => {
        e.addEventListener("dblclick", iniValidarEdicion);
        e.addEventListener("change", (c) => rValidarEdicion(c, 8) );
        e.addEventListener("blur", (c) => rValidarEdicion(c, 8) );
        e.addEventListener("input", (c) => rInputEdicion(c, 8));
    });
    Array.from(document.querySelectorAll("#r-16b td")).forEach((e) => {
        e.addEventListener("dblclick", iniValidarEdicion);
        e.addEventListener("change", (c) => rValidarEdicion(c, 16) );
        e.addEventListener("blur", (c) => rValidarEdicion(c, 16) );
        e.addEventListener("input", (c) => rInputEdicion(c, 16) );
    });
    Array.from(document.querySelectorAll("#r-f th[scope=row], #t-iff1, #t-iff2")).forEach((e) => {
        e.addEventListener("dblclick", (c) => plat.toggleBandera(c.target.nextElementSibling.id.slice(2)) );
     });
    Array.from(document.querySelectorAll("#r-f td, #v-iff1, #v-iff2")).forEach((e) => {
        e.addEventListener("dblclick", (c) => plat.toggleBandera(c.target.id.slice(2)) );
     });

    /* Combinaciones de teclas */
    document.addEventListener("keydown", (e) => {
        let c = "";
        if (e.key.codePointAt() >= 65 && e.key.codePointAt() <= 122){
            if (e.ctrlKey) c += "C-";
            if (e.altKey) c += "M-";
            if (e.shiftKey) c += "s-";
            c += e.key.toLowerCase();
            if (!window.comb) window.comb = c;
            else comb += " " + c;
            for (let i of Object.keys(combTeclas)){
                if (i == comb){
                    e.preventDefault();
                    let f = combTeclas[comb];
                    if (f) f();
                    break;
                } else if (i.startsWith(c)){
                    e.preventDefault();
                    return;
                }
            }
            window.comb = undefined;
        }
        return;
    });
});