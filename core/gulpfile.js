const gulp = require("gulp");
const tape = require("gulp-tape");
const spec = require("tap-spec");
const benchmark = require("gulp-benchmark");
const uglify = require("gulp-uglify");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const tsify = require("tsify");

const vendors = ["rxjs"];

gulp.task("build",  () => 
                        browserify({ debug: true })
                        .add("spec/array-spec.ts").add("spec/computed-spec.ts")
                        .add("spec/computedArray-spec.ts").add("spec/value-spec.ts")
                        .add("spec/whenAny-spec.ts")
                        .plugin(tsify).bundle()
                        .pipe(source("spec.js"))
                        .pipe(buffer())
                        .pipe(gulp.dest("./dist/"))
                        );
 
gulp.task("test", ["build"], () => gulp.src("./dist/spec.js").pipe(tape({ reporter: spec() })));

gulp.task("bench", () => gulp.src("./dist/perf/**/*.js", {read: false}).pipe(benchmark()));