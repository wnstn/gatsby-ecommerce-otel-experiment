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
import { DocumentCustomSpans } from './telemetry/document-load-custom-spans';
import { UserInteractionInstrumentation } from '@opentelemetry/instrumentation-user-interaction';
import { ResourceTiming } from './telemetry/large-resources';

const exporter = new OTLPTraceExporter({
  url: "https://api-dogfood.honeycomb.io/v1/traces",
  headers: {
    "x-honeycomb-team": process.env.GATSBY_HONEYCOMB_KEY,
  },
});

const provider = new WebTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: process.env.GATSBY_SERVICE_NAME,
  })
});
provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register({
  contextManager: new ZoneContextManager(),
});

registerInstrumentations({
  instrumentations: [
    new WebVitalsInstrumentation(),
    new DocumentLoadInstrumentation({
      applyCustomAttributesOnSpan: {
          documentLoad: DocumentCustomSpans
      }
    }),
    new UserInteractionInstrumentation(),
    new ResourceTiming(),
  ],
});

