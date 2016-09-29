const gulp = require("gulp");
const merge = require("merge2");
const tape = require("gulp-tape");
const spec = require("tap-spec");
const gulpTs = require("gulp-typescript");
const sourceMaps = require("gulp-sourcemaps");
const benchmark = require("gulp-benchmark");
const typescript = require("typescript");
const uglify = require("gulp-uglify");
const browserify = require("browserify");
const source = require("vinyl-source-stream");
const buffer = require("vinyl-buffer");
const tsify = require("tsify");
const stringify = require("stringify");
const vendors = ["rxjs"];

gulp.task("default",  () => {
    const project = gulpTs.createProject("tsconfig.json", { typescript });
    return project.src().pipe(sourceMaps.init())
                        .pipe(gulpTs(project))
                        .pipe(sourceMaps.write())
                        .pipe(gulp.dest("./dist"));
});
 
gulp.task("test", ["default"], () => gulp.src("./dist/spec/core/**/*.js").pipe(tape({ reporter: spec() })));

gulp.task("bench",() => gulp.src("./dist/perf/**/*.js", {read: false}).pipe(benchmark()));

gulp.task("core",  () => {
    const project = gulpTs.createProject("tsconfig.json", { outFile: "proactive.js", module: "amd", declaration: true, typescript: typescript, outDir: null });
    const result = gulp.src("src/core/**/*.ts").pipe(project());
    return merge([
		result.dts
                      .pipe(gulp.dest("./dist")),
		result.js
                      .pipe(uglify())
                      .pipe(gulp.dest("./dist"))
	]);
});
gulp.task("ui",  () => {
    const project = gulpTs.createProject("tsconfig.json", { outFile: "ui.js", module: "amd", declaration: true, typescript: typescript, outDir: null });
    const result = gulp.src("src/ui/**/*.ts").pipe(project());
    return merge([
		result.dts
                      .pipe(gulp.dest("./dist")),
		result.js
                      .pipe(uglify())
                      .pipe(gulp.dest("./dist"))
	]);
});

gulp.task("uispec", () => browserify({ debug: true })
                         .transform(stringify, { appliesTo: { includeExtensions: [".html"] }, minify: true })
                        .add("spec/ui/spec.ts")
                        .plugin(tsify).bundle()
                        .pipe(source("spec.js"))
                        .pipe(buffer())
                        //.pipe(uglify())
                        .pipe(gulp.dest("./dist/"))
                        );