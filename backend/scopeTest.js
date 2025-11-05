// var: Function-scoped and redeclarable/reassignable
var x = 10;
if (true) {
  var x = 20; // Re-declaration/re-assignment in the same scope
  console.log("var", x); // Output: 20
}
console.log(x); // Output: 20 (leaked out of the block)

// let: Block-scoped and reassignable, but NOT redeclarable
let y = 10;
if (true) {
  let y = 20; // New variable in block scope
  console.log("let", y); // Output: 20
}
console.log(y); // Output: 10 (block-scoped)

// const: Block-scoped, NOT reassignable, NOT redeclarable
const z = 10;
// z = 20; // TypeError: Assignment to constant variable.
const obj = { a: 1 };
obj.a = 2; // This is allowed! (Mutating the object's property, not the binding itself)

