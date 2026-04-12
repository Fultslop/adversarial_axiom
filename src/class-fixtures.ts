
/** 
 * @invariant this.max > this.min 
 */
export class Foo {

    public count: number = 1;
    public max: number = 1;
    public min: number = 0;
    

    constructor(v?: number) {
        this.count = v ?? 42;
    }

    public updateMinMax(min: number, max: number) {
        this.min = min;
        this.max = max;
    }

    /**
     * 
     * @param a 
     * @pre a
     */
    public callFoo(a: string) : void {
        console.log(`Foo::a = ${a}`);
    }

    /**
     * 
     * @param a 
     * @pre a > 0
     * @pre b > 0
     */
    public callAdd(a: number, b: number) : void {
        console.log(`Foo::a+b = ${a+b}`);
    }

    /**
     * 
     * @param a 
     * @post result === this.count
     * XXX NOT supported yet
     * post this.count === previous - a
     * @returns 
     */
    public sub(a: number) : number {
        this.count -= a;
        return this.count;
    }

    /**
     * @pre x > 0 
     */
    public static doStaticFn(x: number) { 
        return x + 1; 
    }
}