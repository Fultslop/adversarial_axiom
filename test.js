"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noReturnTypeAnnotation = noReturnTypeAnnotation;
exports.voidReturnPost = voidReturnPost;
exports.neverReturnPost = neverReturnPost;
exports.voidFunctionWithPre = voidFunctionWithPre;
exports.validReturnPost = validReturnPost;
exports.validStringReturnPost = validStringReturnPost;
exports.validBooleanReturnPost = validBooleanReturnPost;
const { ContractViolationError, InvariantViolationError } = require("fsprepost");
// fsprepost 1.1.2 — @post result type validation fixtures
// Feature 1: @post result without return type annotation
// Should NOT inject @post and should emit warning: "no return type is declared"
/**
 * @post result === 42
 */
function noReturnTypeAnnotation(x) {
    return x;
}
// Feature 2: @post result with void return type
// Should drop @post and warn: return type is 'void'
/**
 * @post result === undefined
 */
function voidReturnPost(x) {
    console.log(x);
}
// Feature 3: @post result with never return type
// Should drop @post and warn: return type is 'never'
/**
 * @post result === 0
 */
function neverReturnPost(x) {
    console.log(x); // Use x to avoid unused warning
    throw new Error('always throws');
}
// Feature 4: @post without result still works on void functions
// @pre should still be injected on void functions
/**
 * @pre x > 0
 * @post console.log('side effect')
 */
function voidFunctionWithPre(x) {
    if (!(x > 0))
        throw new ContractViolationError("PRE", "x > 0", "voidFunctionWithPre");
    console.log('executed with', x);
}
// Feature 5: @post result with valid return type is unaffected
// Should inject @post check normally with no warnings
/**
 * @post result >= 0
 */
function validReturnPost(x) {
    const result = (() => {
        return Math.abs(x);
    })();
    if (!(result >= 0))
        throw new ContractViolationError("POST", "result >= 0", "validReturnPost");
    return result;
}
// Feature 5b: Additional valid case with string return type
/**
 * @post result.length > 0
 */
function validStringReturnPost(x) {
    const result = (() => {
        return x.toUpperCase();
    })();
    if (!(result.length > 0))
        throw new ContractViolationError("POST", "result.length > 0", "validStringReturnPost");
    return result;
}
// Feature 5c: Additional valid case with boolean return type
/**
 * @post result === true
 */
function validBooleanReturnPost(x) {
    const result = (() => {
        return x > 0;
    })();
    if (!(result === true))
        throw new ContractViolationError("POST", "result === true", "validBooleanReturnPost");
    return result;
}
