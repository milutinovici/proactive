const gulp = require("gulp");
const merge = require("merge2");
const jasmine = require("gulp-jasmine");
const gulpTs = require("gulp-typescript");
const sourceMaps = require("gulp-sourcemaps");
const benchmark = require("gulp-benchmark");
const typescript = require("typescript");
 
gulp.task("default",  () => {
    const project = gulpTs.createProject("tsconfig.json");
    return project.src().pipe(sourceMaps.init())
                        .pipe(gulpTs(project))
                        .pipe(sourceMaps.write())
                        .pipe(gulp.dest("."));
});
 
gulp.task("test", () => gulp.src("spec/**/*.js").pipe(jasmine()));

gulp.task("bench",() => gulp.src("perf/**/*.js", {read: false}).pipe(benchmark()));

gulp.task("release",  () => {
    const project = gulpTs.createProject({ outFile: "proactive.js", module: "amd", declaration: true, typescript: typescript });
    const result = gulp.src("src/**/*.ts").pipe(gulpTs(project));
    return merge([
		result.dts.pipe(gulp.dest("./dist")),
		result.js.pipe(gulp.dest("./dist"))
	]);
});