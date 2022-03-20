var path        = require('path');
var assert      = require('assert');
var CarrierPigeon = require(path.join(__dirname, '..'));

describe('CarrierPigeon', () => {
  it('checking command that keeps failing', () => {
    const parser = new CarrierPigeon({strict: true});
    parser.option('symbols', {default: ["BAT-USDC"], type: 'array'})
    parser.option('verbose', {default: true})
    parser.option('sandbox', { default: true });
    parser.option('key', { default: 'key' });
    parser.option('secret', { default: 'secret' });
    parser.option('passphrase', { default: 'passphrase' })

    var options = parser.parse(['node', 'collection/', '-s', 'BTC-USD', '-s', 'ETH-BTC'])

    assert.equal(process.env.NODE_ENV, 'production')
    assert.equal(options.verbose, true)
  });
  

  it('checking strict (normal setting)', () => {
    const parser = new CarrierPigeon({strict: true});
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('verbose', {default: false})
    var options = parser.parse([
      'node','bin/parser.js',
      "--chunk-bacon"
    ])
    assert.equal(options['chunky-bacon'], undefined)

    parser.reset();
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('chunky-bacon', {default: true})
    parser.option('verbose', {default: false})
    var options = parser.parse([
      'node','bin/parser.js',
      "--no-chunky-bacon"
    ])
    assert.equal(options['chunky-bacon'], false)

    parser.reset();
    parser.strict = false;
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('verbose', {default: false})
    var options = parser.parse([
      'node','bin/parser.js',
      "--chunky-bacon"
    ])
    assert.equal(options['chunky-bacon'], true)

    parser.reset();
    parser.strict = false;
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('verbose', {default: false})
    var options = parser.parse([
      'node','bin/parser.js',
      "--no-chunky-bacon"
    ])
    assert.equal(options['chunky-bacon'], false)
  });

  it('checking with just verbose', () => {
    const parser = new CarrierPigeon();
    
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('speed', {type: 'number'})
    parser.option('version')
    parser.option('verbose', {default: false})

    var options = parser.parse(['node','bin/parser.js',"--verbose"])
    assert.equal(process.env.NODE_ENV, 'development')
    assert.equal(options.verbose, true)
  });
 
  it('checking with custom flag', () => {
    const parser = new CarrierPigeon();
    
    parser.option('env', {default: "development", env: "NODE_ENV", flags: ['--big-momma', '-bm']})
    parser.option('speed')
    parser.option('version')

    var options = parser.parse([
      'node','bin/parser.js',
      "--verbose", 
      '--big-momma', 'sandbox'
    ])
    assert.equal(options.verbose, true)
    assert.equal(process.env.NODE_ENV, 'sandbox')

    var options = parser.parse([
      'node','bin/parser.js',
      "--verbose", 
      '-bm', 'production'
    ])
    assert.equal(options.verbose, true)
    assert.equal(process.env.NODE_ENV, 'production')
  });

  it('checking with non existent flags', () => {
    const parser = new CarrierPigeon();
    
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('speed')
    parser.option('version')

    var options = parser.parse([
      'node','bin/parser.js',
      "--not-verbose"
    ])

    assert.equal(options.verbose, false)
    assert.equal(process.env.NODE_ENV, 'development')

    var options = parser.parse([
      'node','bin/parser.js',
      "--verbose"
    ])
    assert.equal(options.verbose, true)
  });
  
  it('checking with negated verbose', () => {
    const parser = new CarrierPigeon();
    
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('speed')
    parser.option('version')
    parser.option('verbose', {default: false, type: 'boolean'})

    var options = parser.parse([
      'node','bin/parser.js',
      "--not-verbose"
    ])
    assert.equal(process.env.NODE_ENV, 'development')
  });
  
  it('checking sandbox', () => {
    const parser = new CarrierPigeon();
    
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('speed')
    parser.option('sandbox', {type: 'boolean'})
    parser.option('verbose', {default: false})

    var options = parser.parse([
      'node','bin/parser.js',
      "--sandbox"
    ])
    assert.equal(process.env.NODE_ENV, 'development')
  
    var options = parser.parse([
      'node','bin/parser.js',
      "--sandbox", 
      '--env', 'production'
    ])
    assert.equal(options.sandbox, true)
    assert.equal(process.env.NODE_ENV, 'production')
    
    var options = parser.parse([
      'node','bin/parser.js',
      "--not-sandbox"
    ])
    assert.equal(options.sandbox, false)
    assert.equal(process.env.NODE_ENV, 'development')
  });

  it('checking file variable', () => {
    const parser = new CarrierPigeon();
    
    parser.option('env', {default: 'development', env: 'NODE_ENV'})
    parser.option('file', {type: 'file'})
    parser.option('speed', {type: 'number'})
    parser.option('log', {default: '/project/log'})
    parser.option('verbose', {default: false})


    var options = parser.parse([
      'node','bin/parser.js', "--verbose", 
      '-e', 'production', 
      '--no-log', 
      '-f', 'index'
    ])

    assert.equal(process.env.NODE_ENV, 'production')
    assert.equal(options.file, path.join(__dirname, '..', '..','index'))
    assert.equal(options.log, false)

    var options = parser.parse([
      'node','bin/parser.js',"--verbose", 
      '-e', 'production', 
      '--log', 'test', 
      '-f', 'index'
    ])
    
    assert.equal(process.env.NODE_ENV, 'production')
    assert.equal(options.file, path.join(__dirname, '..', '..','index'))
    assert.equal(options.log, 'test')
  });

  it('checking with env variable', () => {
    const parser = new CarrierPigeon();
    
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('speed', {type: 'number'})
    parser.option('version')
    parser.option('verbose', {default: false})

    var options = parser.parse([
      'node','bin/parser.js',"--verbose", 
      '-e', 'production', 
      '-s', '30'
    ])
    assert.equal(process.env.NODE_ENV, 'production')
    assert.equal(options.speed, 30)
  });

  it('checking array', () => {
    const parser = new CarrierPigeon();
    
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('symbols')
    parser.option('log')
    parser.option('verbose', {default: false})

    var options = parser.parse([
      'node','bin/parser.js',"--verbose", 
      '-s', 'BAT-USDC', '-s', 'BTC-USD', 
      '--no-log'
    ]);

    assert.equal(process.env.NODE_ENV, 'development');
    assert.equal(options.symbols[0], 'BAT-USDC');
    assert.equal(options.symbols[1], 'BTC-USD');
    assert.equal(options.log, false);

    parser.reset();
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('symbols', {type: 'array'})
    parser.option('log')
    parser.option('verbose', {default: false})

    var options = parser.parse([
      'node','bin/parser.js',"--verbose", 
      '-s', 'BAT-USDC', 
      '--no-log'
    ])
    assert.equal(process.env.NODE_ENV, 'development');
    assert.equal(options.symbols[0], 'BAT-USDC');
    assert.equal(options.symbols[1], undefined);
    assert.equal(options.log, false);
  });

  it('checking array w/default', () => {
    const parser = new CarrierPigeon();
    
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('symbols', {default: ['ETH-BTC'], type: 'array'})
    parser.option('log')
    parser.option('verbose', {default: false})

    var options = parser.parse([
      'node','bin/parser.js',"--verbose", 
      '--no-log'
    ]);

    assert.equal(process.env.NODE_ENV, 'development');
    assert.equal(options.symbols[0], 'ETH-BTC');

    var options = parser.parse([
      'node','bin/parser.js',"--verbose", 
      '-s', 'BAT-USDC', '-s', 'BTC-USD', 
      '--no-log'
    ]);

    assert.equal(process.env.NODE_ENV, 'development');
    assert.equal(options.symbols[0], 'BAT-USDC');
    assert.equal(options.symbols[1], 'BTC-USD');
    assert.equal(options.log, false);
  });

  it('checking strict (array)', () => {
    const parser = new CarrierPigeon({strict: true});
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('verbose', {default: false})
    parser.option('symbols', {default: ['ETH-BTC'], type: 'array'})
 
    var options = parser.parse([
      'node','bin/parser.js',"--chunk-bacon", 
      '--symbols', 'BTC-USD', 
      '--symbols', 'ETH-BTC'
    ])
    
    assert.equal(options['chunky-bacon'], undefined)
    assert.equal(options.symbols[0], 'BTC-USD')
    assert.equal(options.symbols[1], 'ETH-BTC')

    parser.reset()
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('verbose', {default: false})
    parser.option('symbols')
 
    var options = parser.parse([
      'node','bin/parser.js',"--chunk-bacon", 
      '--symbols', 'BTC-USD', 
      '--symbols', 'ETH-BTC'
    ])
    assert.equal(options['chunky-bacon'], undefined)
    assert.equal(options.symbols, 'ETH-BTC')

    parser.reset()
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('verbose', {default: false})
    parser.option('symbols', {default: ['ETH-BTC']})
 
    var options = parser.parse([
      'node','bin/parser.js', 
      "--chunk-bacon", 
      '--symbols', 'BTC-USD', 
      '--symbols', 'ETH-BTC'
    ])
    assert.equal(options['chunky-bacon'], undefined)
    assert.equal(options.symbols[0], 'BTC-USD')
    assert.equal(options.symbols[1], 'ETH-BTC')

    parser.reset()
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('verbose', {default: false})
    parser.option('symbols', {type: 'array'})
 
    var options = parser.parse([
      'node','bin/parser.js',
      "--chunk-bacon", 
      '--symbols', 'BTC-USD', 
      '--symbols', 'ETH-BTC'
    ])
    assert.equal(options['chunky-bacon'], undefined)
    assert.equal(options.symbols[0], 'BTC-USD')
    assert.equal(options.symbols[1], 'ETH-BTC')

    parser.reset()
    parser.strict = false;
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('verbose', {default: false})
    parser.option('symbols')
 
    var options = parser.parse([
      'node','bin/parser.js',
      "--chunk-bacon", 
      '--symbols', 'BTC-USD', 
      '--symbols', 'ETH-BTC'
    ])
    assert.equal(options['chunky-bacon'], undefined)
    assert.equal(options.symbols[0], 'BTC-USD')
    assert.equal(options.symbols[1], 'ETH-BTC')
  });

  it('negating non boolean', () => {
    const parser = new CarrierPigeon();
    
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('speed', {type: 'number'})
    parser.option('log')
    parser.option('verbose', {default: false})

    var options = parser.parse([
      'node','bin/parser.js',
      "--verbose", 
      '-e', 'production', 
      '--log', 'test'
    ])
    assert.equal(process.env.NODE_ENV, 'production')
    assert.equal(options.log, 'test')
    
    var options = parser.parse([
      'node','bin/parser.js',
      "--verbose", 
      '-e', 'production', 
      '--no-log'
    ])
    assert.equal(process.env.NODE_ENV, 'production')
    assert.equal(options.log, false)
  });

});


