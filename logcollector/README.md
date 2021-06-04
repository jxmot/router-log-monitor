# Log Collector

When I started the initial design of this this part of the project I investigated handling all of the IMAP interactions with JavaScript and Node.js. 

I did a lot of research on IMAP and the availability of libraries in NPMs or PHP. What I found kind of surprised me a bit. I *expected* that Node.js would have some up to date, and active NPMs available for use. But that's not what I found. 

* Some were unmaintained, it has been years since an issue was closed or code was updated.
* Some were just impractical. Like the self-hosted API and a library to interact with it.
* Some had a large code footprint, and were over complicated for basic use.

Please note that I am a *fan* of Node.js. I like it, and I like coding for Node.js. There are a lot of *good* NPM packages for it. But... sometimes a Node.js application is just too "fat" when compared to what it *actually does*. For example, one of the "proof of concept" applications I put together ended up using around 4 meg of space and it was only about a dozen lines of active code. Where? in the `node_modules` folder of course!

So I switched over to PHP and in a short time I had something *working*. I can open the connection to the server, download headers, and download the header and message body, process the body and save it! And it *only* used about 10 **kilobytes** of code space. No extra libraries, no fluff, no unused deeply hidden stuff in `node_modules` either!

And in 99% of PHP installations the proper IMAP module is already there. And there's also better *compatibility* across versions of PHP. The same code I write when developing and testing under 5.6 will also work without modification under PHP 7.2.

So for this particular application PHP makes more sense than JavaScript on Node.js. Well, at least for *part* of it. There is a Node.js side to this project. Its purpose will be to finish the processing and parsing of the files that were saved by the PHP side. It will also write the parsed data to a MySQL database and generate static report content each time it finishes processing a file.

# Application Architecture Overview 

<p align="center">
  <img src="./mdimg/log-collector-arch.png" alt="Index Page" txt="Log Collector Architecture"  width="60%" height="80%"/>
</p>

## Design

## Running the Application

### Configuration

There are two JSON formatted files used for configuration:

**`appoptions.json`**:


**`imapaccnt.json`**: 

### CRON


### Command Line


### Console Output


