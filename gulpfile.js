const gulp = require("gulp");
const tape = require("gulp-tape");
const spec = require("tap-spec");
const gulpTs = require("gulp-typescript");
const sourceMaps = require("gulp-sourcemaps");
const benchmark = require("gulp-benchmark");
const typescript = require("typescript");

gulp.task("default",  () => {
    const project = gulpTs.createProject("tsconfig.json", { typescript });
    return project.src().pipe(sourceMaps.init())
                        .pipe(project())
                        .pipe(sourceMaps.write())
                        .pipe(gulp.dest("./dist"));
});
 
gulp.task("test", ["default"], () => gulp.src("./dist/spec/core/**/*.js").pipe(tape({ reporter: spec() })));

gulp.task("bench",() => gulp.src("./dist/perf/**/*.js", {read: false}).pipe(benchmark()));
