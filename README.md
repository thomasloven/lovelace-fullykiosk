# lovelace-fullykiosk

Lovelace plugin for use with
[Fully Kiosk Browser](https://www.ozerov.de/fully-kiosk-browser/).

Allows home-assistant to 

## Installation

1. Copy `lovelace-fullykiosk.js` to `<ha config>/www/lovelace-fullykiosk.js`

2. Add a `light` and `binary_sensor` to your home-assistant config

```yaml
light:
  - platform: template
    lights:
      dashboard_screen:
        turn_on:
        turn_off:
        set_level:

binary_sensor:
  - platform: mqtt
    name: dashboard_motion
    state_topic: any/value
```

3. Add a file `<ha config>/www/kiosk-config.js` with the following contents:

```js
setTimeout(functon() {
  FullyKiosk.bind("fully_kiosk_id", "light.dashboard_screen", "binary_sensor.dashboard_motion");
}, 200);
```
where `fully_kiosk_id` is the Device ID from Fully Kiosk Browser (available
under `Settings->Other Settings`).

4. Add the `.js` files as resources in `ui-lovelace.yaml`

```yaml
resources:
  - url: /local/lovelace-fullykiosk.js
    type: js
  - url: /local/kiosk-config.js
    type: js
```

5. In Fully Kiosk Browser, Enable `Settings->Advanced Web Settings->Javascript
   Interface (PLUS)` and `Settings->Motion Detection (PLUS)->Enable Visual
   Motion Detection`

6. Point Fully Kiosk Browser to your lovelace UI.

---

You should now be able to turn the screen on or off and adjust it's brightness
from home-assistant. The light switch should also update if you turn the screen
on or off manually.

The motion sensor in home-assistant should activate for five seconds if
something moves in front of the camera.

Both the screen light and the motion sensor has the attributes `battery_level`
and `charging` which contains battery and charge status.

## Camera

Bonus note: To get a camera view from the device into
home-assistant, enable `Settings->Remote Administration
(PLUS)->Enable Remote Administration` and `Settings->Remote
Administration (PLUS)->Remote Admin from Local Network`. Set an
admin password under `Settings->Remote Administration (PLUS)->Remote
Admin Password`. Then add

```yaml
camera:
  - name: dashboard_camera
    platform: generic
    still_image_url: http://ip-of-device:2323?cmd=getCamshot&password=your_admin_password
```

to your home-assistant config.

## Media player

The project which inspired this plugin -
[ha-floorplan-kiosk](https://github.com/pkozul/ha-floorplan-kiosk)
by Petar Kozul - also allows the device to be used as a media player.

Since this function does not depend on Fully Kiosk Browser, I put that in a
separate plugin:
[lovelace-player](https://github.com/thomasloven/lovelace-player).
