const gulp = require("gulp");
const jasmine = require("gulp-jasmine");
const ts = require("gulp-typescript");
const sourceMaps = require("gulp-sourcemaps");
const benchmark = require("gulp-benchmark");
 

const tsProject = ts.createProject("tsconfig.json");

gulp.task("default",  () => tsProject.src()
                            .pipe(sourceMaps.init())
                            .pipe(ts(tsProject))
                            .pipe(sourceMaps.write())
                            .pipe(gulp.dest("."))
                            );
 
gulp.task("test", () => gulp.src("spec/**/*.js")
                            .pipe(jasmine())
                            );

gulp.task("bench",() => gulp.src('perf/**/*.js', {read: false})
                            .pipe(benchmark())
                            );