//==================================================================
//
// Requires
//
//==================================================================

var fs     = require('fs');
var path   = require('path');
var ffmpeg = require('fluent-ffmpeg');
var util   = require('util');
var mkdirp = require('mkdirp');

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

var TYPE_VIDEO  = "video";
var TYPE_POSTER = "poster";

var CLEAR_LINE      = "\033[2K";
var CARRIAGE_RETURN = "\r";

var formats = {

  "h264": {
    "ext":    "mp4",
    "outputFormat": "mp4",
    "vcodec": "libx264",
    "acodec": "copy",
    "opts": [
      "-vpre slow",
      "-vpre baseline"
    ]
  },

  "webm": {
    "ext":    "webm",
    "outputFormat": "webm",
    "vcodec": "libvpx",
    "acodec": "libvorbis",
    "opts": []
  },

  "ogg": {
    "ext":    "ogv",
    "outputFormat": "ogg",
    "vcodec": "libtheora",
    "acodec": "libvorbis",
    "opts": []
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
  posterTimestamp: 0,
  verbose:         false
};

var currentVideo = -1;
var videoOptions = [];

var logger                = null;
var progressHandler       = null;
var encodeCompleteHandler = null;
var completeHandler       = null;

//==================================================================
//
// Functions
//
//==================================================================

/**
 * The default logger function.
 * Writes to console.log().
 *
 * @param string msg Message to write.
 */
function defaultLogger(msg, force) {
  force = (typeof force === 'undefined') ? false : force;
  if (force) {
    console.log(msg);
  }
}

function setLogger(loggerFunc) {
  logger = loggerFunc;
}
setLogger(defaultLogger);

/**
 * Wrapper for log writing.
 * Calls the 'logger' function.
 * @param string msg Message to write.
 */
function writeLog(msg, force) {
  logger(msg, force);
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
    writeLog("ERROR! Source, '" + opts.src + "' is not a file and could not be processed.", FORCE_LOG);
    writeLog("Please check that '" + opts.src + "' is a valid file and try again.", FORCE_LOG);
    return false;
  }

  // opts.output
  if (opts.output.length < 1) {
    writeLog("ERROR! You must specify a name for the output videos.", FORCE_LOG);
    return false;
  }

  // opts.vbr
  if (opts.vbr.toLowerCase().lastIndexOf('k') != opts.vbr.length - 1) {
    writeLog("ERROR! 'vbr' expected to be in kilobits. Should end with 'k', e.g., '700k'.", FORCE_LOG);
    return false;
  }

  // opts.abr
  if (opts.abr.toLowerCase().lastIndexOf('k') != opts.abr.length - 1) {
    writeLog("ERROR! 'abr' expected to be in kilobits. Should end with 'k', e.g., '128k'.", FORCE_LOG);
    return false;
  }

  // opts.formats
  // var formatsIsArray = opts.formats instanceof Array;
  var formatsIsArray = Array.isArray(opts.formats);
  if (!formatsIsArray) {
    writeLog("ERROR! 'formats' must be an array.", FORCE_LOG);
    return false;
  }

  if (opts.formats.length < 1) {
    writeLog("ERROR! You must specify at least one format in 'formats'.", FORCE_LOG);
    return false;
  }

  if (opts.formats[0] == 'all') {
    opts.formats = FORMAT_ALL;
  }

  for (var i = 0; i < opts.formats.length; ++i) {
    var format = opts.formats[i];
    if (FORMAT_ALL.indexOf(format) < 0) {
      writeLog("ERROR! Format '" + format + "' is not a valid format. Use help to see the list of valid formats.", FORCE_LOG);
      return false;
    }
  }

  // opts.width
  var w = parseInt(opts.width);
  if (isNaN(w)) {
    writeLog("ERROR! Width '" + opts.width + "' cannot be interpreted as an integer value.", FORCE_LOG);
    return false;
  }

  // opts.height
  var h = parseInt(opts.height);
  if (isNaN(h)) {
    writeLog("ERROR! Height '" + opts.height + "' cannot be interpreted as an integer value.", FORCE_LOG);
    return false;
  }

  // opts.poster
  if (opts.poster.length < 1) {
    writeLog("ERROR! You must specify a name for the poster image.", FORCE_LOG);
    return false;
  }

  // opts.posterTimestamp
  var ts = parseInt(opts.posterTimestamp);
  if (isNaN(ts)) {
    writeLog("ERROR! You must specify a poster timestamp in seconds. E.g., '4'.", FORCE_LOG);
    return false;
  }

  return true;
};

/**
 * Checks if a path is absolute.
 * Works for OSX/Linux style paths: /my/absolute/path
 * and
 * Windows style paths: c:\my\absolute\path
 *
 * @param string path Path to test.
 * @return boolean True if the path is absolute.
 */
var isAbsolutePath = function(path) {

  var lower = path.toLowerCase();
  if (lower.substring(0, 1) == '/') {
    // OSX, Linux
    return true;
  } else if (/[a-z]{1}:/.test(lower.substring(0, 2))) {
    // Windows
    return true;
  }

  return false

};

/**
 * Builds an absolute file path.
 *
 * @param string file File to absolute-ify.
 * @return string Absolute path to 'file'.
 */
var getAbsolutePathToFile = function(file) {

  if (isAbsolutePath(file)) {
    return file;
  }

  var cwd = process.cwd();

  return cwd + path.sep + file;

};

/**
 * Reads sizing dimensions from options.
 *
 * @param object opts Options passed into encoder.
 * @return object Object describing the dimensions.
 */
var readDimensions = function(opts) {

  var dims = {
    hasW: false,
    hasH: false,
    w:    -1,
    h:    -1
  };

  dims.hasW = opts.hasOwnProperty('width');
  dims.hasH = opts.hasOwnProperty('height');

  if (dims.hasW) {
    dims.w = parseInt(opts.width);
    if (isNaN(dims.w) || dims.w < 1) {
      dims.w = -1;
      dims.hasW = false;
    }
  } else {
    dims.w = -1;
    dims.hasW = false;
  }

  if (dims.hasH) {
    dims.h = parseInt(opts.height);
    if (isNaN(dims.h) || dims.h < 1) {
      dims.h = -1;
      dims.hasH = false;
    }
  } else {
    dims.h = -1;
    dims.hasH = false;
  }

  return dims;

};

/**
 * Parses dimensions from 'readDimensions()' into a size value
 * for fluent-ffmpeg.
 *
 * @param object dims Dimensions object from 'readDimensions()'.
 * @return string Size value to use with fluent-ffmpeg.
 */
var parseSize = function(dims) {

  var size = '';
  if (dims.hasW && dims.hasH) {
    size = dims.w + 'x' + dims.h;
  } else if (dims.hasW && !dims.hasH) {
    size = dims.w + 'x?';
  } else if (!dims.hasW && dims.hasH) {
    size = '?x' + dims.h;
  } else {
    size = '';
  }

  return size;

};

/**
 * Processes the options and builds a list
 * of encoding configs.
 *
 * @param object opts Options passed into the class.
 * @return array List of encoding options.
 */
var processOptions = function(opts) {

  videoOptions = [];
  var opt;

  var outDir = '';

  opts.formats.forEach(function(format, index, arr) {
    opt = {
      type:    TYPE_VIDEO,
      src:     opts.src,
      out:     opts.output + '.' + formats[format].ext,
      vbr:     opts.vbr,
      abr:     opts.abr,
      vcodec:  formats[format].vcodec,
      acodec:  formats[format].acodec,
      ext:     formats[format].ext,
      oformat: formats[format].outputFormat,
      size:    parseSize(readDimensions(opts)),
      opts:    opts.options.concat(formats[format].opts)
    };

    var dir = path.dirname(opt.out);
    outDir = dir;
    var stats = fs.lstatSync(dir);
    if (!stats.isDirectory()) {
      writeLog("Directory '" + dir + "' does not exist. Creating it...", opts.verbose);
      try {
        mkdirp.sync(dir);
      } catch (err) {
        writeLog("ERROR: Unable to create '" + dir + "'", FORCE_LOG);
        writeLog("  " + err.message, FORCE_LOG);
        process.exit(-1);
        return;
      }
    }

    writeLog("Processing format '" + format + "'...", opts.verbose);
    writeLog("  Source: " + opt.src, opts.verbose);
    writeLog("  Output: " + opt.out, opts.verbose);
    writeLog("  Video Bitrate: " + opt.vbr, opts.verbose);
    writeLog("  Audio Bitrate: " + opt.abr, opts.verbose);
    writeLog("  Video Codec: " + opt.vcodec, opts.verbose);
    writeLog("  Audio Codec: " + opt.acodec, opts.verbose);
    writeLog("  Output Size: " + opt.size, opts.verbose);
    writeLog("  Extra Options: " + opt.opts, opts.verbose);

    if (!options.onlyPoster) {
      videoOptions.push(opt);
    }
  });

  if (opts.hasOwnProperty('poster')) {
    opt = {
      type: TYPE_POSTER,
      src:  opts.src,
      out:  outDir,
      name: opts.poster,
      time: opts.posterTimestamp,
      size: parseSize(readDimensions(opts))
    };

    writeLog("Processing poster image...", opts.verbose);
    writeLog("  Source: " + opt.src, opts.verbose);
    writeLog("  Output: " + opt.out, opts.verbose);
    writeLog("  Name: "   + opt.name, opts.verbose);
    writeLog("  Time: " + opt.time, opts.verbose);
    writeLog("  Output Size: " + opt.size, opts.verbose);

    videoOptions.push(opt);
  }

  currentVideo = 0;
  return videoOptions;
};

/**
 * Default `onProgress` event handler.
 */
var defaultProgressHandler = function(progress) {
  if (options.verbose || options.progress) {
    var s = CLEAR_LINE + "  Encoding: " + progress.percent.toFixed(2) + "% "
          + "current rate: " + progress.currentFps + "fps, "
          + progress.currentKbps + "kbps, "
          + "target size: " + progress.targetSize + "kB, "
          + "time: " + progress.timemark + "s" + CARRIAGE_RETURN;
    util.print(s);
  }
};

/**
 * Sets the progress handler function.
 */
var setProgressHandler = function(progFunc) {
  progressHandler = progFunc;
}
setProgressHandler(defaultProgressHandler);

/**
 * Shows encoding progress.
 *
 * @param object progress Object with progress data.
 */
var onProgress = function(progress) {
  progressHandler(progress);
};

/**
 * Default `complete` function handler.
 */
var defaultCompleteHandler = function() {
  writeLog("Done encoding all videos!", FORCE_LOG);
};

/**
 * Sets the complete function handler.
 */
var setCompleteHandler = function(doneFunc) {
  completeHandler = doneFunc;
};
setCompleteHandler(defaultCompleteHandler);

/**
 * Called when all encoding is complete.
 */
var onComplete = function() {
  completeHandler();
}

/**
 * Encodes the next video.
 */
var next = function() {
  currentVideo++;
  if (currentVideo < videoOptions.length) {
    encode(videoOptions[currentVideo]);
  } else {
    onComplete();
  }
};

/**
 * Default `encodeComplete` event handler.
 */
var defaultEncodeCompleteHandler = function(stdout, stderr) {
  util.print(CARRIAGE_RETURN + CLEAR_LINE);
  util.print("\n");
  var current = videoOptions[currentVideo].out;
  writeLog("Done encoding '" + current + "'.", FORCE_LOG);

  next();
};

/**
 * Sets the complete hanlder function.
 */
var setEncodeCompleteHandler = function(compFunc) {
  encodeCompleteHandler = compFunc;
};
setEncodeCompleteHandler(defaultEncodeCompleteHandler);

/**
 * Complete handler for encoding.
 *
 * @param object stdout
 * @param object stderr
 */
var onEncodeComplete = function(stdout, stderr) {
  encodeCompleteHandler(stdout, stderr);

  if (encodeCompleteHandler != defaultEncodeCompleteHandler) {
    next();
  }
};

/**
 * Does the actual encoding work for videos.
 *
 * @param object vid Video options object that describes how the video should be encoded.
 */
var encodeVideo = function(vid) {

  writeLog("Encoding '" + vid.out + "'...", FORCE_LOG);
  writeLog("", options.verbose);

  var proc = ffmpeg({ source: vid.src, timeout: options.timeout, nolog: !options.verbose })
      .withVideoBitrate(vid.vbr)
      .withVideoCodec(vid.vcodec)
      .withAudioBitrate(vid.abr)
      .withAudioCodec(vid.acodec)
      .withAudioChannels(2)
      .toFormat(vid.oformat)
      .onProgress(onProgress);

  if (vid.size != '') {
    proc.withSize(vid.size);
  }

  if (vid.opts.length > 0) {
    proc.addOptions(vid.opts);
  }

  proc.saveToFile(vid.out, onEncodeComplete);

};

/**
 * Does the actual encoding work for posters (images).
 *
 * @param object post Poster options object.
 */
var encodePoster = function(post) {

  var proc = new ffmpeg({ source: post.src, timeout: options.timeout, nolog: !options.verbose });

  if (post.size) {
    proc.withSize(post.size);
  }

  proc.takeScreenshots({
      count: 1,
      timemarks: [ post.time.toString() ],
      filename: post.name
    }, post.out, function(err, filenames) {
      writeLog(filenames, FORCE_LOG);
      writeLog('Screenshots were saved.', options.verbose);
      onEncodeComplete();
  });

};


/**
 * Encodes a video.
 *
 * @param object vid Video options for encoding.
 */
var encode = function(vid) {

  if (vid.type == TYPE_VIDEO) {
    encodeVideo(vid);
  } else if (vid.type == TYPE_POSTER) {
    encodePoster(vid);
  } else {
    writeLog("Unknown video type '" + vid.type + "'.", FORCE_LOG);
    return;
  }

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
 * @param boolean onlyPoster Only encode the poster image.
 * @param boolean verbose Whether or not to log extra stuff.
 * @param boolean progress Like 'verbose' but just show encoding progress.
 * @param int timeout Timeout for ffmpeg encoding.
 * @param array opts List of extra options.
 */
var run = function(src, out, vbr, abr, formats, width, height, poster, posterTimestamp, onlyPoster, verbose, progress, timeout, opts) {

  options.src             = getAbsolutePathToFile(src);
  options.output          = (typeof out != 'undefined') ? getAbsolutePathToFile(out.replace('{src_name}', src)) : options.output.replace('{src_name}', src);
  options.vbr             = vbr || options.videoBitrate;
  options.abr             = abr || options.audioBitrate;
  options.formats         = formats || options.formats;
  options.width           = parseInt(width) || options.width;
  options.height          = parseInt(height) || options.height;
  options.poster          = (typeof poster != 'undefined') ? getAbsolutePathToFile(poster.replace('{src_name}', src)) : options.poster.replace('{src_name}', src);
  options.posterTimestamp = posterTimestamp || options.posterTimestamp;
  options.onlyPoster      = (onlyPoster === true) ? true : false;
  options.verbose         = (verbose === true) ? true : false;
  options.progress        = (progress === true) ? true : false;
  options.timeout         = timeout || 600; // 10 minutes
  options.options         = opts || [];

  if (options.verbose || options.progress) {
    // Clear up the console as we make a mess of things
    process.on('SIGINT', function() {
      util.print(CARRIAGE_RETURN + CLEAR_LINE);
      process.exit();
    });
  }

  if (validate(options)) {
    // Process
    var vids = processOptions(options);
    encode(vids[currentVideo]);
  }

};

module.exports.run  = run;
module.exports.next = next;

module.exports.setLogger                = setLogger;
module.exports.setProgressHandler       = setProgressHandler;
module.exports.setEncodeCompleteHandler = setEncodeCompleteHandler;
module.exports.setCompleteHandler       = setCompleteHandler;
