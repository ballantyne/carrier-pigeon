# carrier-pigeon

```bash
   npm install carrier-pigeon --save
```

```javascript
    var parser = new CarrierPigeon();
    parser.commands('init', 'start');
    parser.option('env', {default: "development", env: "NODE_ENV"})
    parser.option('verbose', {default: false})
    
    var options = parser.parse(process.argv);
    if (options.verbose) {
      console.log(options);
    }

```


