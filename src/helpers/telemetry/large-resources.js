import { InstrumentationBase } from '@opentelemetry/instrumentation';
import { trace, context } from '@opentelemetry/api';

/** 
   Capture performance timing for all resources accessed during page load.
   This instrumentation relies on the browser Performance API to get timing
   for page load (Navigation Timing https:\\developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming )
   and for resources (Resource Timing https:\\developer.mozilla.org/en-US/docs/web/api/performanceresourcetiming )
   the data is shaped to be easy for querying and identifying slow/large/outlier resources.

   The trace waterfall generated is based on relative timings because the performance API
   does not provide timestamps, so some work is needed to make the relative timings make sense.
*/

let parentSpanDuration = 0;
let parentSpanStartTime = 0;
export class ResourceTiming extends InstrumentationBase {

  getNavigationTiming() {
    const navTiming = window.performance.getEntriesByType('navigation');
    if (navTiming.length === 0) {
      // wait a tick to see if the browser populates it
      return setTimeout(this.getNavigationTiming, 1000);
    }

    navTiming.forEach((timing) => {

      this.parentSpan.setAttributes({
        'page.decoded_size': timing.decodedBodySize,
        'page.dom_content_loaded': timing.domContentLoadEventEnd - timing.domContentLoadedEventStart,
        'page.dom_interactive_ms': timing.domInteractive - timing.fetchStart,
        'page.encoded_body_size': timing.encodedBodySize,
        'page.load_time_ms': timing.loadEventEnd - timing.fetchStart,
        'page.navigation_duration_ms': timing.duration,
        'page.protocol': timing.nextHopProtocol,
        'page.request_time_ms': timing.responseStart - timing.requestStart,
        'page.transfer_size': timing.transferSize,
        'page.browser': navigator.userAgent,
      });
    });
    
    const endTime = parentSpanStartTime + parentSpanDuration; 
    this.parentSpan.end(endTime);
  }

  getResources() {
    const resources = window.performance.getEntriesByType('resource');
    resources.forEach((entry) => this.getResourceTiming(entry, this.context))
  }

  getResourceTiming(entry, parentSpanContext) {
    const startTime = parentSpanStartTime + entry.startTime;
    const resourceSpan = trace
      .getTracer('resource-performance')
      .startSpan(entry.initiatorType, { startTime: startTime }, parentSpanContext);

    // https://developer.mozilla.org/en-US/docs/web/api/performanceresourcetiming
    resourceSpan.setAttributes({
      'resource.duration_ms': entry.duration,
      'resource.tcp.duration_ms': entry.connectEnd - entry.connectStart,
      'resource.dns.duration_ms': entry.domainLookupEnd - entry.domainLookupStart,
      'resource.request.duration_ms': entry.responseStart - entry.requestStart,
      'resource.tls_handshake.duration_ms': entry.requestStart - entry.secureConnectionStart,
      'resource.compressed': entry.decodedBodySize !== entry.encodedBodySize,
      'resource.wire_size': entry.transferSize,
      'resource.decoded_size': entry.decodedBodySize,
      'resource.name': entry.name,
      'resource.start_time_relative': entry.startTime,
    });
    
    // adjust parent span length to match resource timeline
    if (parentSpanDuration <= (entry.startTime + entry.duration)) {
      parentSpanDuration = entry.startTime + entry.duration;
    }

    resourceSpan.end(startTime + entry.duration);
  }

  onDocumentLoaded() {
    this.context = trace.setSpan(context.active(), this.parentSpan);
    
    const navTiming = this.getNavigationTiming.bind(this);
    const resourceTiming = this.getResources.bind(this);
    requestIdleCallback(resourceTiming, {timeout: 2000});
    requestIdleCallback(navTiming, {timeout: 2000});
  }

  openParentSpan() {
    parentSpanStartTime = Date.now();

    trace.getTracer('app-performance').startActiveSpan('resource-performance', (span) => {
      this.parentSpan = span;
      if (window.document.readyState === 'loading') {
        const onDocumentLoaded = this.onDocumentLoaded.bind(this);
        window.addEventListener('DOMContentLoaded', onDocumentLoaded);
      } else {
        this.onDocumentLoaded();
      }
    })
  }

  enable() {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    if (!window[performance]) { return; } 
    this.openParentSpan();
  };
}
