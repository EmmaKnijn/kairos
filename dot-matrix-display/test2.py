from machine import Pin
import time

# --- Candidate pins we’re testing for A..E, LAT, OE ---
CAND = [6,7,8,9,10,12,13]   # A..E should be a subset of these; LAT and OE are the two remaining.

# --- Helper: safe write with tiny delay ---
def pulse(pin, hi_us=3, lo_us=3):
    pin.value(1); time.sleep_us(hi_us)
    pin.value(0); time.sleep_us(lo_us)

# --- Put data pins in a fixed ON pattern so rows are visible (R/G/B both halves ON) ---
# If your data/CLK are already driven by your scan loop, stop it first.
for gp in range(0,6):
    Pin(gp, Pin.OUT, value=1)

# Try to find OE (the only pin that blanks the display when set HIGH)
oe_pin = None
for gp in CAND:
    print(gp)
    p = Pin(gp, Pin.OUT, value=0)
    p.value(1); time.sleep_ms(80)
    if gp != 12: Pin(12, Pin.OUT, value=0)  # keep others low
    if gp != 13: Pin(13, Pin.OUT, value=0)
    # If the whole panel goes dark, we found OE
    # You’ll see it; no programmatic sensor—so leave it HIGH for a second to observe.
    time.sleep_ms(2000)
    p.value(0)

print("If you saw a full blank on any test above, that gpio is OE. If not, keep going.")

# Ask you to note it:
print(">>> Note which GP (from 6,7,8,9,10,12,13) fully blanked the panel when set HIGH. Set it below.")
# If you know it now, set oe_gp accordingly; otherwise, try manually:
oe_gp = int(input("Enter OE GPIO number (e.g., 13): "))

OE = Pin(oe_gp, Pin.OUT, value=1)  # start disabled (HIGH)
rest = [gp for gp in CAND if gp != oe_gp]

# Find LAT: with OE HIGH (disabled), we’ll wiggle each remaining pin quickly; the one that causes rows to "step/latch" when pulsed after changing A..E is LAT.
# But easier: LAT pulses alone usually won’t change anything while OE is HIGH; so we’ll identify A..E first by seeing which pins move the selected row when toggled.

# Choose 5 pins out of 'rest' to act as A..E; we’ll brute-force combinations of 5 out of remaining pins and detect a “binary counter” behaviour.
# To avoid combinatorial explosion in MicroPython, we’ll ask you to select the 5 address pins you wired (commonly 6..10).
print("Assuming A..E are GP6..GP10. If yours differ, edit the next line.")
addr_gpios = [6,7,8,9,10]   # EDIT if needed

ADDR = [Pin(gp, Pin.OUT, value=0) for gp in addr_gpios]

# The last remaining candidate is LAT.
lat_gp = [gp for gp in rest if gp not in addr_gpios][0]
LAT = Pin(lat_gp, Pin.OUT, value=0)

print("Guessed pins -> A..E:", addr_gpios, " LAT:", lat_gp, " OE:", oe_gp)

# Visual verify: walk through all 32 addresses
def set_addr(n):
    for i,p in enumerate(ADDR):
        p.value((n >> i) & 1)

print("Walking rows; you should see a single bright line step 0..31 smoothly. Ctrl+C to stop.")
try:
    while True:
        for n in range(32):
            OE.value(1)             # disable
            set_addr(n)
            pulse(LAT, 3, 3)        # latch new address
            OE.value(0)             # enable
            time.sleep_ms(120)
except KeyboardInterrupt:
    pass

print("Done. If the walk order isn't top->bottom, note which gpios correspond to A,B,C,D,E (LSB..MSB).")
