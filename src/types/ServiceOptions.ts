import { Container } from "../container.js";
import { ServiceConstructor } from "./ServiceConstructor.js";
import { ServiceInstance } from "./ServiceInstance.js";
import { ServiceMap } from "./ServiceMap.js";

/**
 * Options defining a service.
 */
export interface ServiceOptions {
  name: keyof ServiceMap;
  service: ServiceConstructor | ServiceInstance;
  options?: {
    /**
     * Any parameters to parse into the class constructor.
     * These parameters DO NOT go to the constructor function if defined here in the options.
     */
    inject?: any[];

    /**
     * Disposer is the function that will get called when the dispose method is called.
     */
    disposer?: (container: Container, service: NoNameServiceOptions) => any;

    /**
     * The initializer function is similar to a constructor on a class.
     * The service manager will run the constructor function when creating the class instance.
     * This is not in replacement of the actual class constructor!!
     *
     * Unlike a class constructor, this constructor can be asynchronous.
     * If async is used, the service manager will wait until the initializer function completes.
     */
    initializer?: (container: Container) => any;

    /**
     * Determines what logging system to use.
     */
    logging?:
      | "standard"
      | "none"
      | ((
          container: Container,
          serviceOptions: ServiceOptions | AutoLoadServiceOptions
        ) => void);

    /**
     * Lazy load is weather we should make an instance of the service when added or first used.
     */
    lazyLoad?: boolean;

    /**
     * Tells the service manager if the service your passing is a function and not a class.
     */
    isFunction?: boolean;

    /**
     * Tells the service manager if the service your passing is a class instance.
     */
    isInstance?: boolean;
  };
}

/**
 * Just the service options but without a name field.
 */
export type NoNameServiceOptions = Omit<ServiceOptions, "name">;

/**
 * An extended version of the service options.
 * It has features only available in auto load.
 */
export interface AutoLoadServiceOptions extends ServiceOptions {
  options?: ServiceOptions["options"] & {
    /**
     * The priority of the service.
     * Higher priority means it will be loaded first.
     * No priority = 0.
     */
    priority?: number;

    /**
     * Tells the container weather to replace the service if it already exists.
     */
    upsert?: boolean;
  };
}
