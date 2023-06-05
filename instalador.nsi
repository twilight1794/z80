!include MUI2.nsh
!define VERSION "1.0.0"
!define NOMBRE "Emulador Z80"
!define NOMBRE_CORTO "z80"
Name ${NOMBRE}
OutFile "${NOMBRE_CORTO}.${VERSION}.exe"
InstallDir "$PROGRAMFILES64\${NOMBRE}"
InstallDirRegKey HKLM "Software\${NOMBRE_CORTO}" "Install_Dir"
RequestExecutionLevel admin
#LicenseData "COPYING"
#LicenseForceSelection radiobuttons "Acepto" "No acepto"

#!insertmacro MUI_LICENSEPAGE_RADIOBUTTONS

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "COPYING"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

#Page license
#Page directory
#Page instfiles
#UninstPage uninstConfirm
#UninstPage instfiles

Section "Install"
  SetShellVarContext all
  SectionIn RO
  SetOutPath $INSTDIR
  File /oname=z80.exe "dist\z80\z80-win_x64.exe"
  File "dist\z80\resources.neu"
  File "dist\z80\WebView2Loader.dll"
  File /oname=COPYING.txt "COPYING"
#  File "doc/*.*"
  WriteRegStr HKLM SOFTWARE\EmuladorZ80 "Install_Dir" "$INSTDIR"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NOMBRE_CORTO}" "DisplayName" "${NOMBRE}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NOMBRE_CORTO}" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NOMBRE_CORTO}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NOMBRE_CORTO}" "NoRepair" 1
  WriteUninstaller "$INSTDIR\uninstall.exe"
  CreateShortcut "$SMPROGRAMS\${NOMBRE}.lnk" "$INSTDIR\z80.exe" "" "$INSTDIR\z80.exe" 0
  CreateShortcut "$DESKTOP\${NOMBRE}.lnk" "$INSTDIR\z80.exe" "" "$INSTDIR\z80.exe" 0
SectionEnd

Section "Uninstall"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${NOMBRE_CORTO}"
  DeleteRegKey HKLM SOFTWARE\${NOMBRE_CORTO}
  Delete $INSTDIR\z80.exe
  Delete $INSTDIR\resources.neu
  Delete $INSTDIR\WebView2Loader.dll
  Delete $INSTDIR\COPYING.txt
  Delete $INSTDIR\uninstall.exe
#  Delete "$INSTDIR\docs\*"
  Delete "$SMPROGRAMS\YOURPROGRAM\${NOMBRE}.lnk"
#  RMDir "$INSTDIR\docs"
  RMDir "$INSTDIR"
SectionEnd