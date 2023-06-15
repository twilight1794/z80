#!/usr/bin/env bash
set -o pipefail
IFS=$'\n\t'

if [[ "dependencias" == "$1" || "todo" == "$1" ]]; then
    echo "* Comprobando dependencias..."
    makensis -VERSION > /dev/null
    if [[ 0 == "$?" ]]; then
        echo "nsis está instalado"
    else
        echo "nsis no está instalado"
    fi
    neu version > /dev/null
    if [[ 0 == "$?" ]]; then
        echo "neutralino está instalado"
    else
        echo "neutralino no está instalado"
    fi
    gcab --version > /dev/null
    if [[ 0 == "$?" ]]; then
        echo "gcab está instalado"
    else
        echo "gcab no está instalado"
    fi
fi

if [[ "versionar" == "$1" || "todo" == "$1" ]]; then
    echo "* Modificando versión a $2..."
    sed -i -E "s/(.+<meta name=\"versionNumero\" content=\").*(\".+)/\1$2\2/" public/index.html
    sed -i -E "s/(.+<meta name=\"versionFecha\" content=\").*(\".+)/\1$(date --utc)\2/" public/index.html
    sed -i -E "s/(.+\"version\": \").*(\",)/\1$2\2/" neutralino.config.json
fi

if [[ "compilar" == "$1" || "todo" == "$1" ]]; then
    echo "* Compilando..."
    neu build
fi

if [[ "instalador" == "$1" || "todo" == "$1" ]]; then
    echo "* Generando instaladores..."
    mkdir -p dist/instalador
    sed "3 a \!define VERSION $2" < instalador.nsi | makensis -
fi

if [[ "portable" == "$1" || "todo" == "$1" ]]; then
    echo "* Generando portable..."
    mkdir -p dist/portable
    gcab -n -c dist/portable/z80_portable.cab dist/z80/z80-win_x64.exe dist/z80/resources.neu
fi

if [[ "limpiar" == "$1" ]]; then
    echo "* Limpiando todo"
    rm -r dist/*
fi