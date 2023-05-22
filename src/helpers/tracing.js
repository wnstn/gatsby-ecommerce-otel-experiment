// This is the tracing factory, as well as a helper to batch spans (reducing network traffic)
import { WebTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-web';
// a set of auto instrumentations for the web
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource }  from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

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
    getWebAutoInstrumentations({
      '@opentelemetry/instrumentation-xml-http-request': {
        clearTimingResources: true,
      }
    })
  ],
});

