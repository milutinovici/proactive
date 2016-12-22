const gulp = require("gulp");
const tape = require("gulp-tape");
const spec = require("tap-spec");
const benchmark = require("gulp-benchmark");
const typescript = require("typescript");
const copy = require("gulp-copy");
const del = require("del");
const uglify = require("gulp-uglify");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const tsify = require("tsify");
const stringify = require("stringify");
const vendors = ["rxjs"];

gulp.task("corespec", ["delete"],  () => 
                        browserify({ debug: true })
                        .add("spec/core/array-spec.ts").add("spec/core/computed-spec.ts")
                        .add("spec/core/computedArray-spec.ts").add("spec/core/value-spec.ts")
                        .add("spec/core/whenAny-spec.ts")
                        .plugin(tsify).bundle()
                        .pipe(source("core-spec.js"))
                        .pipe(buffer())
                        .pipe(gulp.dest("./dist/"))
                        );
 
gulp.task("test", ["default"], () => gulp.src("./dist/spec/core/**/*.js").pipe(tape({ reporter: spec() })));

gulp.task("bench",() => gulp.src("./dist/perf/**/*.js", {read: false}).pipe(benchmark()));

gulp.task("copy",  () => {
    return gulp.src("./sample/**/*.html")
               .pipe(copy("./dist"));
});

gulp.task("delete", () => del("./dist/sample/webapp/**"));

gulp.task("uispec", () => browserify({ debug: true })
                        .transform(stringify, { appliesTo: { includeExtensions: [".html"] }, minify: true })
                        // .external(vendors)
                        .add("spec/ui/spec.ts")
                        .plugin(tsify).bundle()
                        .pipe(source("ui-spec.js"))
                        .pipe(buffer())
                        //.pipe(uglify())
                        .pipe(gulp.dest("./dist/"))
                        );

gulp.task("sample", () => browserify({ debug: true })
                        .transform(stringify, { appliesTo: { includeExtensions: [".html"] }, minify: true })
                        // .external(vendors)
                        .add("sample/webapp/startup.ts")
                        .plugin(tsify).bundle()
                        .pipe(source("webapp.js"))
                        .pipe(buffer())
                        //.pipe(uglify())
                        .pipe(gulp.dest("./dist/sample"))
                        );