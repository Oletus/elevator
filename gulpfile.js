var gulp = require('gulp');
var ffmpeg = require('gulp-fluent-ffmpeg');

gulp.task('ogg2mp3', function () {
    // transcode ogg files to mp3
    return gulp.src('assets/audio/*.ogg')
    .pipe(ffmpeg('mp3', function (cmd) {
        return cmd
        .audioBitrate('128k')
        .audioChannels(2)
        .audioCodec('libmp3lame')
    }))
    .pipe(gulp.dest('assets/audio/'));
});

gulp.task('mp32ogg', function () {
    // transcode mp3 files to ogg
    return gulp.src('assets/audio/*.mp3')
    .pipe(ffmpeg('ogg', function (cmd) {
        return cmd
        .audioBitrate('128k')
        .audioChannels(2)
        .audioCodec('vorbis')
    }))
    .pipe(gulp.dest('assets/audio/'));
});

gulp.task('default', ['ogg2mp3']);
