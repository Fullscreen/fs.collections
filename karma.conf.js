module.exports = function (config) {
  config.set({
    frameworks: ['browserify', 'jasmine'],
    files: [
      'node_modules/angular/angular.js',
      'node_modules/underscore/underscore.js',
      'src/index.js',
      'tests/**/*.js',
      'node_modules/angular-mocks/angular-mocks.js'
    ],
    preprocessors: {
      'src/*.js': 'browserify',
      'tests/**/*.js': 'browserify'
    },
    browserify: {
      debug: true,
      transform: [
        ['babelify', {presets: ['es2015']}],
        'browserify-ngannotate',
        // disable this line to get better debugging
        ['browserify-istanbul', {instrumenterConfig: {embedSource: true}, ignore: ['**/vendor/**']}]
      ]
    },
    port: 8080,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['PhantomJS'],
    reporters: ['progress'],
    singleRun: true
  })
}
