const gulp = require("gulp");
const tape = require("gulp-tape");
const spec = require("tap-spec");
const benchmark = require("gulp-benchmark");
const ts = require("gulp-typescript");
const merge = require("merge2");

gulp.task("build",  () => {
        const project = ts.createProject("tsconfig.json");
        const result = project.src().pipe(project());
        return merge([
            result.dts.pipe(gulp.dest("./lib")),
            result.js.pipe(gulp.dest("./lib"))
        ]);
    }
);
 
gulp.task("test", () => {
    const result = gulp.src("./lib/spec/*.js")
                       .pipe(tape({ reporter: spec() }));
    }
);

gulp.task("bench", () => gulp.src("./lib/perf/**/*.js", {read: false}).pipe(benchmark()));