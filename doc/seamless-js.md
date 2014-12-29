## !Experimental Change! Seamless JS

This version is playing with the idea of having no distinction for the user between forth words and JavaScript properties and commands.

for instance:

`word document @` will return the window.document property if this word isn't defined in Forth.

Similarly,

`alert` would call the JavaScript alert function with whatever is on the top of the stack.

There allso needs to be support for accessing child properties and functions:

`word document.title @` returns the document title.

`console.log` applies the JavaScript function to the element returned from the top of the stack. The initial wrinkle we have here is that we need to somehow specify arity and how many parameters to send to the called function.

Two approaches:

1/ That JavaScript calls take an Array of paramters and the JavaScript function is called with

`fn.apply( args )`
where 'args' will be the Array sitting on the top of the stack.

This works OK but gets messy when you need to send Arrays to functions:

`[ [ 1 2 3 ] ] console.log`
would be needed to send the array of numbers rather than individual numbers.

2/ That we assume an arity of 0 unless we use another word to call the JS function, e.g.

`: console.log2 (n m -- ? ) 2 js-call console.log ;`
where 'js-call' is a word that expects the top parameter to be an integer specifying how many parameters to call the following JavaScript function with.

3/ That we use option 1/ but supply words to manipulate, make explicit, how many parameters we are sending:

`: console.log2 (a b -- ?) ..3 console.log ;`
This feels quite clean but need to decide on the format of the words for specifying the number of parameters.
All the parameter specifier words do is pop the required number of stack items into an array and push the array on to the stack.
