# salliedforth.js

A non-legal version of Forth.

Will explore whether to eventually work directly with Asm.js is both possible and desirable.

I rose at the dawn, and without asking or bestowing a blessing, sallied forth into the high road to the city which passed near the house. I left nothing behind, the loss of which I regretted. I had purchased most of my own books with the product of my own separate industry, and their number being, of course, small, I had, by incessant application, gotten the whole of them by rote. They had ceased, therefore, to be of any further use. I left them, without reluctance, to the fate for which I knew them to be reserved, that of affording food and habitation to mice.

__Arthur Mervyn__

By non-legal I mean it doesn't strictly follow any Forth standard. The intention more is to create a simple and pragmatic Forth-a-like language implementation in JavaScript. There is no real use-case yet for this, other than as a workpad for exploring features and implementations of the Forth language. As there is no adherence to any Forth standard, I am free to bring in any features from other languages.

As mentioned, this was intended to utilize Asm.js for mega speed, but I am considering other paths..

## Design decisions

### Using dynamic features of the implementation language

* No memory addresses
  ** Function references are ok
  ** No pointer maths
* Anonymous functions
* Values stored in a global object by name

## Testing

Tests are included and run from the main index.html page at present. This project uses the excellent Jasmine library.

## TODO

* loops or recursion or both
  ** is recursion possible?
* decide whether to use JS version of truthy or nearer to Clojure/ClojureScript.
* should stack under & overflows fail silently and not modify the stack or should they throw an exception?
  Maybe this could be a setting, a user choice?
  Alternatively, set a(n) error function(s).

## DONE
* anonymous functions? [26/12/2013]
  how to define
  no need to add them to the dictionary
* Investigate whether to store named values in the Dictionary or
separately in a JS Object masquerading as a HashMap?
  **Object/HashMap for now** [26/12/2013]