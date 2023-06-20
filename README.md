# z80

[¡Ejecutar la aplicación web!](https://twilight1794.github.io/z80)

- Emulador del microprocesador Zilog Z80.
- Creado para la clase de Estructura y Programación de Computadoras, del profesor [Alberto Templos Carbajal](https://www.fi-b.unam.mx/info-pa.php?depto=computacion&nombre=AlbertoTemplos).
- Programa web, y también nativo, para ejecutarse sin conexión (para Windows y Linux).
- Software libre, bajo la licencia GNU GPLv3 *([¿qué es esto de «libre»?](https://www.danielclemente.com/libera/sl.html))*.

## Características

- Interfaz web amigable
- Carga y descarga de archivos en ensamblador (.asm)
- Carga y descarga de archivos en código objeto, sintaxis Intel de 8 bits (.hex)
- Manejo de múltiples archivos y proyectos
- Ejecución normal, paso a paso y puntos de ruptura
- Desensamblador
- Visualizador gráfico de los datos en memoria y registro
- Ayuda integrada

### Cosas aún no implementadas

- Puertos e instrucciones I/O
- Características avanzadas de macros

## Compilación

Para generar los ejecutables y el instalador desde un sistema Unix, se requieren las siguientes dependencias:

- `makensis` para generar el instalador para Windows
- `node` y `neu` para generar los ejecutables
- `gcab` para empaquetar la versión portable para Windows
- `sed` para versionar automáticamente los archivos fuente

En la terminal, ejecuta `./preparar.sh todo $version`, donde `$version` es el número de versión a generar. Eso generará todos los archivos para distribuir. Para limpiar el espacio de trabajo, puedes ejecutar `./preparar.sh limpiar`.

Para hacerlo desde un sistema Windows, el proceso debería ser similar, o también se puede utilizar WSL.

## Créditos

- Integrantes del equipo, en orden alfabético:
  - Emilio Cruz
  - Giovanni Garciliano
  - Ernesto López
  - Santiago Rodríguez
  - Carlos Villaseñor
- **Logotipo**:
  - Creado por Santiago Rodríguez.
  - Tiene licencia GPLv3.
- **NeutralinoJS**:
  - Usamos NeutralinoJS para generar los binarios para Windows y Linux.
  - Tiene licencia MIT.
- **NSIS**:
  - Usamos NSIS para generar los instaladores para Windows.
  - Tiene licencia zlib.
- Bibliotecas:
  - **Notyf**: para enviar notificaciones y alertas al usuario. Tiene licencia MIT.
  - **Hint.css**: para los tooltips en botones. Tiene licencia MIT.
- **Tipografías**:
  - Predeterminadamente, usamos dos tipografías:
  - *Carlito*: reemplazo libre de Calibri, para el texto base.
  - *Fira Code*: tipo monoespaciado con algunas ligaduras, para el código.
  - Ambas tipografías están bajo la licencia Open Font License.

## Recursos y otras peripecias

- [Compilador C32 y simulador para Z80](https://mail.fi-b.unam.mx/simulador/), para sistemas de 16 bits
- Con 💜 desde FI UNAM
