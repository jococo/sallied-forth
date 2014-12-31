# salliedforth.js

[![Build Status](https://travis-ci.org/jococo/sallied-forth.svg?branch=master)](https://travis-ci.org/jococo/sallied-forth)

A non-legal version of Forth.

See http://jococo.github.io/sallied-forth/ for some explanation and to try the live, in-browser REPL.

Will explore whether to eventually work directly with Asm.js is both possible and desirable.

> I rose at the dawn, and without asking or bestowing a blessing, sallied forth into the high road to the city which passed near the house. I left nothing behind, the loss of which I regretted. I had purchased most of my own books with the product of my own separate industry, and their number being, of course, small, I had, by incessant application, gotten the whole of them by rote. They had ceased, therefore, to be of any further use. I left them, without reluctance, to the fate for which I knew them to be reserved, that of affording food and habitation to mice.

__Arthur Mervyn__

By non-legal I mean it doesn't strictly follow any Forth standard. The intention more is to create a simple and pragmatic Forth-a-like language implementation in JavaScript. There is no real use-case yet for this, other than as a workpad for exploring features and implementations of the Forth language. As there is no adherence to any Forth standard, I am free to bring in any features from other languages.

As mentioned, this was intended to utilize Asm.js for mega speed, but I am considering other paths..

## Quick start

Either clone this git repository with:

  git checkout https://github.com/jococo/sallied-forth.git

or clone it with the github application.

You will find a full, minified version of salliedforth.min.js in the directory `build/js/`

### A simple web server

In the root folder, froma terminal, run the command:

  npm install

And, when this has finished, type

  npm start

To launch the `local-web-server` app from NPM. Then visit

  http://localhost:8000/

in a web browser. This will initially show you a listing of the files and folders in the root of your project. Click on the 'examples' folder and you will be taken to the local web pages that demonstrate some example code. Also you can access a web based repl and run the Jasmine unit tests for the project (They only take a few seconds to run.)

### Opening a REPL

Type the `repl` command into terminal or command line as so:

`./repl

This allows you to interactively enter forth words and see the results immediately.

Please  note: the `repl` command use `rlwrap` available from:

https://github.com/hanslub42/rlwrap

to give more modern console usage such as history and keyboard navigation. Enter `ctrl+c` to exit the repl.

At this time I have produced a Windows version of the repl. This shouldn't be difficult and will be created when I am next near a Windows pc. For now, you should be able to run:

  node repl.js

although I haven't tested this for Windows compatibility yet.

## Design decisions

* lowercase words NO SHOUTING!!
* The wrong brackets. Hmm, this one might be a bit frustrating if you are the sort of person who is used to the more standard Forth syntax (if you can pick one..), and I guess it must be annoying that everyone and their pet writes a non-standard Forth nowadays. But I am trying out using the brackets as a JavaScript dev might use them. {} braces for code, [] braces for Arrays. I think this will be less confusing with JavaScript interop. I am willing to discuss. Create a GitHub issue if it annoys, frustrates or disturbs you and we can talk.

### Using dynamic features of the implementation language

* No memory addresses
  ** Function references are ok
  ** No pointer maths
* Anonymous functions
* Values stored in a global object by name

## Testing

Tests are included and run from the main index.html page at present. This project uses the excellent Jasmine library.

Most features have been developed with accompanying tests and they will be enhanced as the project evolves.

## Possible Enhancements

- some kind of async messaging between forth and javascript.
- persistence for forth scripts.


## TODO


- [ ] look into vocabularies / namespaces?
  *- [ ] also tidy order of word-sets
- [x][ ][ ] loops or recursion or both
  *- [ ] is recursion possible?
- [ ] decide whether to use JS version of truthy or nearer to Clojure/ClojureScript.
- [ ] run test auto with Grunt
- [ ] REPL input needs history

## DONE

- [x] javascript interop [1/1/2014]
  - [x] pass JS context into interpreter
  - [x] getting JS property values
  - [x] setting JS property values
  - [x] execute JS function (no params)
  - [x] execute JS function (w/ params)
  - [x] execute JS function (w/ return)
  - [x] execute JS console.log function (needs console context)
- [x] collections [27/12/2013]
  js arrays, objects (Is this a good time to look at mori?)
- BREAKING CHANGES!! start [all 27/12/2013]
- [x] interpreter will return a list of results in JS native datastructures where possible, will probably wrap with an error status. This is to improve JS interop.
- [x] result format will be: {data: [<array of values>...], status: TBD, stackLength: 1}, a JS class ResponseData, so that status codes can be standardised.
- BREAKING CHANGES!! end
- [x] Errors are thrown by default now, can be overriden by setting your own error function. [26/12/2013]
- [x] Grunt build and test tags [26/12/2013]
- [x] word definitions in forth at startup! [26/12/2013]
- [x] comments [26/12/2013]
- [x] anonymous functions? [26/12/2013]
  how to define
  no need to add them to the dictionary
- [x] Investigate whether to store named values in the Dictionary or
separately in a JS Object masquerading as a HashMap?
  **Object/HashMap for now** [26/12/2013]

## License

The MIT License (MIT)

Copyright (c) 2013 Joc O'Connor

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
