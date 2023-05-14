"use strict"

/* Funciones útiles generales */
// Devuelve los bytes a escribir en memoria
// Considera tanto el signo como el endianness
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

/* Eventos del editor */
function onChangeCMI(cm){
    let t = cm.getValue().length;
    let u;
    if (t >= 1000){
        u = t.toFixed(1) + " KB";
    } else {
        u = t + " byte" + (t!=1?"s":"");
    }
    document.querySelector("footer [aria-label=Tamaño] output").textContent = u;
}
function onInputCMI(cm){
    let c = cm.getCursor();
    document.querySelector("footer [aria-label=Línea] output").textContent = "Línea " + (c.line + 1);
    document.querySelector("footer [aria-label=Columna] output").textContent = "Columna " + (c.ch + 1);
}

window.addEventListener("DOMContentLoaded", (e) => {
    /* Ubicaciones globales */
    window.g = {
        log: document.querySelector("#r-msg ul"),
        mem: document.querySelector("#r-mem table"),
    };

    /* Iniciar memoria */
    for (let i=0; i<0x3ff; i++){
        var nFila   = g.mem.children[1].insertRow();
        nFila.insertCell().appendChild(document.createTextNode(i.toString(16).toUpperCase().padStart(4, "0")));
        nFila.insertCell().appendChild(document.createTextNode("00"));
        nFila.insertCell().appendChild(document.createTextNode("␀"));
    }
    /* CodeMirror */
    window.cmi = CodeMirror(document.querySelector('#codemirror'), {
        lineNumbers: true,
        gutters: ["CodeMirror-linenumbers", "breakpoints"],
        tabSize: 2 // TODO: Una opción para ajustar esto
    });
    cmi.setSize("100%", "100%");
    cmi.on("gutterClick", (cm, n) => {
        var info = cm.lineInfo(n);
        cm.setGutterMarker(n, "breakpoints", info.gutterMarkers ? null : makeMarker());
    });
    function makeMarker() {
        var marker = document.createElement("u");
        marker.classList.add("bp");
        marker.textContent = "●";
        return marker;
    }
    cmi.on("change", onChangeCMI);
    cmi.on("cursorActivity", onInputCMI);
    onChangeCMI(cmi);
    onInputCMI(cmi);
});