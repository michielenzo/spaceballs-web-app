    // This is a hacky implementation to create a copy of a object instead of just copying the reference
    export function deepCopy<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj));
    }

    // Checks wheter a given string is a integer or double value. 
    export function isNumeric(str: string): boolean {
        return !isNaN(parseFloat(str)) && isFinite(Number(str));
    }