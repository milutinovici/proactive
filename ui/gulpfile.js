const gulp = require("gulp");
const tape = require("gulp-tape");
const uglify = require("gulp-uglify");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const tsify = require("tsify");
const stringify = require("stringify");
const vendors = ["rxjs"];

gulp.task("build", () => browserify({ debug: true })
                        .transform(stringify, { appliesTo: { includeExtensions: [".html"] }, minify: true })
                        .external(vendors)
                        .add("src/proactiveUI.ts")
                        .plugin(tsify).bundle()
                        .pipe(source("ui.js"))
                        .pipe(buffer())
                        .pipe(uglify())
                        .pipe(gulp.dest("./dist"))
                        );

gulp.task("spec", () => browserify({ debug: true })
                        .transform(stringify, { appliesTo: { includeExtensions: [".html"] }, minify: true })
                        // .external(vendors)
                        .add("spec/spec.ts")
                        .plugin(tsify).bundle()
                        .pipe(source("ui-spec.js"))
                        .pipe(buffer())
                        // .pipe(uglify())
                        .pipe(gulp.dest("./dist/"))
                        );
