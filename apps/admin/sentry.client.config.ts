import * as Sentry from "@sentry/nextjs";

import { createSentryInitOptions } from "@/lib/observability";

Sentry.init(createSentryInitOptions("client"));
