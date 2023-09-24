$scriptPath = Split-Path $MyInvocation.MyCommand.Path -Parent
$pathToSave = Join-Path -Path $scriptPath -ChildPath "..\..\malynka_db_dump"

mongodump.exe --uri "mongodb://localhost:27017/malynkadb?connect=direct" --out $pathToSave

pause