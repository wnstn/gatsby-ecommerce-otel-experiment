export const DocumentLoadSpans = (span) => {
  console.log('document load span');
  span.setAttribute('document.title',document.title);
};

export const DocumentFetchSpans = (span) => {
  console.log('fetch span');
}

export const ResourceFetchSpans = (span, resource) => {
  if (!resource) { return; }

  span.setAttributes({
    'resource.initiator': resource.initiatorType,
    'resource.compressed': resource.decodedBodySize !== resource.encodedBodySize,
    'resource.tcp.duration_ms': resource.connectEnd - resource.connectStart,
    'resource.dns.duration_ms': resource.domainLookupEnd - resource.domainLookupStart,
    'resource.tls_handshake.duration_ms': resource.requestStart - resource.secureConnectionStart,
    'resource.request.duration_ms': resource.responseStart - resource.requestStart,
    'resource.transferred': resource.transferSize,
  });
}