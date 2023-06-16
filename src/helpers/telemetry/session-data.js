import { RandomIdGenerator } from "@opentelemetry/sdk-trace-web";

const SESSION_KEY = 'otel_session_id';
const EXPIRATION_IN_MS = 900000;

function createAndSetSessionID() {
  console.log('setting new session');
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    key: new RandomIdGenerator().generateTraceId(),
    expiration: Date.now() + EXPIRATION_IN_MS,
    })
  );

  return JSON.parse(sessionStorage.getItem(SESSION_KEY))['key'];
}


function getOrSetSessionID() {
  let sessionID = JSON.parse(sessionStorage.getItem(SESSION_KEY));
  
  return sessionID && sessionID.expiration >= Date.now() ? sessionID.key : createAndSetSessionID();
};

export { getOrSetSessionID };