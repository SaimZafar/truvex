# start-all.ps1 - launches the full Truvex stack, each part in its own window.
# MongoDB runs as a Windows service, so it isn't started here (just ensured running).

$root = if ($PSScriptRoot) { $PSScriptRoot } else { "C:\Users\saimz\truvex" }

# Make sure the local MongoDB service is up (no-op if already running)
Start-Service MongoDB -ErrorAction SilentlyContinue

# 1. Blockchain validator network (all 7 nodes)
Start-Process powershell -ArgumentList "-NoExit", "-Command",
  "`$host.UI.RawUI.WindowTitle='Truvex - Blockchain'; cd '$root'; node start-network.js"

# 2. Auth server (Express + local MongoDB)
Start-Process powershell -ArgumentList "-NoExit", "-Command",
  "`$host.UI.RawUI.WindowTitle='Truvex - Auth Server'; cd '$root\server'; node index.js"

# 3. Frontend (Vite dev server)
Start-Process powershell -ArgumentList "-NoExit", "-Command",
  "`$host.UI.RawUI.WindowTitle='Truvex - Frontend'; cd '$root\client'; npm run dev"

Write-Host "Launched Truvex: blockchain, auth server, and frontend in separate windows."