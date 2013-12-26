# salliedforth.js

A non-legal version of Forth.

See http://jococo.github.io/sallied-forth/ for some explanation and to try the live, in-browser REPL.

Will explore whether to eventually work directly with Asm.js is both possible and desirable.

I rose at the dawn, and without asking or bestowing a blessing, sallied forth into the high road to the city which passed near the house. I left nothing behind, the loss of which I regretted. I had purchased most of my own books with the product of my own separate industry, and their number being, of course, small, I had, by incessant application, gotten the whole of them by rote. They had ceased, therefore, to be of any further use. I left them, without reluctance, to the fate for which I knew them to be reserved, that of affording food and habitation to mice.

__Arthur Mervyn__

By non-legal I mean it doesn't strictly follow any Forth standard. The intention more is to create a simple and pragmatic Forth-a-like language implementation in JavaScript. There is no real use-case yet for this, other than as a workpad for exploring features and implementations of the Forth language. As there is no adherence to any Forth standard, I am free to bring in any features from other languages.

As mentioned, this was intended to utilize Asm.js for mega speed, but I am considering other paths..

## Design decisions

* lowercase words NO SHOUTING!!

### Using dynamic features of the implementation language

* No memory addresses
  ** Function references are ok
  ** No pointer maths
* Anonymous functions
* Values stored in a global object by name

## Testing

Tests are included and run from the main index.html page at present. This project uses the excellent Jasmine library.

## TODO

* look into vocabularies / namespaces?
* loops or recursion or both
  ** is recursion possible?
* decide whether to use JS version of truthy or nearer to Clojure/ClojureScript.
* should stack under & overflows fail silently and not modify the stack or should they throw an exception?
  Maybe this could be a setting, a user choice?
  Alternatively, set a(n) error function(s).
* collections
  js arrays, objects (Is this a good time to look at mori?)
* javascript interop

## DONE

* word definitions in forth at startup! [26/12/2013]
* comments [26/12/2013]
* anonymous functions? [26/12/2013]
  how to define
  no need to add them to the dictionary
* Investigate whether to store named values in the Dictionary or
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
