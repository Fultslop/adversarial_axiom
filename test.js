"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.noReturnTypeAnnotation = noReturnTypeAnnotation;
exports.voidReturnPost = voidReturnPost;
exports.neverReturnPost = neverReturnPost;
exports.voidFunctionWithPre = voidFunctionWithPre;
exports.validReturnPost = validReturnPost;
exports.validStringReturnPost = validStringReturnPost;
exports.validBooleanReturnPost = validBooleanReturnPost;
const { ContractViolationError, InvariantViolationError, snapshot, deepSnapshot } = require("@fultslop/axiom");
function noReturnTypeAnnotation(x) {
    return x;
}
function voidReturnPost(x) {
    console.log(x);
}
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
    const __axiom_result__ = (() => {
        console.log("executed with", x);
    })();
    if (!(console.log("side effect")))
        throw new ContractViolationError("POST", "console.log('side effect')", "voidFunctionWithPre");
    return __axiom_result__;
}
// Feature 5: @post result with valid return type is unaffected
// Should inject @post check normally with no warnings
/**
 * @post result >= 0
 */
function validReturnPost(x) {
    const __axiom_result__ = (() => {
        return Math.abs(x);
    })();
    if (!(__axiom_result__ >= 0))
        throw new ContractViolationError("POST", "result >= 0", "validReturnPost");
    return __axiom_result__;
}
// Feature 5b: Additional valid case with string return type
/**
 * @post result.length > 0
 */
function validStringReturnPost(x) {
    const __axiom_result__ = (() => {
        return x.toUpperCase();
    })();
    if (!(__axiom_result__.length > 0))
        throw new ContractViolationError("POST", "result.length > 0", "validStringReturnPost");
    return __axiom_result__;
}
// Feature 5c: Additional valid case with boolean return type
/**
 * @post result === true
 */
function validBooleanReturnPost(x) {
    const __axiom_result__ = (() => {
        return x > 0;
    })();
    if (!(__axiom_result__ === true))
        throw new ContractViolationError("POST", "result === true", "validBooleanReturnPost");
    return __axiom_result__;
}
