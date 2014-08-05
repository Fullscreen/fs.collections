module.exports = function(config) {
  config.set({
    frameworks: ['jasmine'],
    files: [
      "bower_components/angular/angular.js",
      "bower_components/angular-mocks/angular-mocks.js",
      "bower_components/underscore/underscore.js",
      "src/index.coffee",
      "src/**/*.coffee",
      "tests/**/*.coffee"
    ],
    preprocessors: {
      "src/**/*.coffee": "coffee",
      "tests/**/*.coffee": "coffee"
    },
    port: 8080,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    reporters: ['progress'],
    singleRun: true
  });
};
