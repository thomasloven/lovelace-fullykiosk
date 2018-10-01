var LovelaceFullyKiosk = LovelaceFullyKiosk || (function() {

  var _active = false
  var _screen;
  var _screen_state;
  var _screen_state_last = !_screen_state;
  var _motion;
  var _motion_state = false;
  var _motion_state_last = !_motion_state;
  var _sync_timer;

  _register = function() {
    fully.bind('screenOn', 'LovelaceFullyKiosk.onScreenOn();');
    fully.bind('screenOff', 'LovelaceFullyKiosk.onScreenOff();');
    fully.bind('onMotion', 'LovelaceFullyKiosk.onMotion();');
    let hass = document.querySelector('home-assistant').hass;
    hass.connection.subscribeEvents((event)=> {
      if(event.data.domain === 'light' && event.data.service_data.entity_id.toString() === _screen) {
        switch(event.data.service) {
          case 'turn_on':
            fully.turnScreenOn();
            _screen_state = true;
            break;
          case 'turn_off':
            fully.turnScreenOff();
            _screen_state = false;
            break;
        }
        if(event.data.service_data.brightness)
          fully.setScreenBrightness(event.data.service_data.brightness);
      }
    }, 'call_service');
  };

  _sendScreenState = function() {
    let hass = document.querySelector('home-assistant').hass;
    let attr = Object.assign(hass.states[_screen].attributes, {
        brightness: fully.getScreenBrightness()*255/170,
        supported_features: 1,
        battery_level: fully.getBatteryLevel(),
        charging: fully.isPlugged(),
      });
    hass.callApi('post', "states/"+_screen, {
      state: _screen_state?'on':'off',
      attributes: attr,
    });
  }

  _sendMotionState = function() {
    clearTimeout(_sync_timer);
    let timeout = _motion_state?5000:10000;
    let hass = document.querySelector('home-assistant').hass;
    let attr = Object.assign(hass.states[_motion].attributes, {
        battery_level: fully.getBatteryLevel(),
        charging: fully.isPlugged(),
        device_class: 'motion',
    });
    hass.callApi('post', "states/"+_motion, {
      state: _motion_state?'on':'off',
      attributes: attr,
    });
    _sendScreenState();
    _sync_timer = setTimeout(() => {
      _motion_state = false;
      _sendMotionState(false);
    }, timeout);
  };

  return {
    bind: (device, screen, motion) => {
      if(!window['fully'])
        return;
      if(device != fully.getDeviceId()) { return; }
      if(!_active) {
        _active = true;
        _screen = screen;
        _screen_state = fully.getScreenOn();
        _motion = motion;
        _register();
        _sendMotionState();
      }
    },
    onScreenOn: () => {
      _screen_state = true;
      _sendScreenState();
    },
    onScreenOff: () => {
      _screen_state = false;
      _sendScreenState();
    },
    onMotion: () => {
      _motion_state = true;
      _sendMotionState();
    },
    debug: () => {
      let error = "OK. Everything should be working!";
      if(!navigator.userAgent.includes("Linux; Android"))
      {
        error = "ERROR! Are you really using Fully Kiosk Browser?.";
      } else if(!window["fully"]) {
        error = "ERROR! Are you using Fully Kiosk? Is Javascript Interface enabled?";
      } else if(!_active) {
        error = "ERROR! This device has not been bound to home-assistant. Device ID: " + fully.getDeviceId();
      } else {
        error = "OK. This device is bound to: " + _screen + " and " + _motion +".";
      }

      document.querySelector("home-assistant").shadowRoot.querySelector("home-assistant-main").shadowRoot.querySelector("app-drawer-layout iron-pages partial-panel-resolver").shadowRoot.querySelector("#panel ha-panel-lovelace").shadowRoot.querySelector("hui-root").shadowRoot.querySelector("ha-app-layout app-header app-toolbar div[main-title]").innerHTML = "lovelace-fullykiosk: " + error;
    },
  };
}());
