//==================================================================
//
// Requires
//
//==================================================================

var html5video = require('./html5video');

var main = function() {

var argv = require('optimist')
            .default('src', '')
            .alias('src', 's')
            .default('out', '')
            .alias('out', 'o')
            .default('videobitrate', '700k')
            .alias('videobitrate', 'vbr')
            .default('audiobitrate', '128k')
            .alias('audiobitrate', 'abr')
            .default('formats', 'all')
            .alias('formats', 'f')
            .default('width', '-1')
            .alias('width', 'w')
            .default('height', '-1')
            .alias('height', 'h')
            .default('poster', 'poster')
            .alias('poster', 'p')
            .default('postertime', 0)
            .alias('postertime', 't')
            .default('timeout', 600)
            .default('onlyposter', false)
            .alias('timeout', 'i')
            .default('options', '')
            .alias('options', 'n')
            .default('verbose', false)
            .alias('verbose', 'v')
            .default('progress', true)
            .boolean('help')
            .alias('help', 'h')
            .argv;

var help = function() {
    var s = "\n  html5video\n"
          + "\n"
          + "  Basic Usage\n"
          + "  -----------\n"
          + "\n"
          + "    html5video --src path/to/src.mov --out /path/to/out\n"
          + "\n"
          + "  Options\n"
          + "  -------\n"
          + "\n"
          + "    -s, --src:            Path to source video.\n"
          + "\n"
          + "    -o, --out:            Path to output video(s).\n"
          + "\n"
          + "    -vbr, --videobitrate: Video bitrate to encode at.\n"
          + "\n"
          + "    -abr, --audiobitrate: Audio bitrate to encode at.\n"
          + "\n"
          + "    -f, --formats:        Comma-separated list of formats (see below).\n"
          + "\n"
          + "    -w, --width:          Width of output video.\n"
          + "\n"
          + "    -h, --height:         Height of output video.\n"
          + "\n"
          + "    -p, --poster:         Name of poster image.\n"
          + "\n"
          + "    -t, --postertime:     Timestamp, in seconds, to take poster image at.\n"
          + "\n"
          + "    --onlyposter:         Only encode the poster image.\n"
          + "\n"
          + "    -i, --timeout:        Timeout of the spawned ffmpeg sub-processes in seconds. Default: 600."
          + "\n"
          + "    -n, --options:        Additional options not explicitly provided by this API."
          + "\n"
          + "    -v, --verbose:        Print extra output to console.\n"
          + "\n"
          + "    --progress:           Like 'verbose', but just shows encoding progress.\n"
          + "\n"
          + "    -h, --help:           This help.\n\n\n";

    s    += "  Formats\n"
          + "  -------\n"
          + "\n"
          + "    - h264\n"
          + "    - webm\n"
          + "    - ogg\n"
          + "    - all (default)\n"
          + "\n"
          + "    Sample Usage\n"
          + "    ------------\n"
          + "\n"
          + "     # single format\n"
          + "     html5video --src myvid.mov --out vid --formats h264"
          + "\n"
          + "     # multiple formats\n"
          + "     html5video --src myvid.mov --out vid --formats webm,ogv\n\n\n";

    s    += "  Size\n"
          + "  ----\n"
          + "\n"
          + "    Size can be specified in one of four ways:\n"
          + "    1. Use the defaults. The output video will be the same size as the source.\n"
          + "    2. Specify width. Height will be scaled to maintain aspect ratio.\n"
          + "    3. Specify height. Width will be scaled to maintain aspect ratio.\n"
          + "    4. Specify width and height.\n"
          + "\n"
          + "    All sizes are in pixels.\n\n\n";


    console.log(s);
};


if (argv.help === true) {
    help();
} else {

    var formats = [];
    argv.formats.split(',').forEach(function(el, index, arr) {

      formats.push(el.trim());

    });

    var opts = [];
    argv.options.split(',').forEach(function(el, index, arr) {

      if (el.trim() != '') {
        opts.push(el);
      }

    });


    html5video.run(argv.src,
                   argv.out,
                   argv.videobitrate,
                   argv.audiobitrate,
                   formats,
                   argv.width,
                   argv.height,
                   argv.poster,
                   argv.postertime,
                   argv.onlyposter,
                   argv.verbose,
                   argv.progress,
                   argv.timeout,
                   opts);
}

};

module.exports.main = main;
