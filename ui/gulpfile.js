const gulp = require("gulp");
const tape = require("gulp-tape");
const ts = require("gulp-typescript");
const sourcemaps = require("gulp-sourcemaps");
const merge = require("merge2");
const spec = require("tap-spec");

gulp.task("build",  () => {
    const project = ts.createProject("tsconfig.json");
    const result = project.src()
        .pipe(sourcemaps.init())  
        .pipe(project());

    return merge([
        result.dts.pipe(gulp.dest("./lib")),
        result.js.pipe(sourcemaps.write()).pipe(gulp.dest("./lib"))
    ]);
});

gulp.task("spec", () => {
    const result = gulp.src("./lib/spec/*.js")
                       .pipe(tape({ reporter: spec() }));
    }
);

