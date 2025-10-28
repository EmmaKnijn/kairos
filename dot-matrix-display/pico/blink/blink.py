import machine
import time
import network
import ubinascii


led = machine.Pin("LED", machine.Pin.OUT)

wlan = network.WLAN(network.STA_IF)

wlan.active(True)
#wlan.config(hostname="emma-pico-w")
#wlan.ipconfig(dhcp4=True)
network.hostname("emma-pico-w")
time.sleep(1)
wlan.connect("NETLAB-327-2","Startsemester")

print("Connecting to WiFI")
#wlan.ifconfig(('192.168.218.223', '255.255.255.0', '192.168.0.1', '8.8.8.8'))
while True:
    led.value(wlan.isconnected())
    print(wlan.isconnected(),wlan.status(),ubinascii.hexlify(wlan.config('mac')).decode())
    print(wlan.ipconfig("addr4"))

    #if not wlan.isconnected():
    #    wlan.disconnect()
    #    wlan.connect("NETLAB-327-2","Startsemester")

    time.sleep(0.5)