# static-on-rails

A feather weight tool to build static applications:

* Feather-weight self-contained framework for building purely static
  application.
* No yet-another templating system for Javascript.  Page view
  construction is via standard DOM manipulating in Javascript (powered
  by the jsdom).
  * Full support to reusable partial page views.
* Simple and easy-to-use development environment that does not require
  any build process or server restart throughout coding practice.
* Turn key solution for building deployment package
  * JS/CSS compression is handled transparently (powered by yuglify).


## Installation

```text
npm install static-on-rails -g
```

## Use

There are two commands:

### static-init

static-init helps to generate a scaffold static application, which
servers as both an example and a basis for further development.  To
use:

```text
> mkdir app-name
> cd app-name
> static-init
```

After running these commands you will have a directory "app-name" will
an example application in it.  An static-on-rails application has the
following structure:

* app
* js
* css
* html
* json
* images
* fonts
* js_css.json
* config.json

##### app

This is the directory where all your pages are at.  In classic MVC
model, this directory corresponds to the controllers.  With in this
directory, there are page directories, each of which contains the
entry point for a specific page.  In the scaffold that is
auto-generated, there is an example page directory that can be
followed to develop other page directories.

To view the page:

* Start a static http server and point its root at the app-name directory.
* Go to URL:

```text
http://localhost/app/page-name/page-name.html
```

##### assets: js, css, html, json, images, fonts

The directories js, css, html and json are places to store the assets.
The names of these directories are self-explaining.


##### js_css.json

The file js_css.json is a centraized place that contains the
information of CSS and JS packages that are used in the construction
of the pages.  Here is an example of the js_css.json:

```json
{
    "js": {
        "shared": [
            "/js/env.js",
            "/js/properties.js"
        ],
        "example": [
            "/js/example/example.js"
        ]
    },
    "css": {
        "example": [
            "/css/example.css"
        ]
    }
}
```

There are two sections, for js and css respectively.  Each section is
grouped in packages.  Each package will eventually be merged and
minified to one single file.

##### config.json

The file config.json contains a list of global configurations for
building the project to a deployment package.

```json
{
    "jquery-path": "/js/lib/jquery-1.8.3.min.js",  /* mandatory, jquery path */
    "excluded-apps": "example" /* optional, list of apps to exclude from the build */
}
```

### static-build

You can package up you development of the static application to a
release package by typing the following command:

```text
static-build
```

This will generate a build diretory in the working directory, which
includes self-contained static application.  It has all the required
assets, compressed js and css files as well as entry point html pages
to the static applications.

## How to Write a Static Application

To write a static application named "bar":

* Create a directory under the "app" directory and name is "bar".
* Create two files under "bar" directory
  * "bar.html"
  * "bar.js"

### app-name.html

"bar.html" is the entry point of your static application.  Here's a sample:

```html
<!DOCTYPE html>
<head>
    <title>Static on Rails Example</title>
    <meta charset="utf-8">
    <meta property="og:locale" content="en_US"/>
    <meta property="og:type" content="website"/>
</head>

<body id="body">

<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
<script type="text/javascript" src="//cdnjs.cloudflare.com/ajax/libs/lodash.js/0.10.0/lodash.min.js"></script>
<script class="compiler exclude" type="text/javascript" src="/js/lib/dom.js"></script>
<script class="compiler exclude" type="text/javascript" src="/js/lib/cps.js"></script>
<script class="compiler" type="text/javascript" src="/js/env.js"></script>
<script class="compiler" type="text/javascript" src="/js/properties.js"></script>
<script class="compiler" type="text/javascript" src="/app/bar/bar.js"></script>

<script class="compiler">
    $.ajaxSetup({
        cache: false
    });

    var cb = function(err, res) {
        if (err) {
            throw err;
        }
    };

    __m__($, __dom__, cb);
</script>
</body>
</html>

```

The key customizable in this html is the inclusion of the application js file:

```html
<script class="compiler" type="text/javascript" src="/app/bar/bar.js"></script>
```

### app-name.js

"bar.js" hosts the code to construct the application page.  Here is an example:

```js
var __m__ = function($, dom, cb) {
    dom.page({
        env: __properties__[__env__],
        jquery: $,
        css: ['example'],
        js: ['shared', 'example'],
        html: [
            function(_, cb) {
                dom.loadHTML('/html/foobar.html', '#foobar', cb)
            },
            function(o, cb) {
                $('#body').append($(o));
                cb();
            },
            function(_, cb) {
                dom.loadJSON('/json/example.json', cb);
            },
            function(json, cb) {
                $('#body').append('<div>' + JSON.stringify(json) + '</div>');
                cb();
            }
        ]
    }, cb);
};

__m__;
```

The framework of this js file is fixed:

```js
var __m__ = function($, dom, cb) {
    dom.page({
        /* 
        Environment setup.  This is a framework convention which must be retained.
        */
        env: __properties__[__env__],  
        /*
        JQuery object setup.  This is a framework convention which must be retained. 
        */
        jquery: $,
        css: [/* list of your css packages */], 
        js: [/* list of your js packages */], 
        html: [
	    /*
	    This is where you template your page using the partial html templates.
	    */
        ]
    }, cb);
};

__m__;
```

You always copy this part for every app-name.js file.  The
construction of the page is via the APIs from the "dom" object.

### The dom object

The "dom" object has the following APIs:

* loadHTML(url, cssSelector, callback)
* loadJSON(url, callback)
* page(conf, callback)

##### loadHTML(url, cssSelector, callback)

The function "loadHTML" loads a html fragment, as identified by "url"
and "cssSelector" parameters, into the page (as result parameter of
the callback).  The application page can then be synthesized from
these fragments using jquery.

##### loadJSON(url, callback)

The function "loadJSON" loads JSON assets into the current page.  This
would be useful when part of the UI construction is directed by
configurations in JSON format.

##### page(conf, callback)

This function "page" is the top level function that constructs a static application. 
The conf object has the following fields:

* env: This is a required field by the framework convention.  Please always use the following setup:
```text
env: __properties__[__env__]
```
* jquery: This is a required field by the framework convention.  Please always use the following setup:
```text
jquery: $
```

* css: A list of all css packages that are to be included in the page.
  A css package is mapped to a list of css files in the "js_css.json"
  file.  Each css package will be merged to one file and minified at
  build time to be included in the release/deployment package.

* js: A list of all js packages that are to be included in the page.
  A js package is mapped to a list of js files in the "js_css.json"
  file.  Each js package will be merged to one file and minified at
  build time to be included in the release/deployment package.

* html: A list of cps-style procedures to construct the html
  structure of the page.  Note that "loadHTML" and "loadJSON" function
  should be used here.


