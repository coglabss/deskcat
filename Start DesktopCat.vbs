' Double-click to launch the desktop cat with no console window.
Set sh = CreateObject("WScript.Shell")
appDir = "C:\Users\Relanto\Desktop\desktop-cat"
electron = appDir & "\node_modules\electron\dist\electron.exe"
sh.Run """" & electron & """ """ & appDir & """", 0, False
