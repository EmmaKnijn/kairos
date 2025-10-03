local endpoint = "http://localhost:3000/dotmatrix"
local station = "ehv"
local platform = 1

term.setGraphicsMode(1)
term.clear()

local animated = false

local function drawCanvas()
  for y=1,128 do
    term.setPixel(258,y,colors.blue)
    term.setPixel(0,y,colors.blue)
  end
  for x=1,256 do
    term.setPixel(x,130,colors.blue)
    term.setPixel(x,0,colors.blue)
  end
end
local function draw()
  local h = http.get(endpoint .. "/" .. station .. "/" .. platform)
  local rawData = h.readAll()
  local data = textutils.unserialiseJSON(rawData)
  h.close()
  
  term.setFrozen(true)
  term.clear()
  drawCanvas()
  for y,t in pairs(data) do
    for x,pixelData in pairs(t) do
        local color = colors.black
        if pixelData.r == 255 and pixelData.g == 255 and pixelData.b == 255 then
          color = colors.white
        elseif pixelData.r == 255 and pixelData.g == 0 and pixelData.b == 0 then
          color = colors.red
        elseif pixelData.r == 0 and pixelData.g == 255 and pixelData.b == 0 then
          color = colors.green
        elseif pixelData.r == 255 and pixelData.g == 165 and pixelData.b == 0 then
          color = colors.orange
        end
        term.setPixel(x*2+1,y*2+1,color)
    end
    if y % 5 == 0 and animated then
      sleep(0.1)
    end
  end
  term.setFrozen(false)
  if animated then
    sleep(2)
    for y=1,128 do
      for x=1,256 do
        term.setPixel(x,y,colors.black)
      end
      if y % 5 == 0 and animated then
        sleep(0.05)
      else
      end
    end
  end
end

local function keyListener()
  while true do
    local event, key, is_held = os.pullEvent("key")
    if key == 2 then
      platform = 1
    elseif key == 3 then
      platform = 2
    elseif key == 3 then
      platform = 2
    elseif key == 4 then
      platform = 3
    elseif key == 5 then
      platform = 4
    elseif key == 6 then
      platform = 5
    elseif key == 7 then
      platform = 6
    end
    --draw()
  end
end

local function drawDaemon()
  while true do
    if not animated then
      sleep(0.5)
    end
    draw()
  end
end

draw()
while true do
  
  parallel.waitForAny(keyListener,drawDaemon)
  --sleep(1)
end

os.pullEvent("char")
