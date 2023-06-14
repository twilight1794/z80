!define NOMBRE "RetroZ80Simulator"
!define NOMBRE_CORTO "z80"
!define COMENTARIO "Ensamblador y emulador libre del microprocesador Zilog Z80"

VIFileVersion ${VERSION}
VIProductVersion ${VERSION}
VIAddVersionKey "ProductName" ${NOMBRE}
VIAddVersionKey "Comments" "${COMENTARIO}"
VIAddVersionKey "CompanyName" "EyPC"
VIAddVersionKey "LegalCopyright" "© EyPC"
VIAddVersionKey "FileVersion" "${VERSION}"

Name ${NOMBRE}
OutFile "dist/instalador/${NOMBRE_CORTO}_${VERSION}.exe"
InstallDir "$PROGRAMFILES64\${NOMBRE}"
InstallDirRegKey HKLM "Software\${NOMBRE_CORTO}" "Install_Dir"
RequestExecutionLevel admin
LicenseData "COPYING"
LicenseForceSelection radiobuttons "Acepto" "No acepto"

Page license
Page directory
Page instfiles
UninstPage uninstConfirm
UninstPage instfiles

Section "Install"
  SetShellVarContext all
  SectionIn RO
  SetOutPath $INSTDIR
  File /oname=${NOMBRE_CORTO}.exe "dist\z80\z80-win_x64.exe"
  File "dist\z80\resources.neu"
  File "dist\z80\WebView2Loader.dll"
  File /oname=COPYING.txt "COPYING"
  WriteRegStr HKLM SOFTWARE\${NOMBRE_CORTO} "Install_Dir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NOMBRE_CORTO}" "DisplayName" "${NOMBRE}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NOMBRE_CORTO}" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NOMBRE_CORTO}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NOMBRE_CORTO}" "NoRepair" 1
  WriteUninstaller "$INSTDIR\uninstall.exe"
  CreateShortcut "$SMPROGRAMS\${NOMBRE}.lnk" "$INSTDIR\${NOMBRE_CORTO}.exe" "" "$INSTDIR\${NOMBRE_CORTO}.exe" 0
  CreateShortcut "$DESKTOP\${NOMBRE}.lnk" "$INSTDIR\${NOMBRE_CORTO}.exe" "" "$INSTDIR\${NOMBRE_CORTO}.exe" 0
SectionEnd

Section "Uninstall"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NOMBRE_CORTO}"
  DeleteRegKey HKLM SOFTWARE\${NOMBRE_CORTO}
  Delete $INSTDIR\z80.exe
  Delete $INSTDIR\resources.neu
  Delete $INSTDIR\WebView2Loader.dll
  Delete $INSTDIR\COPYING.txt
  Delete $INSTDIR\uninstall.exe
  Delete "$SMPROGRAMS\${NOMBRE}.lnk"
  RMDir "$INSTDIR"
SectionEnd