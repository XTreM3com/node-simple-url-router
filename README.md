node-simple-url-router
======================

A simple and lightweight url path router for NodeJS

## Basic Usage
```js
var SimpleUrlRouter = require('simple-url-router');
var router = new SimpleUrlRouter();

// add a route
router.addRoute(
  '/hello', 
  function (to) { console.log('hello, ' + to); }
);

// find a route
var matchedRoute = router.findRoute('/hello'); // { callback: [Function], parameters: {} }
matchedRoute.callback('world'); // logs 'hello world'
```

### Adding a route hierarchy
```js
router.addRoute(
  '/api',
  {
    'ping': function () { console.log('pong'); },
    'foo': {
      'bar1': function () { console.log('bar1'); },
      'bar2': function () { console.log('bar2'); }
    }
  }
);
router.findRoute('/api/ping').callback(); // > 'pong'
router.findRoute('/api/foo/bar1').callback(); // > 'bar1'
```
Be aware that
```js
router.findRoute('/api')
```
returns null, as we did not add a callback function for it.
To define a callback for it, we can either do another call to addRoute:
```js
router.addRoute(
  '/api', 
  function () { console.log('api'); }
);
```
Or use an Array as second argument to addRoute, which contains the callback and the sub-routes hierarchy:
```js
router.addRoute(
  '/api', [
    function () { console.log('api'); },
    {
      'ping': function () { console.log('pong'); },
      'foo': {
        'bar1': function () { console.log('bar1'); },
        'bar2': function () { console.log('bar2'); }
      }
    }
  ]
);
```
### Routes with parameter segments
To add a route with a variable segment, start that segment with a colon, following its name.
When the route is matching, it adds a parameter with the specified name with the value of the segment from the findRoute call:
```js
var userNames = { '1': 'John', '2': 'Max' };
router.addRoute(
  '/user/:userId/name', 
  function (parameters) {
    var userName = userNames[parameters['userId']];
    console.log('user name: ' + userName);
  }
);

var matchedRoute = router.findRoute('/user/1/name'); // { callback: [Function], parameters: { 'userId': 1 } }
matchedRoute.callback(matchedRoute.parameters); // > user name: John
```
