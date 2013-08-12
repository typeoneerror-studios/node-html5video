//==================================================================
//
// Requires
//
//==================================================================

var fs     = require('fs');
var path   = require('path');
var ffmpeg = require('fluent-ffmpeg')

//==================================================================
//
// Vars
//
//==================================================================

var FORCE_LOG = true;

var FORMAT_H264 = "h264";
var FORMAT_WEBM = "webm";
var FORMAT_OGG  = "ogg";
var FORMAT_ALL  = [ FORMAT_H264, FORMAT_WEBM, FORMAT_OGG ];

var formats = {

  "h264": {
    "ext": "mp4"
  },

  "webm": {
    "ext": "webm"
  },

  "ogg": {
    "ext": "ogv"
  }

};

var options = {
  src:             "",
  output:          "{src_name}-html5",
  videoBitrate:    "700k",
  audioBitrate:    "128k",
  formats:         FORMAT_ALL,
  width:           -1,
  height:          -1,
  poster:          "{src_name}-poster",
  posterTimestamp: "00:00:00"
};

//==================================================================
//
// Functions
//
//==================================================================

/**
 * Wrapper for log writing.
 *
 * @param string msg Message to write.
 */
function writeLog(msg, force) {
  force = (typeof force === 'undefined') ? false : force;
  if (force) {
    console.log(msg);
  }
};

/**
 * Validates all the config options passed into the script.
 *
 * @param object opts List of options passed into the script.
 * @return boolean True if all options are valid, false if any are not.
 */
function validate(opts) {

  // opts.src
  var file = process.cwd();
  if (opts.src.substring(0, 1) == '/') {
    // Absolute path
    file = opts.src;
  } else {
    if (!opts.src.lastIndexOf('/') != opts.src.length - 1) {
      // Add trailing slash
      file += '/';
    }
    file += opts.src;
  }

  var stats = fs.lstatSync(file);
  if (!stats.isFile()) {
    writeLog("'" + opts.src + "' is not a file and could not be processed.", FORCE_LOG);
    writeLog("Please check that '" + opts.src + "' is a valid file and try again.", FORCE_LOG);
    return false;
  }

  // opts.output
  if (opts.output.length < 1) {
    writeLog("You must specify a name for the output videos.", FORCE_LOG);
    return false;
  }

  // opts.vbr
  if (opts.vbr.toLowerCase().lastIndexOf('k') != opts.vbr.length - 1) {
    writeLog("'vbr' expected to be in kilobits. Should end with 'k', e.g., '700k'.", FORCE_LOG);
    return false;
  }

  // opts.abr
  if (opts.abr.toLowerCase().lastIndexOf('k') != opts.abr.length - 1) {
    writeLog("'abr' expected to be in kilobits. Should end with 'k', e.g., '128k'.", FORCE_LOG);
    return false;
  }

  // opts.formats
  var formatsIsArray = opts.formats instanceof Array;
  if (!formatsIsArray) {
    writeLog("'formats' must be an array.", FORCE_LOG);
    return false;
  }

  if (opts.formats.length < 1) {
    writeLog("You must specify at least one format in 'formats'.", FORCE_LOG);
    return false;
  }

  for (var i = 0; i < opts.formats.length; ++i) {
    var format = opts.formats[i];
    if (FORMAT_ALL.indexOf(format) < 0) {
      writeLog("Format '" + format + "' is not a valid format. Use help to see the list of valid formats.", FORCE_LOG);
      return false;
    }
  }

  // opts.width
  var w = parseInt(opts.width);
  if (isNaN(w)) {
    writeLog("Width '" + opts.width + "' cannot be interpreted as an integer value.", FORCE_LOG);
    return false;
  }

  // opts.height
  var h = parseInt(opts.height);
  if (isNaN(h)) {
    writeLog("Height '" + opts.height + "' cannot be interpreted as an integer value.", FORCE_LOG);
    return false;
  }

  // opts.poster
  if (opts.poster.length < 1) {
    writeLog("You must specify a name for the poster image.", FORCE_LOG);
    return false;
  }

  // opts.posterTimestamp
  var tsRegex = /[0-9]{2}\:[0-9]{2}\:[0-9]{2}/

};

/**
 * Runs the script.
 *
 * @param string src Path to source video.
 * @param string out Name of output file.
 * @param string vbr Video bitrate.
 * @param string abr Audio bitrate.
 * @param array formats List of formats to transcode to.
 * @param int width Width of the output video.
 * @param int height Height of the output video.
 * @param string poster Poster name
 * @param string posterTimestamp Timestamp at which to grab the poster image.
 * @param boolean verbose Whether or not to log extra stuff.
 */
var run = function(src, out, vbr, abr, formats, width, height, poster, posterTimestamp, verbose) {

  options.src             = src;
  options.ouput           = out.replace('{src_name}', src);
  options.vbr             = vbr || options.vbr;
  options.abr             = abr || options.abr;
  options.formats         = formats || options.formats;
  options.width           = parseInt(width) || options.width;
  options.height          = parseInt(height) || options.height;
  options.poster          = poster || options.poster;
  options.posterTimestamp = posterTimestamp || options.posterTimestamp;
  options.verbose = verbose;

  if (validate(options)) {
    // Process
  }

};

module.exports = run;

