Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
npm run start:dev

<!-- kill port -->

taskkill /f /im node.exe

{
"window.commandCenter": true,
"workbench.colorTheme": "Dracula Theme",
"workbench.iconTheme": "material-icon-theme",
"files.autoSave": "afterDelay",
"cursor.general.disableHttp2": true,
"cursor.general.disableHttp1SSE": false,
"editor.mouseWheelZoom": true,
"dart.previewFlutterUiGuides": true,
"dart.previewFlutterUiGuidesCustomTracking": true,
"[dart]": {
"editor.formatOnSave": true,
"editor.formatOnType": true,
"editor.rulers": [80],
"editor.selectionHighlight": false,
"editor.tabCompletion": "onlySnippets",
"editor.wordBasedSuggestions": "off"
},
"workbench.settings.applyToAllProfiles": [

],
"files.exclude": {
"**/\*.g.dart": true,
"**/_.freezed.dart": true
},
"search.exclude": {
"\*\*/_.g.dart": true,
"**/\*.freezed.dart": true
},
"editor.formatOnSave": true,
"cursor.general.globalCursorIgnoreList": [
"**/credentials.json",
"**/credentials.\*.json",
"**/secret.json",
"**/secrets.json",
"**/_.key",
"\*\*/_.pem",
"**/\*.pfx",
"**/_.p12",
"\*\*/_.crt",
"**/\*.cer",
"**/id*rsa",
"**/id_dsa",
"**/.ssh/id*\*"
],
"editor.defaultFormatter": "esbenp.prettier-vscode",
"typescript.updateImportsOnFileMove.enabled": "always",
"javascript.updateImportsOnFileMove.enabled": "always"
}
