var FullyKiosk = FullyKiosk || (function() {
  if(!window['fully'])
    return { bind : (device, screen, motion) => {} };

  var _active = false
  var _screen;
  var _screen_state = fully.getScreenOn();
  var _screen_state_last = !_screen_state;
  var _motion;
  var _motion_state = false;
  var _motion_state_last = !_motion_state;
  var _sync_timer;

  _register = function() {
    fully.bind('screenOn', 'FullyKiosk.onScreenOn();');
    fully.bind('screenOff', 'FullyKiosk.onScreenOff();');
    fully.bind('onMotion', 'FullyKiosk.onMotion();');
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
    hass.callApi('post', "states/"+_screen, {
      state: _screen_state?'on':'off',
      attributes: {
        brightness: fully.getScreenBrightness()*255/170,
        supported_features: 1,
        battery_level: fully.getBatteryLevel(),
        charging: fully.isPlugged(),
      },
    });
  }

  _sendMotionState = function() {
    clearTimeout(_sync_timer);
    let timeout = _motion_state?5000:10000;
    let hass = document.querySelector('home-assistant').hass;
    hass.callApi('post', "states/"+_motion, {
      state: _motion_state?'on':'off',
      attributes: {
        battery_level: fully.getBatteryLevel(),
        charging: fully.isPlugged(),
      },
    });
    _sendScreenState();
    _sync_timer = setTimeout(() => {
      _motion_state = false;
      _sendMotionState(false);
    }, timeout);
  };

  return {
    bind: (device, screen, motion) => {
      if(device != fully.getDeviceId()) { return; }
      if(!_active) {
        _active = true;
        _screen = screen;
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
    }
  };
}());
