import { registerPermission } from "./permission";

registerPermission("luckperms.test")
    .description("This is just a permission used for testing!")
    .default(true)
    .register();
