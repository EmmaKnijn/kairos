import machine
import time
import math

ldr = machine.ADC(28)

while True:
    rawBrightnessValue = ldr.read_u16()
    brightness = (1 - rawBrightnessValue / 65535) / 1
    print(brightness)
    time.sleep_ms(100)