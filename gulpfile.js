var browserify = require('browserify')
var gulp = require('gulp')
var source = require('vinyl-source-stream')
var buffer = require('vinyl-buffer')
var gutil = require('gulp-util')
var uglify = require('gulp-uglify')
var sourcemaps = require('gulp-sourcemaps')
var babelify = require('babelify')
var concat = require('gulp-concat')
var ngannotate = require('browserify-ngannotate')

var files = [
  'src/index.js'
]

gulp.task('build', function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: files,
    debug: true,
    // defining transforms here will avoid crashing your stream
    transform: [[babelify, {presets: ['es2015']}], ngannotate]
  })
  .external('angular')
  .external('underscore')

  return b.bundle()
    .pipe(source('index.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
  // Add transformation tasks to the pipeline here.
    .on('error', gutil.log)
    .pipe(concat('index.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.'))
})

gulp.task('minified', function () {
  // set up the browserify instance on a task basis
  var b = browserify({
    entries: files,
    debug: true,
    // defining transforms here will avoid crashing your stream
    transform: [[babelify, {presets: ['es2015']}], ngannotate]
  })
  .external('angular')
  .external('underscore')

  return b.bundle()
    .pipe(source('index.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
  // Add transformation tasks to the pipeline here.
    .pipe(uglify())
    .on('error', gutil.log)
    .pipe(concat('index.min.js'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('.'))
})

gulp.task('default', ['build', 'minified'])

