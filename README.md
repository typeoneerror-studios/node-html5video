# html5video

A command line and [Node](http://nodejs.org) utility for encoding HTML5-ready videos.

## Overview

Fully supporting HTML5 video involves [encoding your videos in multiple formats](http://blog.zencoder.com/2010/10/06/how-many-formats-do-i-need-for-html5-video/) which is a cumbersome process begging for automation. `html5video` (`h5v`) eases your pain, allowing you to encode to the [big three web video formats](http://en.wikipedia.org/wiki/HTML5_video#Supported_video_formats) (h264, webm and ogv) along with a poster image all in a single line. `h5v` can also be hooked into your Node programs if you so desire.

## Installation

In order to use `h5v` you must first have [ffmpeg](http://www.ffmpeg.org/) (along with all encoding libraries like libx264 and libmp3lame) installed on your system. Once you have ffmpeg installed just open a command prompt and type:

    $ npm install -g git://github.com/typeoneerror-studios/node-html5video.git

To verify the installation type:

    $ html5video --help

or the short version

    $ h5v -h

## Using h5v From the Command Line

### The Basics

The primary goal of `h5v` is to make video encoding a no-brainer. As such `h5v` only requires two options to run `src`, or `s` and `out`, or `o`. These options specify the source video and the output video name (without extension) respectively.

    $ h5v --src my_src_video.mov --out my_html5_video

This will encode "my_html5_video.mp4" (h264), "my_html5_video.webm" (webm), and "my_html5_video.ogv" (ogg) from the source video, "my_src_video.mov". This will also save out a jpg called "poster.jpg" to serve as the poster image while your video loads. Note that all file paths are relative to the location from which you are executing `h5v`.

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
    $ h5v -s my_src_video.mov -o my_html5_video -w 200 -h 500

### Bitrates

Video looking grainy? Audio sounding crappy? Adjust their bitrates:

    # Adjusting the video bitrate, short version
    $ h5v --src my_src_video.mov --out my_html5_video -vbr 1500k

    # Adjusting the video bitrate, long version
    $ html5video --src my_src_video.mov --out my_html5_video --videobitrate 800k

    # Adjusting the audio bitrate, short version
    $ h5v --src my_src_video.mov --out my_html5_video -abr 256k

    # Adjusting the audio bitrate, long version
    $ html5video --src my_src_video.mov --out my_html5_video --audiobitrate 512k

    # And of course you can do both at once:
    $ html5video --src my_src_video.mov --out my_html5_video --audiobitrate 512k -vbr 1500k

### Specifying Output Formats

By default `h5v` encodes to three formats:

1. [h264](http://en.wikipedia.org/wiki/H.264/MPEG-4_AVC)
2. [webm](http://en.wikipedia.org/wiki/WebM)
3. [ogg](http://en.wikipedia.org/wiki/Ogg)

If you don't want to encode to all of these formats you can specify one of them instead:

    # Only encode a webm video
    $ h5v -s my_src_video.mov -o -my_html5_video -f webm

You can also specify more than one of them:

    # Encode webm and h264
    $ h5v -s my_src_video.mov -o -my_html5_video --formats webm,h264

### Poster Images

By default `h5v` will encode a poster image called "poster.jpg" and save it alongside your encoded videos. You can specify a different name for this image with the `poster` option:

    $ h5v -s my_src_video.mov -o -my_html5_video --poster my_poster

Also by default the poster image will be taken at from the exact start of the video. You can change this by passing in a different time (in seconds):

    # Take the poster image at the 5 second mark
    $ h5v -s my_src_video.mov -o -my_html5_video --postertime 5

If you're trying to hone in a good time to grab your poster image and don't want to re-encode all your videos just to get another poster use the `onlyposter` option:

    # Skip video encoding and just grab a poster image
    $ h5v -s my_src_video.mov -o -my_html5_video --postertime 5 --onlyposter

### Timeout and Other Options

`h5v` will timeout after 10 minutes by default, meaning your video must encode in less than 10 minutes (timeout is per-video). You can adjust this with the `timeout` option:

    # Change the timeout to 20 minutes, or 1200 seconds
    $ h5v -s my_src_video.mov -o -my_html5_video --timeout 1200

ffmpeg supports [plenty of options](http://ffmpeg.org/ffmpeg.html#Options) that are not exposed by the `h5v` API. The `options` option provides a way for you to pass these extra options into `h5v`. Extra options are passed in much like you would were you using ffmpeg directly with a comma separating each option.

    # Pass in a single option
    $ h5v -s my_src_video.mov -o -my_html5_video --options -ab 160000

    # Pass in two options
    $ h5v -s my_src_video.mov -o -my_html5_video --options -ab 160000,-g 30

### Logging

There are two options for logging output with `h5v`: `progress` and `verbose`. By default `progress` in enabled, giving you progress updates as your video is encoded. `verbose` gives you much more information and is primarily used to diagnose problems. It is off by default.

    # Disable progress
    $ h5v -s my_src_video.mov -o -my_html5_video --progress false

    # Enable verbose logging
    $ h5v -s my_src_video.mov -o -my_html5_video --verbose

## Other Things to Keep In Mind

- All file paths are relative to where you are executing `h5v`.
- If you cannot encode a video in a specific format make sure ffmpeg knows about the format by typing `ffmpeg -formats` into your command prompt. This will display a list of formats that ffmpeg is aware of.

## License

html5video is licensed under the MIT license.
