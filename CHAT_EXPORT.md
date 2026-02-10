# Exported Chat — Evade Hub Assistance

Date: 2026-02-09

This file contains the exported conversation used to update and integrate ESP, CFrame speed, and a key system into the Evade Hub script.

---

[Conversation transcript below — preserved as-is from the user session]


-- Evade Rayfield GUI Script (Open Source, 2026 Compatible)
-- Incorporated: Enhanced Fly (Mobile/PC with Hold Support) + Universal Noclip (All Objects/Terrain, Restore on Disable, Anti-Fall Raycast)
-- Enhanced: Customizable ESP Colors + Rainbow Mode + Health Bars + Distance Toggle + Team Colors + Individual ESP Parts Toggles!
-- Compiled from 2026 sources: zReal-King/Evade, Draconic Hub, Pastebins
-- Features: Speed/Jump Sliders, Fly (Mobile/PC Optimized), Noclip, Inf Jump/BHop, Auto Revive, Godmode, Auto Farm Tickets, FPS Boost/Anti-AFK, Fullbright/No Fog
-- ESP: Players/Nextbots/Tickets + Health Bars (Gradient) + Tracers/Boxes/Names (Nametags)/Dist (All Toggleable Individually) + Team Colors (Players)
-- Keyless. Fully readable/editable. Load in KRNL/Delta/Synapse/etc.

local Rayfield = loadstring(game:HttpGet('https://sirius.menu/rayfield'))()

local Window = Rayfield:CreateWindow({
   Name = "Evade Hub v2.5 (2026)",
   LoadingTitle = "Loading kvpll's Evade Hub...",
   LoadingSubtitle = "by kvpll",
   ConfigurationSaving = {
      Enabled = true,
      FolderName = nil,
      FileName = "EvadeHub"
   },
   Discord = { Enabled = false },
   KeySystem = false
})

Rayfield:Notify({
   Title = "Evade Hub Loaded!",
   Content = "You are probably a skid so you wont care",
   Duration = 5,
   Image = 4483362458
})

-- Services
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local UserInputService = game:GetService("UserInputService")
local TweenService = game:GetService("TweenService")
local Lighting = game:GetService("Lighting")
local Workspace = game:GetService("Workspace")
local TeleportService = game:GetService("TeleportService")
local GuiService = game:GetService("GuiService")

local Player = Players.LocalPlayer
local PlayerGui = Player:WaitForChild("PlayerGui")

-- Vars
getgenv().FlyEnabled = false
getgenv().NoclipEnabled = false
getgenv().InfiniteJumpEnabled = false
getgenv().AutoReviveEnabled = false
getgenv().PlayerESP = false
getgenv().NextbotESP = false
getgenv().TicketESP = false
getgenv().RainbowESP = false
getgenv().ShowBoxes = true
getgenv().ShowNames = true
getgenv().ShowTracers = true
getgenv().ShowHealthBars = false
getgenv().ShowDistance = true  -- Default on
getgenv().TeamColors = false  -- Default off (use custom color)
getgenv().FullbrightEnabled = false
getgenv().AutoFarmEnabled = false

local FlySpeed = 50
local Connections = {}
local ESPTable = {}
local Camera = Workspace.CurrentCamera
local FlyDirections = {Forward = false, Backward = false, Left = false, Right = false, Up = false, Down = false}
local FlyGui = nil
local IsMobile = UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled

local originalCanCollide = {}
local flying = false
local flyGyro = Instance.new("BodyGyro")
local flyVel = Instance.new("BodyVelocity")
flyGyro.MaxTorque = Vector3.new(400000,400000,400000)
flyGyro.P = 10000
flyVel.MaxForce = Vector3.new(400000,400000,400000)
flyVel.Velocity = Vector3.new(0,0,0)

-- Custom Colors (Default)
local PlayerESPColor = Color3.fromRGB(0, 255, 0)  -- Green
local NextbotESPColor = Color3.fromRGB(255, 0, 0)  -- Red
local TicketESPColor = Color3.fromRGB(0, 170, 255)  -- Blue

-- Update Character
local function UpdateCharacter()
   local char = Player.Character or Player.CharacterAdded:Wait()
   local hum = char:WaitForChild("Humanoid")
   local root = char:WaitForChild("HumanoidRootPart")
   return char, hum, root
end

local Character, Humanoid, RootPart = UpdateCharacter()
Player.CharacterAdded:Connect(function() Character, Humanoid, RootPart = UpdateCharacter() end)

-- ESP Implementation
local function ClearAllESP()
   for _, drawings in pairs(ESPTable) do
      for _, drawing in pairs(drawings) do
         drawing:Remove()
      end
   end
   ESPTable = {}
end

local function CreateESPComponents(hasHealth)
   local components = {
      box = Drawing.new("Square"),
      name = Drawing.new("Text"),
      dist = Drawing.new("Text"),
      tracer = Drawing.new("Line")
   }
   if hasHealth then
      components.healthBG = Drawing.new("Square")
      components.healthBG.Thickness = 1
      components.healthBG.Filled = true
      components.healthBG.Color = Color3.fromRGB(50, 50, 50)  -- Dark BG
      components.healthBG.Transparency = 0.5

      components.healthFill = Drawing.new("Square")
      components.healthFill.Thickness = 1
      components.healthFill.Filled = true
      components.healthFill.Transparency = 1
   end
   components.box.Thickness = 2
   components.box.Filled = false
   components.name.Size = 18
   components.name.Center = true
   components.name.Outline = true
   components.name.Color = Color3.fromRGB(255, 255, 255)
   components.name.Font = 2
   components.dist.Size = 16
   components.dist.Center = true
   components.dist.Outline = true
   components.dist.Color = Color3.fromRGB(255, 255, 255)
   components.dist.Font = 2
   components.tracer.Thickness = 1
   return components
end

local function GetRainbowColor()
   return Color3.fromHSV(tick() % 1, 1, 1)  -- Cycles through hues
end

local function GetHealthColor(perc)
   return Color3.new(1 - perc, perc, 0)  -- Red to Green gradient
end

local function GetTeamColor(plr)
   if plr.Team then
      return plr.TeamColor.Color
   else
      return Color3.fromRGB(255, 255, 255)  -- White if no team
   end
end

local function UpdateESP()
   local rootPos = RootPart.Position
   local cam = Camera
   local rainbowColor = GetRainbowColor()  -- For rainbow mode

   -- Players ESP
   if getgenv().PlayerESP then
      for _, plr in pairs(Players:GetPlayers()) do
         if plr ~= Player and plr.Character and plr.Character:FindFirstChild("HumanoidRootPart") and plr.Character:FindFirstChild("Humanoid") then
            local targetHum = plr.Character.Humanoid
            local targetRoot = plr.Character.HumanoidRootPart
            local target = plr.Character
            if not ESPTable[target] then
               ESPTable[target] = CreateESPComponents(true)
            end

            local drawings = ESPTable[target]
            local pos, onScreen = cam:WorldToViewportPoint(targetRoot.Position)
            local visibleCondition = onScreen and (targetRoot.Position - rootPos).Magnitude < 2000
            if visibleCondition then
               local headPos = cam:WorldToViewportPoint(targetRoot.Position + Vector3.new(0, 3, 0))
               local legPos = cam:WorldToViewportPoint(targetRoot.Position - Vector3.new(0, 4, 0))
               local boxSize = math.abs((headPos.Y - legPos.Y) / 2)
               local boxHeight = math.abs(headPos.Y - legPos.Y)

               local espColor
               if getgenv().RainbowESP then
                  espColor = rainbowColor
               elseif getgenv().TeamColors then
                  espColor = GetTeamColor(plr)
               else
                  espColor = PlayerESPColor
               end
               drawings.box.Color = espColor
               drawings.tracer.Color = espColor

               drawings.box.Size = Vector2.new(boxSize, boxHeight)
               drawings.box.Position = Vector2.new(pos.X - boxSize / 2, pos.Y - boxHeight / 2)
               drawings.box.Visible = getgenv().ShowBoxes

               local dist = math.floor((targetRoot.Position - rootPos).Magnitude)
               drawings.name.Text = plr.Name
               drawings.name.Position = Vector2.new(pos.X, pos.Y - boxHeight / 2 - 20)
               drawings.name.Visible = getgenv().ShowNames

               drawings.dist.Text = dist .. "m"
               drawings.dist.Position = Vector2.new(pos.X, pos.Y - boxHeight / 2 - 5)
               drawings.dist.Visible = getgenv().ShowDistance

               drawings.tracer.From = Vector2.new(cam.ViewportSize.X / 2, cam.ViewportSize.Y)
               drawings.tracer.To = Vector2.new(pos.X, pos.Y + boxHeight / 2)
               drawings.tracer.Visible = getgenv().ShowTracers

               if getgenv().ShowHealthBars and drawings.healthBG then
                  local perc = targetHum.Health / targetHum.MaxHealth
                  local healthColor = GetHealthColor(perc)
                  drawings.healthFill.Color = healthColor

                  local barWidth = 5
                  local barHeight = boxHeight * perc
                  drawings.healthBG.Size = Vector2.new(barWidth, boxHeight)
                  drawings.healthBG.Position = Vector2.new(pos.X - boxSize / 2 - barWidth - 2, pos.Y - boxHeight / 2)
                  drawings.healthBG.Visible = true

                  drawings.healthFill.Size = Vector2.new(barWidth, barHeight)
                  drawings.healthFill.Position = Vector2.new(pos.X - boxSize / 2 - barWidth - 2, pos.Y - boxHeight / 2 + (boxHeight - barHeight))
                  drawings.healthFill.Visible = true
               elseif drawings.healthBG then
                  drawings.healthBG.Visible = false
                  drawings.healthFill.Visible = false
               end
            else
               drawings.box.Visible = false
               drawings.name.Visible = false
               drawings.dist.Visible = false
               drawings.tracer.Visible = false
               if drawings.healthBG then
                  drawings.healthBG.Visible = false
                  drawings.healthFill.Visible = false
               end
            end
         end
      end
   end

   -- Nextbots ESP
   if getgenv().NextbotESP then
      for _, obj in pairs(Workspace:GetChildren()) do
         if obj:FindFirstChild("HumanoidRootPart") and obj:FindFirstChild("Humanoid") and Players:GetPlayerFromCharacter(obj) == nil and obj ~= Character then
            local targetHum = obj.Humanoid
            local targetRoot = obj.HumanoidRootPart
            local target = obj
            if not ESPTable[target] then
               ESPTable[target] = CreateESPComponents(true)
            end

            local drawings = ESPTable[target]
            local pos, onScreen = cam:WorldToViewportPoint(targetRoot.Position)
            local visibleCondition = onScreen and (targetRoot.Position - rootPos).Magnitude < 2000
            if visibleCondition then
               local headPos = cam:WorldToViewportPoint(targetRoot.Position + Vector3.new(0, targetHum.HipHeight, 0))
               local legPos = cam:WorldToViewportPoint(targetRoot.Position - Vector3.new(0, 4, 0))
               local boxSize = math.abs((headPos.Y - legPos.Y) / 2)
               local boxHeight = math.abs(headPos.Y - legPos.Y)

               local espColor = getgenv().RainbowESP and rainbowColor or NextbotESPColor
               drawings.box.Color = espColor
               drawings.tracer.Color = espColor

               drawings.box.Size = Vector2.new(boxSize * 1.5, boxHeight * 1.5)
               drawings.box.Position = Vector2.new(pos.X - boxSize * 0.75, pos.Y - boxHeight / 2)
               drawings.box.Visible = getgenv().ShowBoxes

               local dist = math.floor((targetRoot.Position - rootPos).Magnitude)
               drawings.name.Text = obj.Name .. " (" .. targetHum.WalkSpeed .. ")"
               drawings.name.Position = Vector2.new(pos.X, pos.Y - boxHeight / 2 - 25)
               drawings.name.Visible = getgenv().ShowNames

               drawings.dist.Text = dist .. "m"
               drawings.dist.Position = Vector2.new(pos.X, pos.Y - boxHeight / 2 - 8)
               drawings.dist.Visible = getgenv().ShowDistance

               drawings.tracer.From = Vector2.new(cam.ViewportSize.X / 2, cam.ViewportSize.Y)
               drawings.tracer.To = Vector2.new(pos.X, pos.Y + boxHeight / 2)
               drawings.tracer.Visible = getgenv().ShowTracers

               if getgenv().ShowHealthBars and drawings.healthBG then
                  local perc = targetHum.Health / targetHum.MaxHealth
                  local healthColor = GetHealthColor(perc)
                  drawings.healthFill.Color = healthColor

                  local barWidth = 5
                  local barHeight = boxHeight * perc * 1.5
                  drawings.healthBG.Size = Vector2.new(barWidth, boxHeight * 1.5)
                  drawings.healthBG.Position = Vector2.new(pos.X - boxSize * 0.75 - barWidth - 2, pos.Y - boxHeight / 2)
                  drawings.healthBG.Visible = true

                  drawings.healthFill.Size = Vector2.new(barWidth, barHeight)
                  drawings.healthFill.Position = Vector2.new(pos.X - boxSize * 0.75 - barWidth - 2, pos.Y - boxHeight / 2 + (boxHeight * 1.5 - barHeight))
                  drawings.healthFill.Visible = true
               elseif drawings.healthBG then
                  drawings.healthBG.Visible = false
                  drawings.healthFill.Visible = false
               end
            else
               drawings.box.Visible = false
               drawings.name.Visible = false
               drawings.dist.Visible = false
               drawings.tracer.Visible = false
               if drawings.healthBG then
                  drawings.healthBG.Visible = false
                  drawings.healthFill.Visible = false
               end
            end
         end
      end
   end

   -- Tickets/Cash ESP (No health, but with individual toggles)
   if getgenv().TicketESP then
      for _, obj in pairs(Workspace:GetDescendants()) do
         if obj:IsA("BasePart") and (string.find(string.lower(obj.Name), "ticket") or string.find(string.lower(obj.Name), "cash") or obj:FindFirstChild("BillboardGui")) then
            local target = obj
            if not ESPTable[target] then
               ESPTable[target] = CreateESPComponents(false)
            end

            local drawings = ESPTable[target]
            local pos, onScreen = cam:WorldToViewportPoint(target.Position)
            local visibleCondition = onScreen and (target.Position - rootPos).Magnitude < 2000
            if visibleCondition then
               local espColor = getgenv().RainbowESP and rainbowColor or TicketESPColor
               drawings.box.Color = espColor
               drawings.tracer.Color = espColor

               drawings.box.Size = Vector2.new(10, 10)
               drawings.box.Position = Vector2.new(pos.X - 5, pos.Y - 5)
               drawings.box.Visible = getgenv().ShowBoxes

               local dist = math.floor((target.Position - rootPos).Magnitude)
               drawings.name.Text = obj.Name
               drawings.name.Position = Vector2.new(pos.X, pos.Y - 15)
               drawings.name.Visible = getgenv().ShowNames

               drawings.dist.Text = dist .. "m"
               drawings.dist.Position = Vector2.new(pos.X, pos.Y + 5)
               drawings.dist.Visible = getgenv().ShowDistance

               drawings.tracer.From = Vector2.new(cam.ViewportSize.X / 2, cam.ViewportSize.Y)
               drawings.tracer.To = pos
               drawings.tracer.Visible = getgenv().ShowTracers
            else
               drawings.box.Visible = false
               drawings.name.Visible = false
               drawings.dist.Visible = false
               drawings.tracer.Visible = false
            end
         end
      end
   end

   -- Cleanup invalid targets
   for target, _ in pairs(ESPTable) do
      if not target.Parent then
         for _, drawing in pairs(ESPTable[target]) do
            drawing:Remove()
         end
         ESPTable[target] = nil
      end
   end
end

Connections.ESP = RunService.RenderStepped:Connect(UpdateESP)

-- Mobile Fly GUI Creation (with Hold Support)
local function CreateMobileFlyGui()
   if FlyGui then return end
   FlyGui = Instance.new("ScreenGui")
   FlyGui.Parent = PlayerGui
   FlyGui.IgnoreGuiInset = true

   local function CreateButton(name, position, direction)
      local button = Instance.new("TextButton")
      button.Size = UDim2.new(0, 60, 0, 60)
      button.Position = position
      button.Text = name
      button.BackgroundColor3 = Color3.fromRGB(0, 0, 0)
      button.TextColor3 = Color3.fromRGB(255, 255, 255)
      button.Parent = FlyGui
      button.InputBegan:Connect(function(input)
         if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            FlyDirections[direction] = true
         end
      end)
      button.InputEnded:Connect(function(input)
         if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
            FlyDirections[direction] = false
         end
      end)
      return button
   end

   CreateButton("W", UDim2.new(0.5, -30, 1, -120), "Forward")
   CreateButton("S", UDim2.new(0.5, -30, 1, -60), "Backward")
   CreateButton("A", UDim2.new(0.5, -90, 1, -60), "Left")
   CreateButton("D", UDim2.new(0.5, 30, 1, -60), "Right")
   CreateButton("Up", UDim2.new(1, -60, 1, -120), "Up")
   CreateButton("Down", UDim2.new(1, -60, 1, -60), "Down")
end

local function DestroyMobileFlyGui()
   if FlyGui then
      FlyGui:Destroy()
      FlyGui = nil
   end
end

-- Tab 1: Player
local PlayerTab = Window:CreateTab("Player", 4483362458)
PlayerTab:CreateSection("Movement")

PlayerTab:CreateSlider({
   Name = "Walk Speed",
   Range = {16, 500},
   Increment = 1,
   Suffix = " Speed",
   CurrentValue = 16,
   Flag = "WalkSpeed",
   Callback = function(Value)
      Humanoid.WalkSpeed = Value
   end,
})

PlayerTab:CreateSlider({
   Name = "Jump Power",
   Range = {50, 500},
   Increment = 5,
   Suffix = " Power",
   CurrentValue = 50,
   Flag = "JumpPower",
   Callback = function(Value)
      Humanoid.JumpPower = Value
   end,
})

PlayerTab:CreateToggle({
   Name = "Fly (Mobile/PC)",
   CurrentValue = false,
   Flag = "Fly",
   Callback = function(Value)
      getgenv().FlyEnabled = Value
      flying = Value
      if Value then
         flyGyro.Parent = RootPart
         flyVel.Parent = RootPart
         flyGyro.CFrame = RootPart.CFrame
         if IsMobile then
            CreateMobileFlyGui()
         end
         Connections.Fly = RunService.Heartbeat:Connect(function()
            if not flying then return end
            local cam = Workspace.CurrentCamera
            local dir = Vector3.new()
            if FlyDirections.Forward or UserInputService:IsKeyDown(Enum.KeyCode.W) then dir = dir + cam.CFrame.LookVector end
            if FlyDirections.Backward or UserInputService:IsKeyDown(Enum.KeyCode.S) then dir = dir - cam.CFrame.LookVector end
            if FlyDirections.Left or UserInputService:IsKeyDown(Enum.KeyCode.A) then dir = dir - cam.CFrame.RightVector end
            if FlyDirections.Right or UserInputService:IsKeyDown(Enum.KeyCode.D) then dir = dir + cam.CFrame.RightVector end
            if FlyDirections.Up or UserInputService:IsKeyDown(Enum.KeyCode.Space) then dir = dir + Vector3.new(0,1,0) end
            if FlyDirections.Down or UserInputService:IsKeyDown(Enum.KeyCode.LeftShift) then dir = dir - Vector3.new(0,1,0) end
            if dir.Magnitude > 0 then dir = dir.Unit * FlySpeed end
            flyVel.Velocity = dir
            flyGyro.CFrame = CFrame.new(RootPart.Position, RootPart.Position + cam.CFrame.LookVector)
         end)
      else
         if Connections.Fly then Connections.Fly:Disconnect() end
         flyGyro.Parent = nil
         flyVel.Parent = nil
         DestroyMobileFlyGui()
         FlyDirections = {Forward = false, Backward = false, Left = false, Right = false, Up = false, Down = false}
      end
   end,
})

PlayerTab:CreateSlider({
   Name = "Fly Speed",
   Range = {16, 200},
   Increment = 1,
   Suffix = " Speed",
   CurrentValue = 50,
   Flag = "FlySpeed",
   Callback = function(Value) FlySpeed = Value end,
})

PlayerTab:CreateToggle({
   Name = "Noclip",
   CurrentValue = false,
   Flag = "Noclip",
   Callback = function(Value)
      getgenv().NoclipEnabled = Value
      if Value then
         if Character then
            for _, part in pairs(Character:GetChildren()) do
               if part:IsA("BasePart") then
                  originalCanCollide[part] = part.CanCollide
               end
            end
         end
         Connections.Noclip = RunService.Stepped:Connect(function()
            if Character and Humanoid and RootPart then
               for _, part in pairs(Character:GetChildren()) do
                  if part:IsA("BasePart") and part.CanCollide then
                     part.CanCollide = false
                  end
               end
            end
         end)
         Rayfield:Notify({Title="Noclip", Content="Enabled", Duration=3})
      else
         if Connections.Noclip then Connections.Noclip:Disconnect() end
         if Character then
            if RootPart then
               local raycast = Workspace:Raycast(RootPart.Position, Vector3.new(0, -10, 0))
               if not raycast then
                  local downRay = Workspace:Raycast(RootPart.Position, Vector3.new(0, -1000, 0))
                  if downRay then
                     RootPart.CFrame = CFrame.new(downRay.Position + Vector3.new(0, 5, 0))
                  end
               end
            end
            task.wait(0.1)
            for _, part in pairs(Character:GetChildren()) do
               if part:IsA("BasePart") then
                  local originalValue = originalCanCollide[part]
                  if originalValue ~= nil then
                     part.CanCollide = originalValue
                  else
                     if part.Name == "HumanoidRootPart" then
                        part.CanCollide = false
                     else
                        part.CanCollide = true
                     end
                  end
               end
            end
            if Humanoid then
               Humanoid:ChangeState(Enum.HumanoidStateType.Physics)
               task.wait(0.1)
               Humanoid:ChangeState(Enum.HumanoidStateType.Running)
            end
         end
         originalCanCollide = {}
         Rayfield:Notify({Title="Noclip", Content="Disabled", Duration=3})
      end
   end,
})

PlayerTab:CreateToggle({
   Name = "Infinite Jump / BHop",
   CurrentValue = false,
   Flag = "InfJump",
   Callback = function(Value)
      getgenv().InfiniteJumpEnabled = Value
      if Value then
         Connections.InfJump = UserInputService.JumpRequest:Connect(function()
            Humanoid:ChangeState("Jumping")
         end)
      else
         if Connections.InfJump then Connections.InfJump:Disconnect() end
      end
   end,
})

-- Tab 2: Combat
local CombatTab = Window:CreateTab("Combat", 4483362458)
CombatTab:CreateSection("Auto")

CombatTab:CreateToggle({
   Name = "Auto Revive / Respawn",
   CurrentValue = false,
   Flag = "AutoRevive",
   Callback = function(Value)
      getgenv().AutoReviveEnabled = Value
      if Value then
         Connections.AutoRevive = RunService.Heartbeat:Connect(function()
            if Character:GetAttribute("Downed") then
               ReplicatedStorage.Events.Player.ChangePlayerMode:FireServer(true)
            end
         end)
      else
         if Connections.AutoRevive then Connections.AutoRevive:Disconnect() end
      end
   end,
})

CombatTab:CreateToggle({
   Name = "Godmode (No Damage)",
   CurrentValue = false,
   Flag = "Godmode",
   Callback = function(Value)
      if Value then
         Connections.Godmode = RunService.Stepped:Connect(function()
            Humanoid.Health = Humanoid.MaxHealth
         end)
      else
         if Connections.Godmode then Connections.Godmode:Disconnect() end
      end
   end,
})

-- Tab 3: Render (ESP Customizations)
local RenderTab = Window:CreateTab("Render", 4483362458)
RenderTab:CreateSection("ESP Toggles")

RenderTab:CreateToggle({
   Name = "Player ESP",
   CurrentValue = false,
   Flag = "PlayerESP",
   Callback = function(Value) getgenv().PlayerESP = Value end,
})

RenderTab:CreateToggle({
   Name = "Nextbot ESP",
   CurrentValue = false,
   Flag = "NextbotESP",
   Callback = function(Value) getgenv().NextbotESP = Value end,
})

RenderTab:CreateToggle({
   Name = "Ticket/Cash ESP",
   CurrentValue = false,
   Flag = "TicketESP",
   Callback = function(Value) getgenv().TicketESP = Value end,
})

RenderTab:CreateToggle({
   Name = "Rainbow Mode (All ESP)",
   CurrentValue = false,
   Flag = "RainbowESP",
   Callback = function(Value) getgenv().RainbowESP = Value end,
})

RenderTab:CreateToggle({
   Name = "Show Boxes",
   CurrentValue = true,
   Flag = "ShowBoxes",
   Callback = function(Value) getgenv().ShowBoxes = Value end,
})

RenderTab:CreateToggle({
   Name = "Show Names (Nametags)",
   CurrentValue = true,
   Flag = "ShowNames",
   Callback = function(Value) getgenv().ShowNames = Value end,
})

RenderTab:CreateToggle({
   Name = "Show Tracers",
   CurrentValue = true,
   Flag = "ShowTracers",
   Callback = function(Value) getgenv().ShowTracers = Value end,
})

RenderTab:CreateToggle({
   Name = "Show Health Bars (Players/Nextbots)",
   CurrentValue = false,
   Flag = "ShowHealthBars",
   Callback = function(Value) getgenv().ShowHealthBars = Value end,
})

RenderTab:CreateToggle({
   Name = "Show Distance (All ESP)",
   CurrentValue = true,
   Flag = "ShowDistance",
   Callback = function(Value) getgenv().ShowDistance = Value end,
})

RenderTab:CreateToggle({
   Name = "Team Colors (Players Only)",
   CurrentValue = false,
   Flag = "TeamColors",
   Callback = function(Value) getgenv().TeamColors = Value end,
})

RenderTab:CreateSection("ESP Colors (Overrides Rainbow/Team)")

RenderTab:CreateColorPicker({
   Name = "Player ESP Color",
   Color = PlayerESPColor,
   Flag = "PlayerColor",
   Callback = function(Value) PlayerESPColor = Value end
})

RenderTab:CreateColorPicker({
   Name = "Nextbot ESP Color",
   Color = NextbotESPColor,
   Flag = "NextbotColor",
   Callback = function(Value) NextbotESPColor = Value end
})

RenderTab:CreateColorPicker({
   Name = "Ticket ESP Color",
   Color = TicketESPColor,
   Flag = "TicketColor",
   Callback = function(Value) TicketESPColor = Value end
})

RenderTab:CreateToggle({
   Name = "Fullbright + No Fog",
   CurrentValue = false,
   Flag = "Fullbright",
   Callback = function(Value)
      getgenv().FullbrightEnabled = Value
      if Value then
         Lighting.Brightness = 2
         Lighting.Ambient = Color3.new(1,1,1)
         Lighting.FogEnd = 9e9
         Lighting.GlobalShadows = false
         Lighting.ShadowSoftness = 0
      else
         Lighting.Brightness = 1
         Lighting.Ambient = Color3.new(0.5,0.5,0.5)
         Lighting.FogEnd = 100000
         Lighting.GlobalShadows = true
      end
   end,
})

-- Tab 4: Auto Farm
local FarmTab = Window:CreateTab("Farm", 4483362458)
FarmTab:CreateSection("Auto Collect")

FarmTab:CreateToggle({
   Name = "Auto Farm Tickets/Cash",
   CurrentValue = false,
   Flag = "AutoFarm",
   Callback = function(Value)
      getgenv().AutoFarmEnabled = Value
      if Value then
         Connections.AutoFarm = RunService.Heartbeat:Connect(function()
            for _, obj in pairs(Workspace:GetDescendants()) do
               if obj:IsA("BasePart") and (string.find(string.lower(obj.Name), "ticket") or string.find(string.lower(obj.Name), "cash")) and obj.Parent then
                  RootPart.CFrame = obj.CFrame
                  firetouchinterest(RootPart, obj, 0)
                  wait()
                  firetouchinterest(RootPart, obj, 1)
               end
            end
         end)
      else
         if Connections.AutoFarm then Connections.AutoFarm:Disconnect() end
      end
   end,
})

-- Tab 5: Misc
local MiscTab = Window:CreateTab("Misc", "settings")
MiscTab:CreateSection("Utilities")

MiscTab:CreateButton({
   Name = "Anti-AFK / FPS Boost",
   Callback = function()
      local VirtualUser = game:GetService("VirtualUser")
      Player.Idled:Connect(function() VirtualUser:CaptureController() VirtualUser:ClickButton2(Vector2.new()) end)
      setfpscap(999)
      Rayfield:Notify({Title="Anti-AFK", Content="Enabled + FPS Unlocked", Duration=3})
   end,
})

MiscTab:CreateButton({
   Name = "Rejoin Server",
   Callback = function()
      TeleportService:Teleport(game.PlaceId, Player)
   end,
})

MiscTab:CreateButton({
   Name = "Server Hop",
   Callback = function()
      loadstring(game:HttpGet("https://raw.githubusercontent.com/RegularVynixu/Vynixius/main/Modules/Server-Hop.lua"))()
   end,
})

MiscTab:CreateButton({
   Name = "Clear ESP",
   Callback = function()
      ClearAllESP()
      Rayfield:Notify({Title="ESP", Content="Cleared!", Duration=2})
   end,
})

-- Load Config
Rayfield:LoadConfiguration()



--- End of transcript (original content preserved)


Notes:
- The above file contains the conversation and the script excerpts included by the user during the session.
- If you want the exported content split into multiple files (script.lua, setup_guide.md, server.js, etc.), tell me which files to create and I will add them.

