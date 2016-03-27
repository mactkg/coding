const gulp = require('gulp');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const browserSync = require('browser-sync');

var bundlePaths = {
  src: [
    "./client/js/index.js",
    "./client/js/square.js",
    "./client/js/cycle.js",
    "./client/js/cycle-r.js",
    "./client/js/whitenoise.js"
  ],
  dest:'public/js/'
};

gulp.task('browserify', () => {
  bundlePaths.src.forEach((i) => {
    browserify(i)
      .transform(babelify)
      .bundle()
      .on("error", function (err) { console.log("Error : " + err.message); })
      .pipe(source(i.split('/').pop()))
      .pipe(gulp.dest(bundlePaths.dest));
    });
});


// browser-sync
gulp.task('browser-sync', () => {
  browserSync({
    server: {
      baseDir: "./",
      index: "index.html"
    }
  });
});


gulp.task('bs-reload', () => {
  browserSync.reload();
});

gulp.task('watch', ['browserify', 'browser-sync'], () => {
  gulp.watch(['public/**/*','*.html'],['bs-reload']);
  gulp.watch(['client/js/**/*.js', '!client/js/**/lib/**'],['browserify']);
});

gulp.task('default', ['browserify']);
