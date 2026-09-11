import type { RouteConfig } from "@react-router/dev/routes";

import { createConfiguredRoutes } from "./routes/configured-routes";

export default createConfiguredRoutes(process.env.NODE_ENV === "production") satisfies RouteConfig;
