// Owner: Member 1 — MVC model for process-level health state.
const healthModel = {
  overall() {
    return { status: 'ok', service: 'minuto-me-api' };
  },
  liveness() {
    return { status: 'alive' };
  },
  readiness() {
    return { status: 'ready', checks: { process: 'ok' } };
  },
};

export default healthModel;
