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
  };

  _syncState = function(screen_changed) {
    clearTimeout(_sync_timer);
    let hass = document.querySelector('home-assistant').hass;
    if(_motion_state_last != _motion_state)
    {
      _motion_state_last = _motion_state;
      hass.callApi('post', "states/"+_motion, {state: _motion_state?'on':'off'});
    }
    if(screen_changed) {
      if(_screen_state_last != _screen_state)
      {
        _screen_state_last = _screen_state;
        let service = _screen_state ? 'turn_on':'turn_off';
        hass.callService('homeassistant', service, {entity_id: _screen});
      }
    } else {
      _screen_state = hass.states[_screen].state == "on"?true:false;
      if(_screen_state)
        fully.turnScreenOn();
      else
        fully.turnScreenOff();
    }
    _sync_timer = setTimeout(() => {
      _motion_state = false;
      _syncState(false);
    }, 5000);
  };

  return {
    bind: (device, screen, motion) => {
      if(device != fully.getDeviceId()) { return; }
      if(!_active) {
        _active = true;
        _screen = screen;
        _motion = motion;
        _register();
        _syncState(true);
      }
    },
    onScreenOn: () => {
      _screen_state = true;
      _syncState(true);
    },
    onScreenOff: () => {
      _screen_state = false;
      _syncState(true);
    },
    onMotion: () => {
      _motion_state = true;
      _syncState(true);
    }
  };
}());
