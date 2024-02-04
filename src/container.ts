//@ts-nocheck
import { readdirSync } from "fs";
import type {
  AutoLoadServiceOptions,
  NoNameServiceOptions,
  ServiceOptions,
} from "./types/ServiceOptions.js";
import type { ConstructorOptions } from "./types/ConstructorOptions.js";
import type { ServiceMap } from "./types/ServiceMap.js";
import { fileURLToPath, pathToFileURL } from "url";
import { join } from "path";

/**
 * The service container.
 *
 * It holds all the services you could ever need!
 */
export class Container {
  /** The service container */
  private readonly services = new Map<string, NoNameServiceOptions>();
  private static instance: Container;

  // Allowing for any custom properties dynamically added later.
  [key: string]: any;

  constructor(options?: ConstructorOptions) {
    Container.instance = this;

    // Dynamically adding options to class.
    for (const key in options) {
      //@ts-ignore
      this[key] = options[key];
    }
  }

  /**
   * Returns the current container instance.
   */
  public static getInstance() {
    return Container.instance;
  }

  /**
   * Registers a service to the container.
   * @param services The services to register.
   */
  public register(services: Array<ServiceOptions>): Promise<this> {
    return new Promise(async (resolve, reject) => {
      for (const service of services) {
        // Ensuring service name is a string.
        if (typeof service.name !== "string") {
          return reject(
            new Error(
              `Service names must be of type string. Service: ${service.name} is not a string.`
            )
          );
        }

        // Checking if service is already added
        if (this.services.has(service.name)) {
          return reject(
            new Error(`Service ${service.name} is already registered.`)
          );
        }

        // Adding service to map.
        this.services.set(
          service.name,

          // Checking weather to lazy load or not
          service.options?.lazyLoad
            ? service
            : {
                service: this.createServiceInstance(service),
              }
        );

        // Checking for any logging
        if (service.options?.logging !== "none" && !this.logger) {
          // Checking if logging is a function or not.
          if (service.options?.logging instanceof Function) {
            service.options.logging(this, service);
          } else {
            // Its standard.
            console.log(`Registered service: ${service.name}...`);
          }
        }

        // Checking for initializer.
        if (service.options?.initializer) {
          await service.options.initializer(this);
        }
      }
      // Resolving outside of loop
      return resolve(this);
    });
  }

  /**
   * Resolves a service and returns it.
   * @param name The service name to resolve.
   */
  public resolve<K extends keyof ServiceMap>(name: K): Promise<ServiceMap[K]> {
    return new Promise((resolve, reject) => {
      // Finding the service
      const serviceOptions = this.services.get(name as string);

      // Checking if service exists.
      if (!serviceOptions) {
        return reject(new Error(`Service ${name} has not been registered.`));
      }

      // Checking if service is a constructor
      if (typeof serviceOptions.service === "function") {
        return resolve(
          new serviceOptions.service(serviceOptions.options?.inject ?? null)
        );
      } else {
        return resolve(serviceOptions.service);
      }
    });
  }

  /**
   * Disposes of a specific service.
   * @param name The name of the service to dispose of.
   */
  public dispose<K extends keyof ServiceMap>(name: K): Promise<void> {
    return new Promise((resolve, reject) => {
      // Finding the service
      const service = this.services.get(name as string);

      // Checking if service exists.
      if (!service) {
        return reject(new Error(`Service ${name} does not exist.`));
      }

      // Running disposer function if it exists.
      if (service.options?.disposer) {
        service.options?.disposer(this, service);
      }

      // Deleting service from map.
      this.services.delete(name as string);

      // Resolving
      return resolve();
    });
  }

  /**
   * Replaces a service with a new one.
   */
  public async upsert(service: ServiceOptions) {
    // Checking if service exists.
    if (!this.services.has(service.name)) {
      // If it doesn't, we can just set it.
      return this.register([service]);
    }

    // If it does, we need to delete it first.
    await this.dispose(key);

    // Then we can set it.
    return this.register([service]);
  }

  /**
   * Illiterates through each service and disposes of it.
   */
  public disposeAll(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Looping through services and calling dispose().
      for (const service of this.services) {
        this.dispose(service[0]);
      }
      return resolve();
    });
  }

  /**
   * Auto loads services from a specified directory.
   * @param directory Expected to be the full absolute path to the directory.
   */
  public async autoLoad(directoryUrl: string): Promise<void> {
    // Creating modules array.
    const modules: AutoLoadServiceOptions[] = [];

    // Getting all files to load.
    const files = readdirSync(directoryUrl).filter(
      (file) => file.endsWith(".js") && !file.startsWith("!")
    );

    // Looping through services.
    for (const file of files) {
      const filePath = join(directoryUrl, file);

      // Creating the module url.
      const moduleFileUrl = pathToFileURL(filePath).href;

      // Import the module.
      const fileImport = await import(moduleFileUrl);
      const module = fileImport.default as AutoLoadServiceOptions;

      // Validate the module.
      if (!module || typeof module !== "object") {
        throw new Error(`${file} does not export a valid service module.`);
      }

      // Check if module already exists.
      if (this.services.has(module.name)) {
        // Checking if upsert enabled
        if (module.options?.upsert) {
          // Deleting the service.
          await this.dispose(module.name);
        } else {
          // Throw error.
          throw new Error(
            `Service already exists with name: ${module.name}. Did you mean to enable the upsert option?`
          );
        }
      }

      // Store the module for later processing.
      modules.push(module);
    }

    // Sort modules based on priority (higher number means higher priority)
    modules.sort(
      (a, b) => (b.options?.priority || 0) - (a.options?.priority || 0)
    );

    // Register the sorted modules
    await this.register(modules);
  }

  // ----------------------- Private Helpers ----------------------- //

  private createServiceInstance(service: ServiceOptions) {
    const injectArgs = service.options?.inject || [];

    try {
      if (service.options?.isFunction) {
        // Handle the case where the service is a plain function
        return service.service(...injectArgs);
      } else if (service.options?.isInstance) {
        // Handle the case where the service is already an instance.
        return service.service;
      } else {
        // Handle the case where the service is a class constructor
        return new service.service(...injectArgs);
      }
    } catch (e) {
      throw new Error(`Error creating service: ${service.name}: ` + e);
    }
  }
}
