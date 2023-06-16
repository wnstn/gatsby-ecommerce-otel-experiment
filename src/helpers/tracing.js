// This is the tracing factory, as well as a helper to batch spans (reducing network traffic)
import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
// a set of auto instrumentations for the web
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource }  from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
// instrumentation we want
import { WebVitalsInstrumentation } from './telemetry/core-web-vitals-instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { DocumentLoadSpans, ResourceFetchSpans } from './telemetry/document-load-custom-spans';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { ErrorCatching } from './telemetry/error-catching';
import { getOrSetSessionID } from './telemetry/session-data';

const SESSION_ID = getOrSetSessionID();

const exporter = new OTLPTraceExporter({
  url: "https://api-dogfood.honeycomb.io/v1/traces",
  headers: {
    "x-honeycomb-team": process.env.GATSBY_HONEYCOMB_KEY,
  },
});

const provider = new WebTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.GATSBY_SERVICE_NAME,
    'session_id': SESSION_ID,
    'session.window.width': window.innerWidth,
    'session.window.height': window.innerHeight,
    'session.device.width': window.outerWidth,
    'session.device.height': window.outerHeight,
    'session.user_agent': navigator.userAgent,
  })
});

const processor = new BatchSpanProcessor(exporter);

provider.addSpanProcessor(processor);
provider.register({
  contextManager: new ZoneContextManager(),
});

registerInstrumentations({
  instrumentations: [
    new WebVitalsInstrumentation(),
    new DocumentLoadInstrumentation({
      applyCustomAttributesOnSpan: {
          documentLoad: DocumentLoadSpans,
          resourceFetch: ResourceFetchSpans,
      }
    }),
    new UserInteractionInstrumentation(),
    // new ResourceTiming(),
    new ErrorCatching(),
  ],
});

