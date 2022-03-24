var path = require('path');
var fs   = require('fs');

module.exports = class CarrierPigeon {
  [key:string]:any;
  env:boolean;
  options:any;
  defaults:any;
  envMap:any;
  flags:any;
  mode:string;

  constructor(options:any={}) {
    Object.assign(this, options);

    if (this.strict == undefined) {
      this.strict = false;
    }

    this.reset();
  }

  reset() {
    if (this.env == undefined) {
      this.env = true;
    }

    if (this.cmds == undefined) {
      this.cmds = [];
    }

    if (this.options == undefined) {
      this.options = {};
    }

    if (this.defaults == undefined) {
      this.defaults = {};
    }

    if (this.envMap == undefined) {
      this.envMap = {};
    }

    if (this.flags == undefined) {
      this.flags = {};
    }
  }

  cast(type:string, value:any) {
    switch(type) {
      case 'number':
	return Number(value);
      case 'file':
	return path.resolve(value);
      default:	
        return value;
    }
  }

  determineType(name:string) {
    if (this.options[name].type != undefined) {
      this.options[name].type = this.options[name].type;
    } else if (this.options[name].default != undefined) {
      if (this.options[name].default instanceof Array) {
	this.options[name].type = 'array';
      } else {
	this.options[name].type = (typeof this.options[name].default);
      }
    }

    if (this.options[name].type == undefined) {
      this.options[name].type = 'string';
    }
  }

  command(cmd:string) {
    this.cmds.push(cmd);
  }

  commands(...cmds:string[]) {
    this.cmds = cmds;
  }

  option(name:string, options:any={}) {
    var self = this;
    options.variable = name;
    this.options[name] = options;

    this.determineType(name); 

    if (options.default != undefined) {
      this.defaults[name] = options.default;
    }
    
    if (options.env != undefined) {
      this.envMap[name] = options.env;
    }

    if (options.flags != undefined) {
      options.flags.forEach((flag:string) => {
	self.flags[flag] = name;
      });
    } else {
      var initial = name.substring(0,1)
      self.flags[`--${name}`] = name;
      if (self.flags[`-${initial}`] == undefined) {
	self.flags[`-${initial}`] = name;
      }
    }   
  }

  negators() {
    return [
      '--no-', 
      '--not-'
    ];
  }

  negated(word:string) {
    return this.negators().map((neg:string) => { 
      return [neg, word].join('');
    });
  }
  
  isNegated(word:string) {
    return this.negators().map((neg:string) => { 
      return word.indexOf(neg) == -1; 
    }).indexOf(false) > -1
  }

  unnegate(word:string) {
    return this.negators().reduce((array:any[], neg:string) => {
      if (word.indexOf(neg) > -1) {
        array.push(word.replace(neg, ''));
      }
      return array;
    }, [])[0]
  }

  deflag(flag:string) {
    if (/--.+/.test(flag)) {
      return flag.replace('--', '');
    } else {
      return flag.replace('-', '');
    }
  }

  isFlag(input:string) {
    return /-.+/.test(input);
  }

  isBoolean(flag:string) {
    if (this.existing(flag)) {
      return this.options[this.flag(flag)].type == 'boolean';
    } else {
      return false;
    }
  }

  flag(flag:string) {
    return this.flags[flag];
  }

  variable(flag:string) {
    return this.options[this.flags[flag]];
  }

  existing(flag:string) {
    return this.flags[flag] != undefined;
  }

  countFlags(instances:any, name:string) {
    if (instances[name] == undefined) {
      instances[name] = 0;
    }
    instances[name] = instances[name] + 1;
    return instances;
  }

  reflag(word:string) {
    return ['--', word].join('')
  }

  parse(argv:any[]=[]) {
    var self    = this;
    var index   = 0;
    var options = JSON.parse(JSON.stringify(this.defaults));
    var mode    = 'cull';
    var instances:any = {};

    var current:any;
    
    while(index <= argv.length-1) {
      if (mode == 'cull') {
        if (self.isFlag(argv[index])) {
	  mode = 'interpret';
	} else if (self.cmds.indexOf(argv[index]) > -1) {
	  options.command = argv[index];
	  argv.shift();
	} else {
	  argv.shift();
	}
      }
      
      if (mode == 'interpret') {
	current   = argv[index];
        instances = self.countFlags(instances, current);

	if (self.isNegated(current) && 
	   (self.isBoolean(self.reflag(self.unnegate(current))) || self.strict == false)) {
	  
	  options[self.unnegate(current)] = false;
	  current = undefined;
	} else if (self.isBoolean(current) || 
          (self.strict == false && self.existing(current) == false)) {
	 
	  options[self.deflag(current)] = true;
	} else if (self.existing(current)) {
	  index = index + 1;
	  var value = argv[index];
	  options = self.set(options, current, value, instances[current]);
	}

	index = index + 1;
      }
    }
  
    if (this.env) { 
      this.forEnv(options);
    }

    return options;
  }

  isAnArray(options:any, flag:string) {
    return (options[this.flag(flag)] instanceof Array);
  }

  isntAnArray(options:any, flag:string) {
    return this.isAnArray(options, flag) == false;
  }

  currentIsDefault(count:number) {
    return (count == 1);
  }

  shouldBeArray(flag:string) {
    return this.variable(flag).type == 'array';
  }

  shouldConvertToArray(options:any, flag:string, count:number) {
    return (this.isntAnArray(options, flag) && count == 2);
  }

  set(options:any, flag:string, value:any, count:number) {
    var self = this;

    if (self.shouldBeArray(flag) || 
        (self.isAnArray(options, flag) && self.strict == false) || 
        (self.shouldConvertToArray(options, flag, count) && self.strict == false)) {

      if (self.shouldConvertToArray(options, flag, count)) {
	options[self.flag(flag)] = [options[self.flag(flag)]];
      }

      if (this.currentIsDefault(count) && 
	 (this.shouldBeArray(flag) || this.isAnArray(options, flag))) {
         
	options[self.flag(flag)] = [];
      }

      options[self.flag(flag)].push(self.cast(this.variable(flag).type, value));
    } else {
      options[self.flag(flag)] = self.cast(this.variable(flag).type, value);
    }
    
    return options;
  }

  toEnv(json:string) {
    if (typeof json == 'string') {
      json = require(path.resolve(json));
    }

    Object.assign(process.env, json)
  }

  forEnv(gathered:any={}) {
    var self = this;
    Object.keys(this.envMap).forEach((variable) => {
      if (gathered[variable] != undefined) {
        process.env[self.envMap[variable]] = gathered[variable];
      }
    })
  }

}
