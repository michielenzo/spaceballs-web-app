export class BoundedStack<T> {
    private stack: T[];
    private maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
        this.stack = [];
    }

    public push(item: T): void {
        if (this.stack.length >= this.maxSize) {
            this.stack.shift(); // Removes the first element from the array, which is the oldest
        }
        this.stack.push(item); // Adds the new element to the end of the array
    }

    public pop(): T | undefined {
        return this.stack.pop(); // Removes the last element from the array
    }

    public peek(): T | undefined {
        if (this.stack.length > 0) {
            return this.stack[this.stack.length - 1];
        }
        return undefined;
    }

    public peekAt(idx: number): T | undefined {
        if (this.stack.length > 0) {
            return this.stack[this.stack.length - idx];
        }
        return undefined;
    }

    public isEmpty(): boolean {
        return this.stack.length === 0;
    }

    public size(): number {
        return this.stack.length;
    }

    public get(): T[] {
        return this.stack
    }
}