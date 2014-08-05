# fs.collections

`fs.collections` is an Angular-ish version of Backbone's Models and Collections
which we rely heavily on at [Fullscreen](http://fullscreen.net)

## Installation

In your Angular project, run `bower install --save fs.collections` to save the
module. Then, in your HTML, add:

``` html
<script src="/path/to/bower_components/fs.collections/index.js"></script>
```

And lastly, in your Angular module, include `fs.collections` as a dependency:

``` javascript
angular.module('my-app', ['fs.collections')
```

## Contributing

To get your dev environment up and running, run `npm install` and `bower install`
to get the components we need.

Tests are run with `npm run test` and you can build the minified source with
`npm run build`

