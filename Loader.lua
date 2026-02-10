-- Evade Hub v2 Loader
-- Load with: loadstring(game:HttpGet('https://raw.githubusercontent.com/BreezyFN420/Kvpll-key-hub/main/Loader.lua'))()

local HttpService = game:GetService("HttpService")

-- URL to main script (raw GitHub content)
local SCRIPT_URL = "https://raw.githubusercontent.com/BreezyFN420/Kvpll-key-hub/main/Evade_Hub_WITH_KEYSYSTEM.lua"

print("🌙 Evade Hub Loader - Loading...")

local success, result = pcall(function()
    local scriptContent = game:HttpGet(SCRIPT_URL)
    return scriptContent
end)

if not success then
    print("❌ Failed to download script: " .. tostring(result))
    warn("Script loading failed. Make sure HttpGet is enabled in your executor settings.")
    return
end

print("✅ Script downloaded successfully")
print("📦 Executing Evade Hub...")

-- Execute the downloaded script
local executeSuccess, executeError = pcall(function()
    loadstring(result)()
end)

if not executeSuccess then
    print("❌ Error executing script: " .. tostring(executeError))
    warn(executeError)
else
    print("🎮 Evade Hub loaded successfully!")
end
