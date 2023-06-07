export const DocumentLoadSpans = (span) => {
  console.log('document load span');
  span.setAttribute('document.title',document.title);
};

export const DocumentFetchSpans = (span) => {
  console.log('fetch span');
}

export const ResourceFetchSpans = (span, resource) => {

  span.setAttributes({
    'resource.initiator': resource.initiatorType,
    'resource.compressed': resource.decodedBodySize !== resource.encodedBodySize,
    'resource.tcp.duration_ms': resource.connectEnd - resource.connectStart,
    'resource.dns.duration_ms': resource.domainLookupEnd - resource.domainLookupStart,
    'resource.tls_handshake.duration_ms': resource.requestStart - resource.secureConnectionStart,
    'resource.request.duration_ms': resource.responseStart - resource.requestStart,
    'resource.transferred': resource.transferSize,
  });

    // // https://developer.mozilla.org/en-US/docs/web/api/performanceresourcetiming
    // entry.initiator
    // resourceSpan.setAttributes({
    //   'resource.duration_ms': entry.duration,
    //   'resource.tcp.duration_ms': entry.connectEnd - entry.connectStart,
    //   'resource.dns.duration_ms': entry.domainLookupEnd - entry.domainLookupStart,
    //   'resource.request.duration_ms': entry.responseStart - entry.requestStart,
    //   'resource.tls_handshake.duration_ms': entry.requestStart - entry.secureConnectionStart,
    //   
    //   'resource.wire_size': entry.transferSize,
    //   'resource.name': entry.name,
    //   'resource.start_time_relative': entry.startTime,
    // });

}