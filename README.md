# html5video

A command line and [Node](http://nodejs.org) utility for encoding HTML5-ready videos.

## Overview

Fully supporting HTML5 video involves [encoding your videos in multiple formats](http://blog.zencoder.com/2010/10/06/how-many-formats-do-i-need-for-html5-video/) which is a cumbersome process begging for automation. `html5video` eases your pain, allowing you to encode to the [big three web video formats](http://en.wikipedia.org/wiki/HTML5_video#Supported_video_formats) (h264, webm and ogv) along with a poster image all in a single line. `html5video` can also be hooked into your Node programs if you so desire.

## Installation

In order to use `html5video` you must first have [ffmpeg](http://www.ffmpeg.org/) (along with all encoding libraries like libx264 and libmp3lame) installed on your system. Once you have ffmpeg installed just open a command prompt and type:

    $ npm install -g git://github.com/typeoneerror-studios/node-html5video.git

To verify the installation type:

    $ html5video --help

## Using html5video From the Command Line

### The Basics

The primary goal of `html5video` is to make video encoding a no-brainer. As such `html5video` only requires two options to run `src`, or `s` and `out`, or `o`. These options specify the source video and the output video name (without extension) respectively.

    $ html5video --src my_src_video.mov --out my_html5_video

This will encode "my_html5_video.mp4" (h264), "my_html5_video.webm" (webm), and "my_html5_video.ogv" (ogg) from the source video, "my_src_video.mov". This will also save out a jpg called "poster.jpg" to serve as the poster image while your video loads. Note that all file paths are relative to the location from which you are executing `html5video`.

### Resizing

Often your source video will be much larger than you need. In these cases you can use the resizing features of `html5video`:

    # Resize such that the output videos are 600 pixels wide.
    # The height will automatically be adjusted to maintain the
    # source video's aspect ratio.
    $ html5video --src my_src_video.mov --out my_html5_video --width 600

    # Resize such that the output videos are 300 pixels tall.
    # The width with automatically be adjusted to maintain the
    # source video's aspect ratio.
    $ html5video --src my_src_video.mov --out my_html5_video --height 300

    # Go nuts: resize the width and the height to whatever your heart's desire.
    $ html5video -s my_src_video.mov -o my_html5_video -w 200 -h 500

### Bitrates

Video looking grainy? Audio sounding crappy? Adjust their bitrates:

    # Adjusting the video bitrate, short version
    $ html5video --src my_src_video.mov --out my_html5_video -vbr 1500k

    # Adjusting the video bitrate, long version
    $ html5video --src my_src_video.mov --out my_html5_video --videobitrate 800k

    # Adjusting the audio bitrate, short version
    $ html5video --src my_src_video.mov --out my_html5_video -abr 256k

    # Adjusting the audio bitrate, long version
    $ html5video --src my_src_video.mov --out my_html5_video --audiobitrate 512k

    # And of course you can do both at once:
    $ html5video --src my_src_video.mov --out my_html5_video --audiobitrate 512k -vbr 1500k

### Specifying Output Formats

By default `html5video` encodes to three formats:

1. [h264](http://en.wikipedia.org/wiki/H.264/MPEG-4_AVC)
2. [webm](http://en.wikipedia.org/wiki/WebM)
3. [ogg](http://en.wikipedia.org/wiki/Ogg)

If you don't want to encode to all of these formats you can specify one of them instead:

    # Only encode a webm video
    $ html5video -s my_src_video.mov -o -my_html5_video -f webm

You can also specify more than one of them:

    # Encode webm and h264
    $ html5video -s my_src_video.mov -o -my_html5_video --formats webm,h264

### Poster Images

By default `html5video` will encode a poster image called "poster.jpg" and save it alongside your encoded videos. You can specify a different name for this image with the `poster` option:

    $ html5video -s my_src_video.mov -o -my_html5_video --poster my_poster

Also by default the poster image will be taken at from the exact start of the video. You can change this by passing in a different time (in seconds):

    # Take the poster image at the 5 second mark
    $ html5video -s my_src_video.mov -o -my_html5_video --postertime 5

If you're trying to hone in a good time to grab your poster image and don't want to re-encode all your videos just to get another poster use the `onlyposter` option:

    # Skip video encoding and just grab a poster image
    $ html5video -s my_src_video.mov -o -my_html5_video --postertime 5 --onlyposter

### Timeout and Other Options

`html5video` will timeout after 10 minutes by default, meaning your video must encode in less than 10 minutes (timeout is per-video). You can adjust this with the `timeout` option:

    # Change the timeout to 20 minutes, or 1200 seconds
    $ html5video -s my_src_video.mov -o -my_html5_video --timeout 1200

ffmpeg supports [plenty of options](http://ffmpeg.org/ffmpeg.html#Options) that are not exposed by the `html5video` API. The `options` option provides a way for you to pass these extra options into `html5video`. Extra options are passed in much like you would were you using ffmpeg directly with a comma separating each option.

    # Pass in a single option
    $ html5video -s my_src_video.mov -o -my_html5_video --options -ab 160000

    # Pass in two options
    $ html5video -s my_src_video.mov -o -my_html5_video --options -ab 160000,-g 30

### Logging

There are two options for logging output with `html5video`: `progress` and `verbose`. By default `progress` in enabled, giving you progress updates as your video is encoded. `verbose` gives you much more information and is primarily used to diagnose problems. It is off by default.

    # Disable progress
    $ html5video -s my_src_video.mov -o -my_html5_video --progress false

    # Enable verbose logging
    $ html5video -s my_src_video.mov -o -my_html5_video --verbose

## Using html5video in Node

Though `html5video` was intended to be run primarily from the command line it's also possible to use it via a Node application. To use `html5video` in your Node app simply require it like so:

    var html5video = require('html5video');

When used in Node, `html5video` has a single method `run()` that takes the following parameters, in order:

- __src:__             _(string)_ Relative path to the source video. Required.
- __out:__             _(string)_ Relative path to the output video. Optional. Default: {source-video-name}-html5.
- __vbr:__             _(string)_ Video bitrate in kbps, e.g., '700k'. Optional. Default: 700k.
- __abr:__             _(string)_ Audio bitrate in kbps, e.g., '128k'. Optional. Default: 128k.
- __formats:__         _(Array)_ Array of formats to encode, e.g, [ 'webm', 'h264' ]. Optional. Default: [] (empty array, all supported formats).
- __width:__           _(int)_ Width of the output video. Height will be auto-calculated to match aspect ratio of source video. Optional. Default: -1 (use source video width).
- __height:__          _(int)_ Height of the output video. Width will be auto-calculated to match aspect ratio of source video. Optional. Default: -1 (use source video height).
- __poster:__          _(string)_ Name of the poster image. Optional. Default: poster.
- __posterTimestamp:__ _(float)_ Time, in seconds, at which to generate the poster image. Optional. Default: 0.0.
- __onlyPoster:__      _(boolean)_ Only generate the poster image. Optional. Default: false.
- __verbose:__         _(boolean)_ Log lots of messagse with `console.log()`. Optional. Default: false.
- __timeout:__         _(int)_ Timeout, in seconds, before ffmpeg is considered unresponsive and its process killed. Optional. Default: 600 (10 minutes).
- __options:__         _(array)_ Optional extra ffmpeg options to pass in. Optional. Default: [] (empty array, no options).

The simplest usage would look like this:

    html5video.run('my-source-video.mov');

Using all the options would look like:

    html5video.run(

        'my-source-video.mov',      // src
        'my-html5-video',           // out
        '700k',                     // vbr
        '128k',                     // abr
        [ 'webm', 'h264', 'ogg' ],  // formats
        960,                        // width
        -1,                         // height
        'poster',                   // poster
        2,                          // posterTimestamp
        false,                      // onlyPoster
        true,                       // verbose
        600,                        // timeout
        []                          // options

    );

### Custom Logging

By default `html5video` simply writes log messages to `console.log()`. By setting a custom logger you can read `html5video` log messages and display them in your app. The log function has the following signature:

    myLogFunction(msg, force);

- __msg:__   _(string)_ The message to be logged.
- __force:__ _(boolean)_ Whether to force the message. Setting this to true will ensure the message is displayed even when `verbose` is `false`.

To set your custom logger use the `setLogger()` function:

    html5video.setLogger(myLogFunction);

Once set any subsequent logs will be routed to your custom logging function.

### Progress and Completion Events

You can handle `progress`, `encodeComplete` and `complete` events by setting a custom listener for each event.

#### Progress

The progress handler function has the following signature:

    myProgressFunction(progressObj);

Where `progressObj` is an `Object` with the following properties:

- __frames:__  The total processed frame count.
- __currentFps:__ The framerate at which FFMPEG is currently processing the file.
- __currentKbps:__ The throughput at which FFMPEG is currently processing the file.
- __targetSize:__ The current size of the target file.
- __timemark:__ The timestamp of the frame being processed right now.
- __percent:__ An estimation on the progress (metadata is used, durationsec * fps).

To set your custom progress function use the `addEventListener()` function:

    html5video.addEventListener(html5video.EVENT_PROGRESS, myProgressFunction);

### Encode Complete

The encode complete handler function has the following signature:

    myEncodeCompleteFunction();

To set your custom encode complete function use the `addEventListener()` function:

    html5video.addEventListener(html5video.EVENT_ENCODE_COMPLETE, myEncodeCompleteFunction);

### Complete

The complete handler function has the following signature:

    myCompleteFunction();

To set your custome complete function use the `addEventListener()` function:

    html5video.addEventListener(html5video.EVENT_COMPLETE, myCompleteFunction);

You can remove any event listener with the `removeEventListener()` function:

    html5video.removeEventListener(html5video.EVENT_COMPLETE);

## Setting the path to FFmpeg

You can set a custom path to FFmpeg (i.e., if you are packaging FFmpeg in an app) with the `setFfmpegPath()` function:

    html5video.setFfmpegPath('path/to/ffmpeg');

## Other Things to Keep In Mind

- All file paths are relative to where you are executing `html5video`.
- If you cannot encode a video in a specific format make sure ffmpeg knows about the format by typing `ffmpeg -formats` into your command prompt. This will display a list of formats that ffmpeg is aware of.

## License

html5video is licensed under the MIT license.
