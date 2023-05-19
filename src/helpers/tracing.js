import {
  ConsoleSpanExporter,
  SimpleSpanProcessor,
} from '@opentelemetry/sdk-trace-base';
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';
import { ZoneContextManager } from "@opentelemetry/context-zone";
import { registerInstrumentations } from '@opentelemetry/instrumentation';

const exporter = new CollectorTraceExporter({
  serviceName: 'auto-instrumentations-web',
});

const provider = new WebTracerProvider();
provider.addSpanProcessor(new SimpleSpanProcessor(new ConsoleSpanExporter()));
provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

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

