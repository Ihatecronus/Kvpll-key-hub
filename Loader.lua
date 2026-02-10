-- Evade Hub v2 Loader
-- Load with: loadstring(game:HttpGet('https://raw.githubusercontent.com/BreezyFN420/Kvpll-key-hub/main/Loader.lua'))()

local function Log(msg)
    print("[Evade Hub] " .. msg)
    warn("[Evade Hub] " .. msg)  -- Also warn for visibility
end

Log("🌙 Starting loader...")

-- Check if HttpGet is available
if not game:HttpGet then
    Log("❌ CRITICAL: HttpGet not available!")
    Log("💡 Enable HTTP requests in your executor settings")
    return
end

-- URL to main script (raw GitHub content)
local SCRIPT_URL = "https://raw.githubusercontent.com/BreezyFN420/Kvpll-key-hub/main/Evade_Hub_WITH_KEYSYSTEM.lua"

Log("📥 Downloading from GitHub...")
Log("🔗 URL: " .. SCRIPT_URL)

local success, result = pcall(function()
    local scriptContent = game:HttpGet(SCRIPT_URL)
    if not scriptContent or scriptContent == "" then
        error("Downloaded content is empty - GitHub might be blocked")
    end
    Log("✅ Downloaded " .. tostring(#scriptContent) .. " bytes")
    return scriptContent
end)

if not success then
    Log("❌ Download failed!")
    Log("Error: " .. tostring(result))
    Log("")
    Log("🔍 TROUBLESHOOTING:")
    Log("1. Check if HttpGet is ENABLED in executor settings")
    Log("2. Try a VPN if GitHub is blocked")
    Log("3. Check internet connection")
    Log("4. Try again in a few moments")
    return
end

Log("⚙️  Parsing and executing script...")

-- Execute the downloaded script with error handling
local executeSuccess, executeError = pcall(function()
    local func = loadstring(result)
    if not func then
        error("Failed to parse script - corrupted download")
    end
    func()
end)

if not executeSuccess then
    Log("❌ Execution error!")
    Log("Error: " .. tostring(executeError))
    warn("Full traceback: " .. tostring(executeError))
else
    Log("✨ Evade Hub loaded successfully!")
    Log("🔐 Key system is now running")
end
