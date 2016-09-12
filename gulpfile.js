const gulp = require("gulp");
const merge = require("merge2");
const tape = require("gulp-tape");
const spec = require("tap-spec");
const gulpTs = require("gulp-typescript");
const sourceMaps = require("gulp-sourcemaps");
const benchmark = require("gulp-benchmark");
const typescript = require("typescript");
const uglify = require("gulp-uglify");

gulp.task("default",  () => {
    const project = gulpTs.createProject("tsconfig.json");
    return project.src().pipe(sourceMaps.init())
                        .pipe(gulpTs(project))
                        .pipe(sourceMaps.write())
                        .pipe(gulp.dest("./dist"));
});
 
gulp.task("test", ["default"], () => gulp.src("dist/spec/**/*.js").pipe(tape({ reporter: spec() })));

gulp.task("bench",() => gulp.src("dist/perf/**/*.js", {read: false}).pipe(benchmark()));

gulp.task("release",  () => {
    const project = gulpTs.createProject({ outFile: "proactive.js", module: "amd", declaration: true, typescript: typescript });
    const result = gulp.src("src/**/*.ts").pipe(gulpTs(project));
    return merge([
		result.dts
                      .pipe(gulp.dest("./dist")),
		result.js
                      .pipe(uglify())
                      .pipe(gulp.dest("./dist"))
	]);
});