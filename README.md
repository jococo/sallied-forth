# forthasm.js

A non-legal version of Forth written to eventually work directly with Asm.js

By non-legal I mean it doesn't strictly follow any Forth standard. The intention more is to create a simple and pragmatic Forth-a-like language implementation in JavaScript and, as mentioned, to utilize Asm.js for mega speed.

## Testing

Tests are included and run from the main index.html page at present. This project uses the excellent Jasmine library.

## TODO

* decide whether to use JS version of truthy or nearer to Clojure/ClojureScript.
* should stack overflows fail silently and not modify the stack or should they throw an exception?
  Maybe this could be a setting, a user choice?
  Alternatively, set a(n) error function(s).
* anonymous functions?
  how to define
  no need to add them to the dictionary
* Investigate whether to store named values in the Dictionary or separately in a JS Object masquerading as a HashMap?


