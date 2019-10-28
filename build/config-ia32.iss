[Setup]
AppId={{F4610ED6-22AB-45BE-AB54-A2C47B5B1899}
AppName=VK Desktop
AppVersion=0.1.3
AppPublisher=danyadev
AppPublisherURL=https://vk.com/danyadev
AppSupportURL=https://vk.com/vk_desktop_app
AppUpdatesURL=https://github.com/danyadev/vk-desktop/releases
DefaultDirName={pf}\VK Desktop
DisableDirPage=yes
DisableProgramGroupPage=yes
OutputDir=..\out
OutputBaseFilename=VK-Desktop-Setup-x32
SetupIconFile=.\icon.ico
UninstallDisplayIcon={app}\VK Desktop.exe
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "..\out\win-ia32-unpacked\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs allowunsafefiles

[Icons]
Name: "{commonprograms}\VK Desktop"; Filename: "{app}\VK Desktop.exe"
Name: "{commondesktop}\VK Desktop"; Filename: "{app}\VK Desktop.exe"; Tasks: desktopicon

[Run]
Filename: "{app}\VK Desktop.exe"; Description: "{cm:LaunchProgram,VK Desktop}"; Flags: nowait postinstall skipifsilent
