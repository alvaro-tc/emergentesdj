// Module-level singleton that bridges the Axios interceptor (runs outside React)
// to the AuditLogContext (lives inside React). Entries recorded before the
// context mounts are buffered and flushed once the recorder is registered.

let _recorder = null;
const _buffer = [];

const auditBridge = {
    register(fn) {
        _recorder = fn;
        while (_buffer.length) fn(_buffer.shift());
    },
    unregister() {
        _recorder = null;
    },
    record(entry) {
        if (_recorder) _recorder(entry);
        else _buffer.push(entry);
    },
};

export default auditBridge;
