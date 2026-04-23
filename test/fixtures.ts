export const DOG_IGNORE_PARAM = 
`
    class Animal {
        /**
         * @pre amount > 0
         */
        public feed(amount: number): void {}
    }

    export class DogIgnoreParam extends Animal {
        public feed(qty: number): void {}
    }
`;

export const TRANSPILE_DOG_MODULE = 
`
    class Animal {
        /**
         * @pre amount > 0
         */
        public feed(amount: number): void {}
    }

    export class TranspileModuleDog extends Animal {
        /**
         * @pre amount > 0
         */
        public feed(amount: number): void {}
    }
`;

