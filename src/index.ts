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

  command(cmd:any) {
    if (typeof cmd == 'string') {
      cmd = {name: cmd}
    }
    this.cmds.push(cmd);
  }

  commands(...cmds:any[]) {
    cmds = cmds.map((cmd:any) => {
      if (typeof cmd == 'string') {
	cmd = {name: cmd}
      }
      return cmd;
    })
    this.cmds = cmds;
  }

  dashedLine(length=80) {
    return Array(length).join('-');
  }

  longest(list:any, name:string) {
    var length = 0;
    for (var i = 0; i < list.length; i++) {
      var command = list[i];
      if (length < list[i][name].length) {
	length = list[i][name].length;
      }
    }
    return length;
  }

  getColumnSizes(keys:any[]) {
    var widest = {type: 0, flags: 0, names: 0};
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var type = (this.options[key].type == 'boolean' ? '' : `<${this.options[key].type}>`);
      var flags = this.options[key].flags.join(', ')
      if (widest.type < type.length) {
	widest.type = type.length;
      }
      if (widest.flags < flags.length) {
	widest.flags = flags.length;
      }
      if (widest.names < key.length) {
	widest.names = key.length;
      }
    }
    return widest; 
  }

  usage() {
    //var self = this;
    var entries = [];
    var keys = Object.keys(this.options);

    if (this.cmds.length > 0) {  
      entries.push(this.dashedLine(80))
      var widestName = this.longest(this.cmds, 'name');
      
      for (var i = 0; i < this.cmds.length; i++) {  
	var command = this.cmds[i];
	var entry = [
	  '  ',
	  this.column({
	    string: this.cmds[i].name,
	    width: widestName+15,
	    align: 'left'
	  })
	]

	if (this.cmds[i].description != undefined) {
	  entry.push(this.multilineColumn({
	    text: this.cmds[i].description,
	    width: 50-widestName,
	    padding: widestName+16
	  }))
	  if (this.cmds[i].description.length > 40) {
	    entry.push("\n")
	  }
	}
        entries.push(entry.join(''));
      }
      entries.push(this.dashedLine(80))
    }

    var widest = this.getColumnSizes(keys);   
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var type = (this.options[key].type == 'boolean' ? '' : `<${this.options[key].type}>`);
      var flags = this.options[key].flags.join(', ')
      var padding = (widest.type+widest.flags+9)
      entries.push([
	' ',
	this.column({
	  string: this.options[key].flags.join(', '),
	  width: widest.flags+3,
	  align: 'left'
	}),
	this.column({
	  string: type,
	  width: widest.type+3,
	  align: 'left'
	}),
	this.column({
	  string: key,
	  width: widest.names+3,
	  align: 'left'
	}),
	this.multilineColumn({
	  text: this.options[key].description,
	  width: padding-5,
	  padding: padding+7
	})
      ].join(''));
    }
    return entries;
  }

  printUsage() {
    console.log(this.usage().join("\n"))
    console.log();
  }

  column(options:any) {
    var stringLen = options.string.length
    var difference = options.width - stringLen;
    var padding = Array(difference).join(' ');
    if (options.align == 'left') {
      return [options.string, padding].join('')
    } else if (options.align == 'right'){
      return [padding, options.string].join('')
    }
  }

  multilineColumn(options:any) {
    var first = true;
    var words = options.text.split(' ');

    function addLine(collection:any, line:string, firstLine:boolean) {
      if (firstLine) {
	collection.text.push(line);
      } else {
	collection.text.push([Array(options.padding+1).join(' '), line].join(''))
      }
      return collection;
    }

    return words.reduce((collection:any, word:string, index:number) => {
      var willBeLonger = (collection.line.join(" ").length + word.length+1) > options.width;

      if (willBeLonger) {
	var line = collection.line.join(' ')
	collection.line = [word];
	collection = addLine(collection, line, first);
	first = false;
      } else {
        collection.line.push(word)
      }

      if (words.length == index+1) {
        collection = addLine(collection, collection.line.join(' '), first)
      }

      return collection;
    }, {text: [], line: []}).text.join("\n")
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
      if (self.flags[`-${initial}`] == undefined) {
	self.flags[`-${initial}`] = name;
      }

      self.flags[`--${name}`] = name;
      self.options[name].flags = [`-${initial}`, `--${name}`];
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
    if (/^--.+/.test(flag)) {
      if (this.strict || this.flags[flag] != undefined) {
	return this.flags[flag]
      } else {
	return flag.replace('--', '')
      }
    } else {
      return this.flags[flag]
    }
  }

  isFlag(input:string) {
    return /^-.+/.test(input);
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
	} else if (self.cmds.map((cmd:any) => { return cmd.name }).indexOf(argv[index]) > -1) {
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
