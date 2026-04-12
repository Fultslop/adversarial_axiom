import {stringTestFn, doArrFn, doMapExistFn, doTypeOfFn, doProduceFn, doProducePostFailFn} from './function-fixtures';
import {Foo} from './class-fixtures';

try {
    const a = 'foo';
    // should pass
    stringTestFn(a);
} catch (e) {
    console.log(e);
}

console.log("------------------------");

try {
    const a = '';
    // should fail
    stringTestFn(a);
} catch (e) {
    console.log(e);
}

console.log("------------------------");

try {
    const foo = new Foo();
    // should pass
    foo.callAdd(1, 2);
} catch (e) {
    console.log(e);
}

try {
    const foo = new Foo();
    // should fail
    foo.callAdd(1, 0);
} catch (e) {
    console.log(e);
}

console.log("------------------------");

try {
    // should pass
    doArrFn([1, 2, 3]);
} catch (e) {
    console.log(e);
}

try {
    // should fail
    doArrFn([1, 2, 4]);
} catch (e) {
    console.log(e);
}

console.log("------------------------");

try {
    // should pass
    const map = new Map();
    map.set('foo', 42);
    doMapExistFn(map);
} catch (e) {
    console.log(e);
}

try {
    // should fail
    const map = new Map();
    map.set('bar', 42);
    doMapExistFn(map);
} catch (e) {
    console.log(e);
}

console.log("------------------------");

try {
    // should pass
    doTypeOfFn('str');
} catch (e) {
    console.log(e);
}

try {
    // should fail
    doTypeOfFn(42);
} catch (e) {
    console.log(e);
}

console.log("------------------------");

try {
    const b = [1,2,3];
    // should pass
    doProduceFn(() => [1, 2]);
    doProduceFn(() => [1]);
    doProduceFn(() => [...b]);
} catch (e) {
    console.log(e);
}

try {
    // should fail
    doProduceFn(() => []);
} catch (e) {
    console.log(e);
}

console.log("------------------------");

try {
    // should fail
    doProducePostFailFn(() => [1]);
} catch (e) {
    console.log(e);
}
