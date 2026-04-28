import json
from .models import AuditLog


def save_bulk_audit(request, resource_name, url, updates, snapshot_before, http_status=200):
    """Record an AuditLog entry for a custom bulk action (not standard CRUD)."""
    try:
        user = request.user if request.user.is_authenticated else None
        user_name = ''
        if user:
            user_name = getattr(user, 'email', '') or getattr(user, 'username', '') or str(user)
        AuditLog.objects.create(
            user=user,
            user_name=user_name,
            method='POST',
            url=url,
            resource=resource_name,
            http_status=http_status,
            request_body=_make_serializable(updates),
            snapshot_before=_make_serializable(snapshot_before) if snapshot_before else None,
        )
    except Exception as exc:
        print(f"[AuditLog] Failed to save bulk audit: {exc}")


class AuditMixin:
    """
    DRF ViewSet mixin that records create/update/destroy actions into AuditLog.
    Overrides destroy/update/create (not perform_*) so it wraps any custom
    perform_* logic without requiring those methods to call super().
    """

    def get_audit_resource_name(self):
        if hasattr(self, 'basename'):
            return self.basename
        return self.__class__.__name__.replace('ViewSet', '').lower()

    def _get_snapshot(self, instance):
        try:
            serializer = self.get_serializer(instance)
            return _make_serializable(dict(serializer.data))
        except Exception:
            return None

    def _save_audit(self, request, method, url, http_status,
                    request_body=None, response_data=None, snapshot_before=None):
        try:
            user = request.user if request.user.is_authenticated else None
            user_name = ''
            if user:
                user_name = (
                    getattr(user, 'email', '')
                    or getattr(user, 'username', '')
                    or str(user)
                )
            AuditLog.objects.create(
                user=user,
                user_name=user_name,
                method=method,
                url=url,
                resource=self.get_audit_resource_name(),
                http_status=http_status,
                request_body=_make_serializable(request_body) if request_body else None,
                response_data=_make_serializable(response_data) if response_data else None,
                snapshot_before=snapshot_before,
            )
        except Exception as exc:
            print(f"[AuditMixin] Failed to save audit log: {exc}")

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        snapshot = self._get_snapshot(instance)
        response = super().destroy(request, *args, **kwargs)
        self._save_audit(
            request, 'DELETE', request.path, response.status_code,
            snapshot_before=snapshot,
        )
        return response

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        snapshot = self._get_snapshot(instance)
        response = super().update(request, *args, **kwargs)
        try:
            response_data = _make_serializable(dict(response.data))
        except Exception:
            response_data = None
        self._save_audit(
            request, request.method, request.path, response.status_code,
            request_body=_safe_request_body(request),
            response_data=response_data,
            snapshot_before=snapshot,
        )
        return response

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        try:
            response_data = _make_serializable(dict(response.data))
        except Exception:
            response_data = None
        self._save_audit(
            request, 'POST', request.path, response.status_code,
            request_body=_safe_request_body(request),
            response_data=response_data,
        )
        return response


# ── Helpers ───────────────────────────────────────────────────────────────────

def _safe_request_body(request):
    try:
        data = request.data
        if hasattr(data, 'dict'):
            return _make_serializable(data.dict())
        return _make_serializable(dict(data))
    except Exception:
        return None


def _make_serializable(data):
    """Recursively convert non-JSON-serializable types to safe representations."""
    if data is None:
        return None
    if isinstance(data, dict):
        return {k: _make_serializable(v) for k, v in data.items()}
    if isinstance(data, (list, tuple)):
        return [_make_serializable(v) for v in data]
    try:
        json.dumps(data)
        return data
    except (TypeError, ValueError):
        return str(data)
