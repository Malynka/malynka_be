
Write-Output "Step 1: Create dump of data"
.\make_dump.ps1

Write-Output "Step 2: Update back-end code"
git pull

Write-Output "Step 3: Create build"
npm run build

Write-Output "Step 5: Migrate data"
node ..\dist\migrate_data.js

Write-Output "Step 6: Restart back-end service"
.\nssm.exe restart malynka-server

Write-Output "Ready! Enjoy! :^)"

