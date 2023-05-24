"use strict"

/* Enums */

/**
 *
 * Designa el formato de descarga de un archivo
 * @class TipoDescarga
 */
class TipoDescarga {
    static Asm = new TipoParam("asm");
    static Hex = new TipoParam("hex");
}

/* Arrays y diccionarios de datos */

/* Lista de acciones asociadas a una configuración */
window.funsConfig = {
    selTemaTema: (v) => {
        if (v == "Sistema") document.body.classList.remove("tema-c", "tema-o");
        else if (v == "Claro") document.body.classList.add("tema-c");
        else if (v == "Oscuro") document.body.classList.add("tema-o");
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
    colorClaroCInfo: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-c-info", v); },
    colorClaroFInfo: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-f-info", v); },
    colorClaroCAviso: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-c-aviso", v); },
    colorClaroFAviso: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-f-aviso", v); },
    colorClaroCError: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-c-error", v); },
    colorClaroFError: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-f-error", v); },
    colorOscuroCM: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-c-m", v); },
    colorOscuroFM: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--o-f-m", v); },
    colorOscuroBM: (v) => { document.styleSheets[1].cssRules[1].style.setProperty("--c-b-m", v); },
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
    selPlatMem: (v) => {
        iniMem();
        document.getElementById("outMemTam").textContent = document.getElementById("selPlatMem").selectedOptions[0].textContent.split(" ").slice(0, -1).join(" ");
    },
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
    "M-f d": null,
    "M-f e": null,
    "M-f f": null,
    "M-f x": btnCerrarProj,
    "M-f y": null,
/*    "C-x": null,
    "C-c": null,
    "C-v": null,*/
    "C-b": btnBuscar,
    "M-e c": null,
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


/* Funciones útiles generales */

/**
 * Dado un valor entero, devuelve los bytes que deben escribirse en memoria
 * Considera el signo y el endianness
 * 
 * @param {number} x Número a procesar
 * @return {Array} Array con los bytes a escribir
 */
function obtLittleEndianNum(x){
    // Signo
    var n, t;
    if (x>-1){
        n = x.toString(16);
        t = n.length+((n.length%2==0)?0:1);
        n = n.padStart(t, 0);
    } else { // Ej para 31
        n = Math.abs(x).toString(2);
        t = Math.ceil(n.length/8)*8;
        n = (parseInt(Array.from(n.padStart(t, 0)).map((d) => { return ((d=="1")?0:1); }).join(""), 2) + 1).toString(16);
    }
    // Endianness
    return n.match(/.{2}/g).reverse().map((n) => { return parseInt(n, 16)} );
}

function valorSignado(hex){
    var n = parseInt(hex, 16);
    var b = 2**(hex.length*4);
    return (n >= b/2)?("-"+(b-n).toString()):n.toString();
}

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
    proy.renombrarArchivo(nom);
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
    }
}
function onInputCMI(cm){
    let c = cm.getCursor();
    document.getElementById("outArcLin").textContent = "Línea " + (c.line + 1);
    document.getElementById("outArcCol").textContent = "Columna " + (c.ch + 1);
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
    } catch { console.error("Ha ocurrido un error al almacenar la configuración \""+p+"\"."); }
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
    g.mem.children[1].textContent = "";
    for (let i=0; i<(t/16); i++){
        let nFila = g.mem.children[1].insertRow();
        var tof = document.createElement("th");
        tof.textContent = (i*16).toString(16).toUpperCase().padStart(4, "0");
        nFila.appendChild(tof);
        for (let j=0; j<16; j++) nFila.insertCell().appendChild(document.createTextNode("00"));
        for (let j=0; j<16; j++) nFila.insertCell().appendChild(document.createTextNode("␀"));
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
                btn.textContent = "Aceptar";
                btn.value = "a";
                break;
            case "c":
                btn.textContent = "Cancelar";
                btn.value = "c";
                break;
            case "k":
                btn.textContent = "Confirmar";
                btn.value = "k";
                break;
            case "n":
                btn.textContent = "No";
                btn.value = "n";
                break;
            case "s":
                btn.textContent = "Sí";
                btn.value = "s";
                break;
            default:
                throw Error("AL");
        }
        pie.appendChild(btn);
    }
    if (evs)
        for (let r of evs)
            dlg.getElementById(r[0]).addEventListener(r[1], r[2]);
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
    /* Ubicaciones globales */
    window.g = {
        log: document.querySelector("#r-msg ul"),
        mem: document.querySelector("#r-mem table"),
    };

    /* Estado */
    document.getElementById("outEstado").textContent = "Listo";

    /* CodeMirror */
    window.cmi = CodeMirror(document.querySelector('#codemirror'), {
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
    // Al cambiar el contenido del editor al cambiar de archivo, el sistema piensa que se ha editado el archivo
    // Esta bandera evita ese comportamiento
    window.cambioCMI = false;

    /* Configuración */
    estConfigIni();
    document.getElementById("btnRestConfig").addEventListener("click", (e) => {
        e.target.form.reset();
        estConfigIni(true);
    });

    /* Creación de proyecto de inicio */
    window.proy = new Proyecto();

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

    /* Asignación de eventos Barra de herramientas Explorador */
    Array.from(document.querySelectorAll("#menuArchivoAcciones button")).forEach((e) => {
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

    document.getElementById("btnAccionesNuevo").addEventListener("click", btnAccionesNuevo);
    document.getElementById("btnAccionesVisualizar").addEventListener("click", btnAccionesVisualizar);
    document.getElementById("btnAccionesGuardar").addEventListener("click", btnAccionesGuardar);
    document.getElementById("btnAccionesDescargar").addEventListener("click", btnAccionesDescargar);
    document.getElementById("btnAccionesDuplicar").addEventListener("click", btnAccionesDuplicar);
    document.getElementById("btnAccionesBorrar").addEventListener("click", btnAccionesBorrar);
    document.getElementById("btnAccionesRenombrar").addEventListener("click", btnAccionesRenombrar);

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

    // Temporal: marco para pruebas
    // Esta estructura es para pruebas, sin embargo, más o menos así será al final
    document.getElementById("btnEnsamblar").addEventListener("click", () => {
        window.p = new ProgramaAsm();
        let i = 0;
        let l = cmi.getLineHandle(i);
        window.lins = [];
        while (l) {
            lins.push(p.analLexSint(l.text));
            i++;
            l = cmi.getLineHandle(i);
        }
        window.cods = [];
        lins.forEach(e => {
            try{cods.push(p.getCodigoOp(e.mnemo, e.ops));} catch (e) {console.log(e);}
        });
        window.lcod = cods.map((a) => {
            return a.map((b) => {return b.toString(16).padStart(2, "0")});
          })
    });
});