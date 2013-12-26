module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mmm-dd") %> */\n'
      },
      build: {
        src: 'src/**/*.js',
        dest: 'build/js/<%= pkg.name %>.min.js'
      }
    },
    copy: {
      build: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['src/index.html'],
            dest: 'build/'
            // ,
            // filter: 'isFile'
          },
          {
            expand: true,
            flatten: true,
            src: ['src/css/*.css'],
            dest: 'build/css/'
          }
        ]
      },
      test: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['src/js/*.js'],
            dest: 'tests/js/'
          }
        ]
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');

  grunt.registerTask('default', ['uglify']);
  grunt.registerTask('build', ['uglify', 'copy:build', 'copy:test']);
};