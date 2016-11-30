/**
 * Read Linux Inputs in node.js
 * Author: Daniel Risacher (dan@risacher.org)
 *
 * Adapted from keyboard.js by...
 * Author: William Petit (william.petit@lookingfora.name)
 *
 * Adapted from Tim Caswell's nice solution to read a linux joystick
 * http://nodebits.org/linux-joystick
 * https://github.com/nodebits/linux-joystick
 */

var fs = require('fs'),
//    ref = require('ref'),
    EventEmitter = require('events').EventEmitter;

var EV_SYN = 0,
    EV_KEY = 1,
    EV_REL = 2,
    EV_ABS = 3,
    EVENT_TYPES = ['keyup','keypress','keydown'];
   

function Mouse(dev) {
  this.wrap('onOpen');
  this.wrap('onRead');
  this.dev = dev;
  this.bufferSize = 24;
  this.buf = new Buffer(this.bufferSize);
  fs.open('/dev/input/' + this.dev, 'r', this.onOpen);
}

Mouse.prototype = Object.create(EventEmitter.prototype, {
  constructor: {value: Mouse}
});

Mouse.prototype.wrap = function(name) {
  var self = this;
  var fn = this[name];
  this[name] = function (err) {
    if (err) return self.emit('error', err);
    return fn.apply(self, Array.prototype.slice.call(arguments, 1));
  };
};

Mouse.prototype.onOpen = function(fd) {
  this.fd = fd;
  this.startRead();
};

Mouse.prototype.startRead = function() {
  fs.read(this.fd, this.buf, 0, this.bufferSize, null, this.onRead);
};

Mouse.prototype.onRead = function(bytesRead) {
  var event = parse(this, this.buf);
  if( event ) {
    event.dev = this.dev;
    this.emit(event.type, event);
  }
  if (this.fd) this.startRead();
};

Mouse.prototype.close = function(callback) {
  fs.close(this.fd, (function(){console.log(this);}));
  this.fd = undefined;
};


/**
 * Parse Input data
 */

function parse(input, buffer) {
    
    var event, value;
    var evtype = buffer.readUInt16LE(8)
//    console.log(buffer.toString('hex'), " ", buffer.length);
    if (process.arch === 'x64') {
	event = {
	    timeS: buffer.readUInt64LE(0),
	    timeMS: buffer.readUInt64LE(8),
	    type: buffer.readUInt16LE(16),
	    code: buffer.readUInt16LE(18),
	    value: buffer.readInt32LE(20),
		key: findKeyID(buffer.readUInt16LE(18))
	}; 
    } else { // arm or ia32
	event = {
	    timeS: buffer.readUInt32LE(0),
	    timeMS: buffer.readUInt32LE(4),
	    type: buffer.readUInt16LE(8),
	    code: buffer.readUInt16LE(10),
	    value: buffer.readInt32LE(12),
		key: findKeyID(buffer.readUInt16LE(10))
	};
    }
//    console.log(event);

    if( evtype === EV_KEY ) {
	
	
	event.keyId = BtnsIdx[event.code];
	event.type = EVENT_TYPES[ event.value ];
	
    } else if ( evtype === EV_REL ) {
	
	event.type = 'rel';
	event.axis = AxesIdx[event.code];

    } else if ( evtype === EV_ABS ) {

	event.axis = AxesIdx[event.value];
	event.type = 'abs';

    } else if (evtype === EV_SYN ) {
	event.type = 'syn';
    } else {
		return false;
    }
        
    return event;
}


/**
 * Find Key Id
 */

function findKeyID( keyCode ) {
	var key;
	for( key in Keys ) {
		if ( Keys.hasOwnProperty(key) ) {
			if( Keys[key]['code'] === keyCode ) {
				Keys[key]['key'] = key;
				return Keys[key];
			}
		}
	}
}


/*
 returns the input when no more data has been received in 100ms
 */

Mouse.prototype.data = function(callback) {
	var timeout = 0;
	var line = [];
	var endLine = function () {
		callback(toLine(line));
		line = [];
	};
	this.on('keypress', function(data){
		if(!data || !data['key']) return;
		if (timeout) {
			clearTimeout(timeout);
			timeout = 0;
		}
		line.push(data);
		timeout = setTimeout(function() {
			endLine();
		}, 100);
	});
};

function toLine(events){
	var res = '',shift = 0;
	for(var e in events){
		if(events[e]['key']['key'] == 'KEY_LEFTSHIFT' || events[e]['key']['key'] == 'KEY_RIGHTSHIFT') shift = 1;
		else{
			if(shift && events[e]['key']['s_ascii']){
				res += events[e]['key']['s_ascii'];
				shift = 0;
			}
			else if(events[e]['key']['ascii']) {
				res += events[e]['key']['ascii'];
				shift = 0;
			}
		}
	}
	return res;
}

// Btns
var Btns = {};

Btns["KEY_ESC"] = 1;
Btns["KEY_1"] = 2;
Btns["KEY_2"] = 3;
Btns["KEY_3"] = 4;
Btns["KEY_4"] = 5;
Btns["KEY_5"] = 6;
Btns["KEY_6"] = 7;
Btns["KEY_7"] = 8;
Btns["KEY_8"] = 9;
Btns["KEY_9"] = 10;
Btns["KEY_0"] = 11;
Btns["KEY_MINUS"] = 12;
Btns["KEY_EQUAL"] = 13;
Btns["KEY_BACKSPACE"] = 14;
Btns["KEY_TAB"] = 15;
Btns["KEY_Q"] = 16;
Btns["KEY_W"] = 17;
Btns["KEY_E"] = 18;
Btns["KEY_R"] = 19;
Btns["KEY_T"] = 20;
Btns["KEY_Y"] = 21;
Btns["KEY_U"] = 22;
Btns["KEY_I"] = 23;
Btns["KEY_O"] = 24;
Btns["KEY_P"] = 25;
Btns["KEY_LEFTBRACE"] = 26;
Btns["KEY_RIGHTBRACE"] = 27;
Btns["KEY_ENTER"] = 28;
Btns["KEY_LEFTCTRL"] = 29;
Btns["KEY_A"] = 30;
Btns["KEY_S"] = 31;
Btns["KEY_D"] = 32;
Btns["KEY_F"] = 33;
Btns["KEY_G"] = 34;
Btns["KEY_H"] = 35;
Btns["KEY_J"] = 36;
Btns["KEY_K"] = 37;
Btns["KEY_L"] = 38;
Btns["KEY_SEMICOLON"] = 39;
Btns["KEY_APOSTROPHE"] = 40;
Btns["KEY_GRAVE"] = 41;
Btns["KEY_LEFTSHIFT"] = 42;
Btns["KEY_BACKSLASH"] = 43;
Btns["KEY_Z"] = 44;
Btns["KEY_X"] = 45;
Btns["KEY_C"] = 46;
Btns["KEY_V"] = 47;
Btns["KEY_B"] = 48;
Btns["KEY_N"] = 49;
Btns["KEY_M"] = 50;
Btns["KEY_COMMA"] = 51;
Btns["KEY_DOT"] = 52;
Btns["KEY_SLASH"] = 53;
Btns["KEY_RIGHTSHIFT"] = 54;
Btns["KEY_KPASTERISK"] = 55;
Btns["KEY_LEFTALT"] = 56;
Btns["KEY_SPACE"] = 57;
Btns["KEY_CAPSLOCK"] = 58;
Btns["KEY_F1"] = 59;
Btns["KEY_F2"] = 60;
Btns["KEY_F3"] = 61;
Btns["KEY_F4"] = 62;
Btns["KEY_F5"] = 63;
Btns["KEY_F6"] = 64;
Btns["KEY_F7"] = 65;
Btns["KEY_F8"] = 66;
Btns["KEY_F9"] = 67;
Btns["KEY_F10"] = 68;
Btns["KEY_NUMLOCK"] = 69;
Btns["KEY_SCROLLLOCK"] = 70;
Btns["KEY_KP7"] = 71;
Btns["KEY_KP8"] = 72;
Btns["KEY_KP9"] = 73;
Btns["KEY_KPMINUS"] = 74;
Btns["KEY_KP4"] = 75;
Btns["KEY_KP5"] = 76;
Btns["KEY_KP6"] = 77;
Btns["KEY_KPPLUS"] = 78;
Btns["KEY_KP1"] = 79;
Btns["KEY_KP2"] = 80;
Btns["KEY_KP3"] = 81;
Btns["KEY_KP0"] = 82;
Btns["KEY_KPDOT"] = 83;
Btns["KEY_ZENKAKUHANKAKU"] = 85;
Btns["KEY_102ND"] = 86;
Btns["KEY_F11"] = 87;
Btns["KEY_F12"] = 88;
Btns["KEY_RO"] = 89;
Btns["KEY_KATAKANA"] = 90;
Btns["KEY_HIRAGANA"] = 91;
Btns["KEY_HENKAN"] = 92;
Btns["KEY_KATAKANAHIRAGANA"] = 93;
Btns["KEY_MUHENKAN"] = 94;
Btns["KEY_KPJPCOMMA"] = 95;
Btns["KEY_KPENTER"] = 96;
Btns["KEY_RIGHTCTRL"] = 97;
Btns["KEY_KPSLASH"] = 98;
Btns["KEY_SYSRQ"] = 99;
Btns["KEY_RIGHTALT"] = 100;
Btns["KEY_HOME"] = 102;
Btns["KEY_UP"] = 103;
Btns["KEY_PAGEUP"] = 104;
Btns["KEY_LEFT"] = 105;
Btns["KEY_RIGHT"] = 106;
Btns["KEY_END"] = 107;
Btns["KEY_DOWN"] = 108;
Btns["KEY_PAGEDOWN"] = 109;
Btns["KEY_INSERT"] = 110;
Btns["KEY_DELETE"] = 111;
Btns["KEY_MUTE"] = 113;
Btns["KEY_VOLUMEDOWN"] = 114;
Btns["KEY_VOLUMEUP"] = 115;
Btns["KEY_POWER"] = 116;
Btns["KEY_KPEQUAL"] = 117;
Btns["KEY_PAUSE"] = 119;
Btns["KEY_KPCOMMA"] = 121;
Btns["KEY_HANGUEL"] = 122;
Btns["KEY_HANJA"] = 123;
Btns["KEY_YEN"] = 124;
Btns["KEY_LEFTMETA"] = 125;
Btns["KEY_RIGHTMETA"] = 126;
Btns["KEY_COMPOSE"] = 127;
Btns["KEY_STOP"] = 128;
Btns["KEY_AGAIN"] = 129;
Btns["KEY_PROPS"] = 130;
Btns["KEY_UNDO"] = 131;
Btns["KEY_FRONT"] = 132;
Btns["KEY_COPY"] = 133;
Btns["KEY_OPEN"] = 134;
Btns["KEY_PASTE"] = 135;
Btns["KEY_FIND"] = 136;
Btns["KEY_CUT"] = 137;
Btns["KEY_HELP"] = 138;
Btns["KEY_F13"] = 183;
Btns["KEY_F14"] = 184;
Btns["KEY_F15"] = 185;
Btns["KEY_F16"] = 186;
Btns["KEY_F17"] = 187;
Btns["KEY_F18"] = 188;
Btns["KEY_F19"] = 189;
Btns["KEY_F20"] = 190;
Btns["KEY_F21"] = 191;
Btns["KEY_F22"] = 192;
Btns["KEY_F23"] = 193;
Btns["KEY_F24"] = 194;
Btns["KEY_UNKNOWN"] = 240;

//Btns['BTN_MISC'] =                0x100;
Btns['BTN_0'] =                   0x100;
Btns['BTN_1'] =                   0x101;
Btns['BTN_2'] =                   0x102;
Btns['BTN_3'] =                   0x103;
Btns['BTN_4'] =                   0x104;
Btns['BTN_5'] =                   0x105;
Btns['BTN_6'] =                   0x106;
Btns['BTN_7'] =                   0x107;
Btns['BTN_8'] =                   0x108;
Btns['BTN_9'] =                   0x109;

Btns['BTN_MOUSE'] =               0x110;
Btns['BTN_LEFT'] =                0x110;
Btns['BTN_RIGHT'] =               0x111;
Btns['BTN_MIDDLE'] =              0x112;
Btns['BTN_SIDE'] =                0x113;
Btns['BTN_EXTRA'] =               0x114;
Btns['BTN_FORWARD'] =             0x115;
Btns['BTN_BACK'] =                0x116;
Btns['BTN_TASK'] =                0x117;

Btns['BTN_JOYSTICK'] =            0x120;
Btns['BTN_TRIGGER'] =             0x120;
Btns['BTN_THUMB'] =               0x121;
Btns['BTN_THUMB2'] =              0x122;
Btns['BTN_TOP'] =                 0x123;
Btns['BTN_TOP2'] =                0x124;
Btns['BTN_PINKIE'] =              0x125;
Btns['BTN_BASE'] =                0x126;
Btns['BTN_BASE2'] =               0x127;
Btns['BTN_BASE3'] =               0x128;
Btns['BTN_BASE4'] =               0x129;
Btns['BTN_BASE5'] =               0x12a;
Btns['BTN_BASE6'] =               0x12b;
Btns['BTN_DEAD'] =                0x12f;

Btns['BTN_GAMEPAD'] =             0x130;
Btns['BTN_A'] =                   0x130;
Btns['BTN_B'] =                   0x131;
Btns['BTN_C'] =                   0x132;
Btns['BTN_X'] =                   0x133;
Btns['BTN_Y'] =                   0x134;
Btns['BTN_Z'] =                   0x135;
Btns['BTN_TL'] =                  0x136;
Btns['BTN_TR'] =                  0x137;
Btns['BTN_TL2'] =                 0x138;
Btns['BTN_TR2'] =                 0x139;
Btns['BTN_SELECT'] =              0x13a;
Btns['BTN_START'] =               0x13b;
Btns['BTN_MODE'] =                0x13c;
Btns['BTN_THUMBL'] =              0x13d;
Btns['BTN_THUMBR'] =              0x13e;

Btns['BTN_DIGI'] =                0x140;
Btns['BTN_TOOL_PEN'] =            0x140;
Btns['BTN_TOOL_RUBBER'] =         0x141;
Btns['BTN_TOOL_BRUSH'] =          0x142;
Btns['BTN_TOOL_PENCIL'] =         0x143;
Btns['BTN_TOOL_AIRBRUSH'] =       0x144;
Btns['BTN_TOOL_FINGER'] =         0x145;
Btns['BTN_TOOL_MOUSE'] =          0x146;
Btns['BTN_TOOL_LENS'] =           0x147;
Btns['BTN_TOOL_QUINTTAP'] =       0x148;   /* Five fingers on trackpad */
Btns['BTN_TOUCH'] =               0x14a;
Btns['BTN_STYLUS'] =              0x14b;
Btns['BTN_STYLUS2'] =             0x14c;
Btns['BTN_TOOL_DOUBLETAP'] =      0x14d;
Btns['BTN_TOOL_TRIPLETAP'] =      0x14e;
Btns['BTN_TOOL_QUADTAP'] =        0x14f;   /* Four fingers on trackpad */

Btns['BTN_WHEEL'] =               0x150;
Btns['BTN_GEAR_DOWN'] =           0x150;
Btns['BTN_GEAR_UP'] =             0x151;

var Keys = Btns;

Keys["KEY_ESC"] = {
	code: 1,
	ascii: 27
};
Keys["KEY_1"] = {
	code: 2,
	ascii: '1',
	s_ascii: '!'
};
Keys["KEY_2"] = {
	code: 3,
	ascii: '2',
	s_ascii: '@'
};
Keys["KEY_3"] = {
	code: 4,
	ascii: '3',
	s_ascii: '#'
};
Keys["KEY_4"] = {
	code: 5,
	ascii: '4',
	s_ascii: '$'
};
Keys["KEY_5"] = {
	code: 6,
	ascii: '5',
	s_ascii: '%'
};
Keys["KEY_6"] = {
	code: 7,
	ascii: '6',
	s_ascii: '^'
};
Keys["KEY_7"] = {
	code: 8,
	ascii: '7',
	s_ascii: '&'
};
Keys["KEY_8"] = {
	code: 9,
	ascii: '8',
	s_ascii: '*'
};
Keys["KEY_9"] = {
	code: 10,
	ascii: '9',
	s_ascii: '('
};
Keys["KEY_0"] = {
	code: 11,
	ascii: '0',
	s_ascii: ')'
};
Keys["KEY_MINUS"] = {
	code: 12,
	ascii: '-',
	s_ascii: '_'
};
Keys["KEY_EQUAL"] = {
	code: 13,
	ascii: '=',
	s_ascii: '+'
};
Keys["KEY_BACKSPACE"] = {
	code: 14,
	ascii: 8
};
Keys["KEY_TAB"] = {
	code: 15,
	ascii: 9
};
Keys["KEY_Q"] = {
	code: 16,
	ascii: 'q',
	s_ascii: 'Q'
};
Keys["KEY_W"] = {
	code: 17,
	ascii: 'w',
	s_ascii: 'W'
};
Keys["KEY_E"] = {
	code: 18,
	ascii: 'e',
	s_ascii: 'E'
};
Keys["KEY_R"] = {
	code: 19,
	ascii: 'r',
	s_ascii: 'R'
};
Keys["KEY_T"] = {
	code: 20,
	ascii: 't',
	s_ascii: 'T'
};
Keys["KEY_Y"] = {
	code: 21,
	ascii: 'y',
	s_ascii: 'Y'
};
Keys["KEY_U"] = {
	code: 22,
	ascii: 'u',
	s_ascii: 'U'
};
Keys["KEY_I"] = {
	code: 23,
	ascii: 'i',
	s_ascii: 'I'
};
Keys["KEY_O"] = {
	code: 24,
	ascii: 'o',
	s_ascii: 'O'
};
Keys["KEY_P"] = {
	code: 25,
	ascii: 'p',
	s_ascii: 'P'
};
Keys["KEY_LEFTBRACE"] = {
	code: 26,
	ascii: '[',
	s_ascii: '{'
};
Keys["KEY_RIGHTBRACE"] = {
	code: 27,
	ascii: ']',
	s_ascii: '}'
};
Keys["KEY_ENTER"] = {
	code: 28,
	ascii: 13
};
Keys["KEY_LEFTCTRL"] = {
	code: 13
};
Keys["KEY_A"] = {
	code: 30,
	ascii: 'a',
	s_ascii: 'A'
};
Keys["KEY_S"] = {
	code: 31,
	ascii: 's',
	s_ascii: 'S'
};
Keys["KEY_D"] = {
	code: 32,
	ascii: 'd',
	s_ascii: 'D'
};
Keys["KEY_F"] = {
	code: 33,
	ascii: 'f',
	s_ascii: 'F'
};
Keys["KEY_G"] = {
	code: 34,
	ascii: 'g',
	s_ascii: 'G'
};
Keys["KEY_H"] = {
	code: 35,
	ascii: 'h',
	s_ascii: 'H'
};
Keys["KEY_J"] = {
	code: 36,
	ascii: 'j',
	s_ascii: 'J'
};
Keys["KEY_K"] = {
	code: 37,
	ascii: 'k',
	s_ascii: 'K'
};
Keys["KEY_L"] = {
	code: 38,
	ascii: 'l',
	s_ascii: 'L'
};
Keys["KEY_SEMICOLON"] = {
	code: 39,
	ascii: ';',
	s_ascii: ':'
};
Keys["KEY_APOSTROPHE"] = {
	code: 40,
	ascii: '\'',
	s_ascii: '\"'
};
Keys["KEY_GRAVE"] = {
	code: 41,
	ascii: '`',
	s_ascii: '~'
};
Keys["KEY_LEFTSHIFT"] = {
	code: 42
};
Keys["KEY_BACKSLASH"] = {
	code: 43,
	ascii: '\\',
	s_ascii: '|'
};
Keys["KEY_Z"] = {
	code: 44,
	ascii: 'z',
	s_ascii: 'Z'
};
Keys["KEY_X"] = {
	code: 45,
	ascii: 'x',
	s_ascii: 'X'
};
Keys["KEY_C"] = {
	code: 46,
	ascii: 'c',
	s_ascii: 'C'
};
Keys["KEY_V"] = {
	code: 47,
	ascii: 'v',
	s_ascii: 'V'
};
Keys["KEY_B"] = {
	code: 48,
	ascii: 'b',
	s_ascii: 'B'
};
Keys["KEY_N"] = {
	code: 49,
	ascii: 'n',
	s_ascii: 'N'
};
Keys["KEY_M"] = {
	code: 50,
	ascii: 'm',
	s_ascii: 'M'
};
Keys["KEY_COMMA"] = {
	code: 51,
	ascii: ',',
	s_ascii: '<'
};
Keys["KEY_DOT"] = {
	code: 42,
	ascii: '.',
	s_ascii: '>'
};
Keys["KEY_SLASH"] = {
	code: 53,
	ascii: '/',
	s_ascii: '?'
};
Keys["KEY_RIGHTSHIFT"] = {
	code: 54
};
Keys["KEY_KPASTERISK"] = {
	code: 55
};
Keys["KEY_LEFTALT"] = {
	code: 46
};
Keys["KEY_SPACE"] = {
	code: 57,
	ascii: ' '
};
Keys["KEY_CAPSLOCK"] = {
	code: 58
};
Keys["KEY_F1"] = {
	code: 59
};
Keys["KEY_F2"] = {
	code: 60
};
Keys["KEY_F3"] = {
	code: 61
};
Keys["KEY_F4"] = {
	code: 62
};
Keys["KEY_F5"] = {
	code: 63
};
Keys["KEY_F6"] = {
	code: 64
};
Keys["KEY_F7"] = {
	code: 65
};
Keys["KEY_F8"] = {
	code: 66
};
Keys["KEY_F9"] = {
	code: 67
};
Keys["KEY_F10"] = {
	code: 68
};
Keys["KEY_NUMLOCK"] = {
	code: 69
};
Keys["KEY_SCROLLLOCK"] = {
	code: 70
};
Keys["KEY_KP7"] = {
	code: 71
};
Keys["KEY_KP8"] = {
	code: 72
};
Keys["KEY_KP9"] = {
	code: 73
};
Keys["KEY_KPMINUS"] = {
	code: 74
};
Keys["KEY_KP4"] = {
	code: 75
};
Keys["KEY_KP5"] = {
	code: 76
};
Keys["KEY_KP6"] = {
	code: 77
};
Keys["KEY_KPPLUS"] = {
	code: 78
};
Keys["KEY_KP1"] = {
	code: 79
};
Keys["KEY_KP2"] = {
	code: 80
};
Keys["KEY_KP3"] = {
	code: 81
};
Keys["KEY_KP0"] = {
	code: 82
};
Keys["KEY_KPDOT"] = {
	code: 83
};
Keys["KEY_ZENKAKUHANKAKU"] = {
	code: 85
};
Keys["KEY_102ND"] = {
	code: 86
};
Keys["KEY_F11"] = {
	code: 87
};
Keys["KEY_F12"] = {
	code: 88
};
Keys["KEY_RO"] = {
	code: 89
};
Keys["KEY_KATAKANA"] = {
	code: 90
};
Keys["KEY_HIRAGANA"] = {
	code: 91
};
Keys["KEY_HENKAN"] = {
	code: 92
};
Keys["KEY_KATAKANAHIRAGANA"] = {
	code: 93
};
Keys["KEY_MUHENKAN"] = {
	code: 94
};
Keys["KEY_KPJPCOMMA"] = {
	code: 95
};
Keys["KEY_KPENTER"] = {
	code: 96
};
Keys["KEY_RIGHTCTRL"] = {
	code: 97
};
Keys["KEY_KPSLASH"] = {
	code: 98
};
Keys["KEY_SYSRQ"] = {
	code: 99
};
Keys["KEY_RIGHTALT"] = {
	code: 100
};
Keys["KEY_HOME"] = {
	code: 102
};
Keys["KEY_UP"] = {
	code: 103
};
Keys["KEY_PAGEUP"] = {
	code: 104
};
Keys["KEY_LEFT"] = {
	code: 105
};
Keys["KEY_RIGHT"] = {
	code: 106
};
Keys["KEY_END"] = {
	code: 107
};
Keys["KEY_DOWN"] = {
	code: 108
};
Keys["KEY_PAGEDOWN"] = {
	code: 109
};
Keys["KEY_INSERT"] = {
	code: 110
};
Keys["KEY_DELETE"] = {
	code: 111
};
Keys["KEY_MUTE"] = {
	code: 113
};
Keys["KEY_VOLUMEDOWN"] = {
	code: 114
};
Keys["KEY_VOLUMEUP"] = {
	code: 115
};
Keys["KEY_POWER"] = {
	code: 116
};
Keys["KEY_KPEQUAL"] = {
	code: 117
};
Keys["KEY_PAUSE"] = {
	code: 119
};
Keys["KEY_KPCOMMA"] = {
	code: 121
};
Keys["KEY_HANGUEL"] = {
	code: 122
};
Keys["KEY_HANJA"] = {
	code: 123
};
Keys["KEY_YEN"] = {
	code: 124
};
Keys["KEY_LEFTMETA"] = {
	code: 125
};
Keys["KEY_RIGHTMETA"] = {
	code: 126
};
Keys["KEY_COMPOSE"] = {
	code: 127
};
Keys["KEY_STOP"] = {
	code: 128
};
Keys["KEY_AGAIN"] = {
	code: 129
};
Keys["KEY_PROPS"] = {
	code: 130
};
Keys["KEY_UNDO"] = {
	code: 131
};
Keys["KEY_FRONT"] = {
	code: 132
};
Keys["KEY_COPY"] = {
	code: 133
};
Keys["KEY_OPEN"] = {
	code: 134
};
Keys["KEY_PASTE"] = {
	code: 135
};
Keys["KEY_FIND"] = {
	code: 136
};
Keys["KEY_CUT"] = {
	code: 137
};
Keys["KEY_HELP"] = {
	code: 138
};
Keys["KEY_F13"] = {
	code: 183
};
Keys["KEY_F14"] = {
	code: 184
};
Keys["KEY_F15"] = {
	code: 185
};
Keys["KEY_F16"] = {
	code: 186
};
Keys["KEY_F17"] = {
	code: 187
};
Keys["KEY_F18"] = {
	code: 188
};
Keys["KEY_F19"] = {
	code: 189
};
Keys["KEY_F20"] = {
	code: 190
};
Keys["KEY_F21"] = {
	code: 191
};
Keys["KEY_F22"] = {
	code: 192
};
Keys["KEY_F23"] = {
	code: 193
};
Keys["KEY_F24"] = {
	code: 194
};
Keys["KEY_UNKNOWN"] = {
	code: 240
};


var BtnsIdx = {};
for( key in Btns ) {
    if ( Btns.hasOwnProperty(key) ) {
	BtnsIdx[Btns[key]] = key;
    }
}

Mouse.Btns = Btns;
Mouse.BtnsIdx = BtnsIdx;

Axes = {};

Axes['REL_X'] =                   0x00;
Axes['REL_Y'] =                   0x01;
Axes['REL_Z'] =                   0x02;
Axes['REL_RX'] =                  0x03;
Axes['REL_RY'] =                  0x04;
Axes['REL_RZ'] =                  0x05;
Axes['REL_HWHEEL'] =              0x06;
Axes['REL_DIAL'] =                0x07;
Axes['REL_WHEEL'] =               0x08;
Axes['REL_MISC'] =                0x09;

AxesIdx = {};
for( key in Axes ) {
    if ( Axes.hasOwnProperty(key) ) {
	AxesIdx[Axes[key]] = key;
    }
}


Mouse.Axes = Axes;
Mouse.AxesIdx = AxesIdx;

module.exports = exports = Mouse;


/*
var k = new Mouse('event0');
k.on('keyup', console.log);
k.on('keydown', console.log);
k.on('keypress', console.log);
k.on('rel', console.log);
k.on('abs', console.log);
*/