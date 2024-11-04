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
    },
    watch: {
      scripts: {
        files: ['src/**/*.js'],
        tasks: ['uglify', 'copy:test'],
        options: {
          debounceDelay: 250
        }
      },
      resources: {
        files: ['src/*.html', 'src/css/*.css'],
        tasks: ['copy:build'],
        options: {
          debounceDelay: 250
        }
      }
    },
    jest: {
      options: {
        coverage: true,
        testPathPattern: /tests\/.*-spec\.ts$/
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-jest');

  grunt.registerTask('default', ['uglify']);
  grunt.registerTask('build', ['uglify', 'copy:build', 'copy:test']);
  grunt.registerTask('test', ['jest']);
};
