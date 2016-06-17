var gulp = require('gulp'),
    del = require('del'),
    rename = require('gulp-rename'),
    util = require('gulp-util'),
    concat = require('gulp-concat'),
    runSequence = require('run-sequence'),
    // Static Gen
    flatmap = require('gulp-flatmap'),
    folders = require('gulp-folders'),
    preprocess = require('gulp-preprocess'),
    wrap = require('gulp-wrap'),
    jsonQuery = require('json-query'),
    path = require('path');

var site_data = require('./src/site.json'),
    globals = {
        pages: './src/pages/',
        html: './src/**/*.html',
        js: './src/**/*.js',
        css: './src/**/*.scss'
    },
    /*  page[optional] is the template name you want to get data for. ex: home/index.html */
    getPageData = function(page) {
        page = page || false;
        var json = site_data,
            result;
        if (page) {
            result = jsonQuery("pages[template=" + page + "]", {
                data: json
            });
            if (!result.value) {
                result = jsonQuery("pages[*].children[template=" + page + "]", {
                    data: json
                });
            }
            return result.value;
        }
        else {
            return json;
        }
    };

gulp.task('clean', function() {
    'use strict';
    return del(['www']);
});

gulp.task('static:all', folders(globals.pages, function(dir) {
    'use strict';
    return gulp.src(path.join(globals.pages, dir, '*.html'))
        .pipe(flatmap(function(stream, file) {
            var templatePath = path.join(globals.pages, dir, path.basename(file.path)),
                page_data = getPageData(path.join(dir, path.basename(file.path)));
            return gulp.src(templatePath)
                .pipe(wrap({
                    src: templatePath
                }, {
                    data: getPageData(),
                    page: page_data
                }, {
                    engine: 'nunjucks'
                }))
                .pipe(preprocess({
                    includeBase: './src/'
                }))
                .pipe(rename({
                    basename: page_data.slug
                }))
                .pipe(gulp.dest('./www'));
        }));
}));

gulp.task('css', function() {
    return gulp.src('./src/**/*.css')
        .pipe(concat('base.css'))
        .pipe(gulp.dest('./www/css'));
});

gulp.task('assets', function() {
    'use strict';
    gulp.src('./src/img/**/**.*')
        .pipe(gulp.dest('./www/img'));
});

gulp.task('build', function() {
    'use strict';
    return runSequence('clean', ['static:all', 'css', 'assets']);
});

gulp.task('default', ['build']);