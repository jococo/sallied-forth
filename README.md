# forthasm.js

A non-legal version of Forth written to eventually work directly with Asm.js.

I rose at the dawn, and without asking or bestowing a blessing, sallied forth into the high road to the city which passed near the house. I left nothing behind, the loss of which I regretted. I had purchased most of my own books with the product of my own separate industry, and their number being, of course, small, I had, by incessant application, gotten the whole of them by rote. They had ceased, therefore, to be of any further use. I left them, without reluctance, to the fate for which I knew them to be reserved, that of affording food and habitation to mice.

__Arthur Mervyn__

By non-legal I mean it doesn't strictly follow any Forth standard. The intention more is to create a simple and pragmatic Forth-a-like language implementation in JavaScript.

As mentioned, this was intended to utilize Asm.js for mega speed, but I am considering other paths..

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


