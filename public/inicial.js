"use strict"

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
        mem: document.querySelector("#r-mem table"),
    };

    /* Iniciar memoria */
    for (let i=0; i<0x3ff; i++){
        var nFila   = g.mem.insertRow();
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