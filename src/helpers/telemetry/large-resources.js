import { InstrumentationBase } from '@opentelemetry/instrumentation';
import { trace, context } from '@opentelemetry/api';
import { hrTime } from '@opentelemetry/core';

export class ResourceTiming extends InstrumentationBase {
  onReport(entry, parentSpanContext) {
    const now = hrTime();
    const resourceSpan = trace
      .getTracer('resource-performance')
      .startSpan(entry.initiatorType, { startTime: now }, parentSpanContext);

    resourceSpan.setAttributes({
      [`resource.tcp.duration_ms`]: entry.connectEnd - entry.connectStart,
      [`resource.dns.duration_ms`]: entry.domainLookupEnd - entry.domainLookupStart,
      [`resource.request.duration_ms`]: entry.responseStart - entry.requestStart,
      [`resource.tls_handshake.duration_ms`]: entry.requestStart - entry.secureConnectionStart,
      [`resource.compressed`]: entry.decodedBodySize !== entry.encodedBodySize,
      [`resource.wire_size`]: entry.transferSize,
      [`resource.name`]: entry.name,
    });
    resourceSpan.end();
  }

  enable() {
    if (this.enabled) {
      return;
    }
    this.enabled = true;

  
    const parentSpan = trace.getTracer('resource-performance').startSpan('resource-performance');
    const ctx = trace.setSpan(context.active(), parentSpan);
    parentSpan.end();

    setTimeout(()=>{
      const resources = window.performance.getEntriesByType('resource');
      resources.forEach((entry) => {
        this.onReport(entry, ctx);
      })
    }, 10000);
  }
}
