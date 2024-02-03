import { ServiceConstructor } from "./ServiceConstructor.js";

/**
 * This type represents a instance of a service class.
 */
export type ServiceInstance<T = any> = InstanceType<ServiceConstructor<T>>;
