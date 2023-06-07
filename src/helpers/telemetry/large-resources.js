import { InstrumentationBase } from '@opentelemetry/instrumentation';
import { 
  addSpanNetworkEvents,
  addSpanNetworkEvent,
  normalizeUrl, 
  PerformanceTimingNames as PerfTypes } from '@opentelemetry/sdk-trace-web';
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
      return setTimeout(this.getNavigationTiming.bind(this), 100);
    }
  
    const parentSpan = trace.getTracer('app-performance').startSpan('resource-performance', {startTime: navTiming[0][PerfTypes.FETCH_START]}, context.active());

    addSpanNetworkEvents(this.parentSpan, navTiming);



    this.getResources(parentSpan);

    parentSpan.end(navTiming[0][PerfTypes.LOAD_EVENT_END]);
  }

  getResources(parentSpanContext) {
    const resources = window.performance.getEntriesByType('resource');
    resources.forEach((entry) => this.getResourceTiming(entry, parentSpanContext))
  }

  getResourceTiming(entry, parentSpanContext) {
    const resourceSpan = trace
      .getTracer('resource-performance')
      .startSpan(entry.initiatorType, { startTime: entry[PerfTypes.FETCH_START] }, trace.setSpan(context.active(),parentSpanContext));

    addSpanNetworkEvents(resourceSpan, entry);


    
    // adjust parent span length to match resource timeline
    if (parentSpanDuration <= (entry.startTime + entry.duration)) {
      parentSpanDuration = entry.startTime + entry.duration;
    }

    resourceSpan.end(entry[PerfTypes.RESPONSE_END]);
  }

  onDocumentLoaded() {
    const navTiming = this.getNavigationTiming.bind(this);
    requestIdleCallback(navTiming, {timeout: 2000});
  }

  openParentSpan() {  
    if (window.document.readyState === 'loading') {
      const onDocumentLoaded = this.onDocumentLoaded.bind(this);
      window.addEventListener('DOMContentLoaded', onDocumentLoaded);
    } else {
      this.onDocumentLoaded();
    }
  }

  enable() {
    if (this.enabled) {
      return;
    }
    this.enabled = true;
    this.openParentSpan();
  };
}
