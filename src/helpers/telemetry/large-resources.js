import { InstrumentationBase } from '@opentelemetry/instrumentation';
import { trace, context } from '@opentelemetry/api';
import { hrTime } from '@opentelemetry/core';

export class ResourceTiming extends InstrumentationBase {
  
  _getNavigationTiming() {
    const navTiming = window.performance.getEntriesByType('navigation');
    if (navTiming.length === 0) {
      return setTimeout(this._getNavigationTiming, 1000);
    }

    navTiming.forEach((timing)=>{
      console.dir(timing);
      this.parentSpan.setAttributes({
        'perf.requestTime': timing.responseStart - timing.requestStart,
        'perf.loadTime': timing.loadEventEnd - timing.loadEventStart,
        'perf.domContentLoaded': timing.domContentLoadEventEnd - timing.domContentLoadedEventStart,
        'perf.transferSize': timing.transferSize,
        'perf.decodedBodySize': timing.decodedBodySize,
        'perf.encodedBodySize': timing.encodedBodySize,
        'perf.domInteractive': timing.domInteractive - timing.fetchStart,
      })
    });
    this.parentSpan.end();
  }

  _getResourceTiming() {
    console.log('resource timing');
    const now = hrTime();
    const resources = window.performance.getEntriesByType('resource');
    resources.forEach((entry) => {
      this.onReport(entry, this.context, now);
    })
    
  }

  _onDocumentLoaded() {
    this.context = trace.setSpan(context.active(), this.parentSpan);
    
    const navTiming = this._getNavigationTiming.bind(this);
    const resourceTiming = this._getResourceTiming.bind(this);
    requestIdleCallback(resourceTiming, {timeout: 2000});
    requestIdleCallback(navTiming, {timeout: 2000});
  }


  _waitForPageLoad() {
    trace.getTracer('app-performance').startActiveSpan('resource-performance', (span)=>{
      this.parentSpan = span;
      if (window.document.readyState === 'complete') {
        this._onDocumentLoaded();
      } else {
        this._onDocumentLoaded = this._onDocumentLoaded.bind(this);
        window.addEventListener('DOMContentLoaded', this._onDocumentLoaded);
        }
      })
    }
  
  onReport(entry, parentSpanContext, start) {
    const resourceSpan = trace
      .getTracer('resource-performance')
      .startSpan(entry.initiatorType, { startTime:  start + entry.fetchStart}, parentSpanContext);

    resourceSpan.setAttributes({
      [`resource.tcp.duration_ms`]: entry.connectEnd - entry.connectStart,
      [`resource.dns.duration_ms`]: entry.domainLookupEnd - entry.domainLookupStart,
      [`resource.request.duration_ms`]: entry.responseStart - entry.requestStart,
      [`resource.tls_handshake.duration_ms`]: entry.requestStart - entry.secureConnectionStart,
      [`resource.compressed`]: entry.decodedBodySize !== entry.encodedBodySize,
      [`resource.wire_size`]: entry.transferSize,
      [`resource.name`]: entry.name,
    });
    resourceSpan.end(start + entry.responseEnd);
  }

  enable() {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    this._waitForPageLoad();
  };
}
