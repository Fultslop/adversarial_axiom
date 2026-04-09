// todo:
// * param names that don't exists in pre or post should throw an error
// * The root problem here is the silent catch — any unsupported expression type in the body kills the entire function's rewrite, including the pre-conditions. A better long-term fix would be to make pre-conditions independent of the body rewrite, so a failing @post body capture doesn't prevent @pre guards from being injected. Worth noting as a todo.
// 
/**
 * 
 * @param a 
 * @pre a
 */
export function stringTestFn(a: string): void {
    console.log(`a = '${a}'`);
}

/**
 * @pre amount > 0
 */
export function withdraw(amount: number) { 
    return amount;
}

/**
 * @pre amount
 * @pre amount.includes(3) 
 */
export function doArrFn(amount: number[]) { 
    console.log(JSON.stringify(amount));
}

/**
 * XXX amount doesn't exist should throw an error
 * @pre amount
 */
export function doMapFunction(map: Map<string, number>) {
    console.log('foo = ' + map.get('foo'));
}

/**
 * @pre map.get('foo')
 */
export function doMapExistFn(map: Map<string, number>) {
    console.log('foo = ' + map.get('foo'));
}

/**
 * @pre typeof(value) === 'string'
 */
export function doTypeOfFn(value: any) {
    console.log(`any is ${typeof(value)}`);
}

/**
 * @param produce
 * @pre produce().length > 0
 * @post result === produce().length || result < 0
 */
export function doProduceFn(produce: () => number[]) {
    const x = produce();
    console.log('produce = ' + JSON.stringify(x));
    return x.length % 2 === 0 ? x.length : -1;  
}

/**
 * @param produce
 * @pre produce().length > 0
 * @post result >= 0
 */
export function doProducePostFailFn(produce: () => number[]) {
    const x = produce();
    console.log('produce = ' + JSON.stringify(x));
    return -1;  
}

/**
 * @param produce
 * @pre bool1 && bool2
 * @post result === true
 */
export function doAnd(bool1: boolean, bool2: boolean) {
    return bool1 && bool2;  
}

/**
 * @param produce
 * @pre a > 0 && b > 0
 */
export function doNumberRange(a: number, b: number) {
    return a + b;  
}

// // xxx doesn't work yet
// @pre v > 1
export function doIncSlashComment(v: number) : number {
    return v += 1;
}

/**
 * @post result > 0  
 */
export function doLoopFn(arr: number[]) {
    let sum = 0;
    for (const x of arr) { sum += x; }
    return sum;
}

/**
 * @post result === "bar"
 */
export function doSwitchFn(value: string) : string {
    switch (value) {
        case "foo":
            return "bar";
        case "bar": 
            return "baz";
        default:
            return "qaz";
    }
}

export interface ValueCarrier {
    value: number
}

/**
 * @pre obj?.value > 0
 */ 
export function doOptionalFn(obj: ValueCarrier | null) : number | null {
    return obj ? obj.value + 1 : 0;
}

/**
 * @pre v = 5 
 */
export function shouldWarnAssignmentDuringBuild(v: number) {
    console.log("it works ???" + v)
}

/**
 * v doesn't exist should warn
 * @pre v === 5 
 */
export function shouldWarnVDoesNotExistsDuringBuild(x: number) {
    console.log("it works ???" + x)
}

/**
 * v is different type
 * @pre v === "foo" 
 */
export function shouldWarnVNotCorrectType(x: number) {
    console.log("it works ???" + x)
}

/**
 * result is different type
 * @post result === "foo" 
 */
export function shouldWarnResultNotCorrectType(x: number) : number {
    console.log("it works ???" + x)
    return x + 1;
}

/**
 * result is not defined
 * @post result === x + 1 
 */
export function shouldWarnResultTypeMissing(x: number)  {
    console.log("it works ???" + x)
    return x + 1;
}