import { Interpreter } from '../../src/ts/Interpreter';

describe('Interpreter', () => {
    let interpreter: Interpreter;

    beforeEach(() => {
        interpreter = new Interpreter({});
    });

    describe('addToDictionary', () => {
        it('should add a new entry to an empty dictionary', () => {
            const testFn = jest.fn();
            interpreter.addToDictionary('test', testFn);

            expect(interpreter.dictionaryHead).toEqual({
                name: 'test',
                fn: testFn,
                immediate: false
            });
        });

        it('should add a new entry to a non-empty dictionary', () => {
            const firstFn = jest.fn();
            const secondFn = jest.fn();
            interpreter.addToDictionary('first', firstFn);
            interpreter.addToDictionary('second', secondFn);

            expect(interpreter.dictionaryHead).toEqual({
                name: 'second',
                fn: secondFn,
                prev: {
                    name: 'first',
                    fn: firstFn,
                    immediate: false
                },
                immediate: false
            });
        });

        it('should set the immediate flag when provided', () => {
            const testFn = jest.fn();
            interpreter.addToDictionary('test', testFn, true);

            expect(interpreter.dictionaryHead).toEqual({
                name: 'test',
                fn: testFn,
                immediate: true
            });
        });
    });
});