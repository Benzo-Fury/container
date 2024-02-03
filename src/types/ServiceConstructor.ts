/**
 * This type represents a service class constructor method.
 * It should not represent a instance of a class!
 */
export type ServiceConstructor<T = any> = new (...args: any[]) => T;
