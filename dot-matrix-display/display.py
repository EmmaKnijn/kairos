import machine
import time
import hub75
from picographics import PicoGraphics

# --- Configuration & Initialization ---
WIDTH = 64
HEIGHT = 64

# 1. FIX: Rename `DISPLAY` to `display` for clarity and to avoid conflicts.
display = hub75.Hub75(WIDTH, HEIGHT)

# 2. FIX: This is the correct way to initialize PicoGraphics.
# It should accept the display object you just created.
graphics = PicoGraphics(display=display)

# Initialize the Light Dependent Resistor on ADC pin 28
ldr = machine.ADC(28)

# --- Create Pens (Colors) ---
# 3. FIX: Added the missing pen definitions.
WHITE = graphics.create_pen(255, 255, 255)
BLACK = graphics.create_pen(0, 0, 0)
RED = graphics.create_pen(255, 0, 0)

# --- Draw Initial Content ---
# Clear the screen to black
graphics.set_pen(BLACK)
graphics.clear()

# 4. FIX: Set a pen *before* drawing text so it's visible.
graphics.set_pen(WHITE)
graphics.set_font("bitmap8")
graphics.text("LDR Control!", 2, 2, scale=1)

graphics.set_pen(RED)
graphics.text("Active", 15, 20, scale=2)

# Update the display once with the initial text
display.update(graphics)


# --- Main Loop ---
# This loop will now read the LDR and adjust the screen brightness.
while True:
    # The LDR gives a higher value in the dark.
    # We invert it so brightness is high in the light.
    raw_value = ldr.read_u16()
    
    # Map the 0-65535 range to a 0.1-1.0 brightness range
    # We use 0.1 as the minimum to keep the display from turning off completely.
    brightness = max(0.1, 1.0 - (raw_value / 65535.0))
    
    # 5. FIX: Use the brightness value to control the display.
    display.set_brightness(brightness)
    
    # Print the value for debugging
    print(f"Raw: {raw_value} -> Brightness: {brightness:.2f}")
    
    time.sleep_ms(100)