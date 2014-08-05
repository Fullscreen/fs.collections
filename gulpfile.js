var gulp = require('gulp')
  , coffee = 

gulp.task('default', function() {
  gulp.src([
    "src/index.coffee",
    "src/**/*.coffee",
  ])
  .pipe(require('gulp-coffee')())
  .pipe(require('gulp-concat')('index.js'))
  .pipe(gulp.dest('dest'))
})
