import rp2
from machine import Pin
import array
import time

def swizzle5(n):
    # Reverse ABCDE -> EDCBA
    return ((n & 0x01) << 4) | ((n & 0x02) << 2) | ((n & 0x04) << 0) | ((n & 0x08) >> 2) | ((n & 0x10) >> 4)


# ---------- PIN MAP (Pico W -> HUB75) ----------
DATA_BASE = 0         # R0..B1 on GP0..GP5
DATA_WIDTH = 6
ROW_BASE  = 6         # A..E on GP6..GP10 (contiguous)
STB_OE_BASE = 12      # STB=GP12 (sideset bit0), OE=GP13 (sideset bit1)
CLK_PIN = 16          # pixel clock

# ---------- PANEL GEOMETRY ----------
WIDTH, HEIGHT = 64, 64
SCANLINE_PAIRS = 32              # 0..31 (each pair is y and y+32)
WORDS_PER_PAIR = WIDTH // 4      # 4 pixels per 24-bit word -> 16 words

def make_buf():
    return array.array("I", [0] * (SCANLINE_PAIRS * WORDS_PER_PAIR))

front = make_buf()     # shown
back  = make_buf()     # draw here

# ---------- PIO PROGRAMS ----------
@rp2.asm_pio(
    out_shiftdir=0,                     # shift left; we output LSB->MSB onto pins
    autopull=True, pull_thresh=24,      # 4 x 6-bit chunks per word
    out_init=(rp2.PIO.OUT_LOW,) * DATA_WIDTH,
    sideset_init=(rp2.PIO.OUT_LOW,)     # CLK low at reset
)
def pio_data():
    # chunk 0
    out(pins, 6)        .side(1)
    nop()               .side(0)
    # chunk 1
    out(pins, 6)        .side(1)
    nop()               .side(0)
    # chunk 2
    out(pins, 6)        .side(1)
    nop()               .side(0)
    # chunk 3
    out(pins, 6)        .side(1)
    nop()               .side(0)

@rp2.asm_pio(
    out_shiftdir=0, autopull=False,
    out_init=(rp2.PIO.OUT_LOW,) * 5,
    sideset_init=(rp2.PIO.OUT_LOW, rp2.PIO.OUT_HIGH)   # STB=0, OE=1 (disabled)
)
def pio_row():
    wrap_target()
    pull()                    # row pair index in OSR
    # keep OE disabled while addressing/latching
    nop()              .side(0b10)
    out(pins, 5) [2]   # output A..E (or A..D) and settle
    # pulse STB high (OE still high)
    nop()              .side(0b11)  [2]
    nop()              .side(0b10)  [2]
    # enable output (OE low), STB low
    nop()              .side(0b00)
    wrap()

sm_data = rp2.StateMachine(
    0, pio_data,
    out_base=Pin(DATA_BASE),
    sideset_base=Pin(CLK_PIN),
    freq=20_000_000
)
sm_row = rp2.StateMachine(
    1, pio_row,
    out_base=Pin(ROW_BASE),
    sideset_base=Pin(STB_OE_BASE),
    freq=1_000_000
)

sm_row.active(1)
sm_data.active(1)

# ---------- DRAWING HELPERS ----------
def clear(buf):
    for i in range(len(buf)):
        buf[i] = 0

def _word_index_and_bitpos(x, y):
    if x < 0 or x >= WIDTH or y < 0 or y >= HEIGHT:
        return None, None
    pair = y if y < 32 else (y - 32)
    word_index = pair * WORDS_PER_PAIR + (x // 4)
    bitpos = (x % 4) * 6        # 6 bits per (upper+lower) pixel slot
    if y >= 32:
        bitpos += 3             # upper half uses the high 3 bits of the 6
    return word_index, bitpos

def set_pixel(buf, x, y, r, g, b):
    word_index, bitpos = _word_index_and_bitpos(x, y)
    if word_index is None:
        return
    rgb = ((r & 1) << 0) | ((g & 1) << 1) | ((b & 1) << 2)
    w = buf[word_index]
    # clear the 3-bit triplet for this half-row, then set
    w &= ~(0b111 << bitpos)
    w |= (rgb << bitpos)
    buf[word_index] = w

def draw_test_pattern(buf):
    clear(buf)
    # horizontal color bars
    for x in range(WIDTH):
        set_pixel(buf, x,  0, 1, 0, 0)     # red top
        set_pixel(buf, x, 31, 0, 1, 0)     # green mid
        set_pixel(buf, x, 63, 0, 0, 1)     # blue bottom
    # vertical guide lines
    for y in range(HEIGHT):
        set_pixel(buf,  0, y, 1, 1, 1)     # left white
        set_pixel(buf, 32, y, 0, 1, 1)     # center cyan
        set_pixel(buf, 63, y, 1, 0, 1)     # right magenta

# ---------- STARTUP ----------
print("initialised: 64x64 single panel baseline")
draw_test_pattern(back)
front, back = back, front   # show the test pattern

# ---------- SCAN LOOP ----------
row = 0
while True:
    sm_row.put(swizzle5(row))
    base = row * WORDS_PER_PAIR
    for i in range(WORDS_PER_PAIR):
        sm_data.put(front[base + i])

    row += 1
    if row >= SCANLINE_PAIRS:
        row = 0
        # end-of-frame spot to animate: draw into 'back' then swap
        # example (disabled):
        # clear(back); set_pixel(back, (time.ticks_ms()//50)%64, 16, 1,1,1)
        # front, back = back, front
