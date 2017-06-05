var gulp = require('gulp'),
    uglify = require('gulp-uglify')
    browserify = require('gulp-browserify');
  
gulp.task('minify', function () {
  gulp.src('client/client.js')
      .pipe(uglify())
      .pipe(browserify({
          insertGlobals : true,
          debug : !gulp.env.production
        }))
      .pipe(gulp.dest('build'))
});