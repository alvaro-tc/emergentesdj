from rest_framework import serializers
from .models import AuditLog


# ── Spanish labels ───────────────────────────────────────────────────────────

RESOURCE_LABELS = {
    'task-scores':          'Notas de tareas',
    'criterion-scores':     'Notas finales',
    'enrollments':          'Inscripciones',
    'projects':             'Proyectos',
    'course-sub-criteria':  'Subcriterios',
    'course-tasks':         'Tareas',
    'courses':              'Cursos',
    'subjects':             'Materias',
    'programs':             'Programas',
    'periods':              'Periodos académicos',
    'evaluation-templates': 'Plantillas de evaluación',
}

RESOURCE_SINGULAR = {
    'enrollments':          'una inscripción',
    'projects':             'un proyecto',
    'course-sub-criteria':  'un subcriterio',
    'course-tasks':         'una tarea',
    'courses':              'un curso',
    'subjects':             'una materia',
    'programs':             'un programa',
    'periods':              'un periodo académico',
    'evaluation-templates': 'una plantilla de evaluación',
    'criterion-scores':     'una nota final',
    'task-scores':          'una nota de tarea',
}

ACTION_VERBS = {
    'POST':   'Creó',
    'PUT':    'Modificó',
    'PATCH':  'Modificó',
    'DELETE': 'Eliminó',
}

ACTION_TYPES = {
    'POST':   'Creación',
    'PUT':    'Modificación',
    'PATCH':  'Modificación',
    'DELETE': 'Eliminación',
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def get_resource_label(resource):
    return RESOURCE_LABELS.get(resource, (resource or '').replace('-', ' ').title() or 'Sin recurso')


def is_bulk_action(audit_log):
    return 'bulk_save' in (audit_log.url or '')


def _bulk_count(audit_log):
    rb = audit_log.request_body
    if isinstance(rb, dict) and 'updates' in rb and isinstance(rb['updates'], list):
        return len(rb['updates'])
    if isinstance(rb, list):
        return len(rb)
    return 0


def get_action_type_label(audit_log):
    if is_bulk_action(audit_log):
        if audit_log.resource == 'task-scores':
            return 'Llenado de notas de tareas'
        if audit_log.resource == 'criterion-scores':
            return 'Llenado de notas finales'
        return 'Actualización masiva'
    return ACTION_TYPES.get((audit_log.method or '').upper(), audit_log.method or 'Acción')


def build_description(audit_log):
    """One-line, human-readable description of what happened."""
    if is_bulk_action(audit_log):
        count = _bulk_count(audit_log)
        if audit_log.resource == 'task-scores':
            label = 'Llenó notas de tareas'
        elif audit_log.resource == 'criterion-scores':
            label = 'Llenó notas finales'
        else:
            label = 'Actualizó datos en masa'
        suffix = f"{count} {'nota' if count == 1 else 'notas'}"
        return f"{label}: {suffix}"

    method = (audit_log.method or '').upper()
    verb = ACTION_VERBS.get(method, method.lower())
    target = RESOURCE_SINGULAR.get(audit_log.resource, get_resource_label(audit_log.resource).lower())
    return f"{verb} {target}"


def _try_value(d, *keys):
    if not isinstance(d, dict):
        return None
    for k in keys:
        v = d.get(k)
        if v not in (None, '', [], {}):
            return v
    return None


def build_subject(audit_log):
    """Best-effort: extract a name/identifier from the affected object."""
    sources = [audit_log.snapshot_before, audit_log.response_data, audit_log.request_body]
    for src in sources:
        if not isinstance(src, dict):
            continue
        # Direct name fields
        name = _try_value(src, 'name', 'title')
        if name:
            return str(name)
        # Person-like fields
        first = _try_value(src, 'first_name')
        last = _try_value(src, 'paternal_surname', 'last_name')
        if first or last:
            return ' '.join(filter(None, [first, last]))
        email = _try_value(src, 'email', 'username')
        if email:
            return str(email)
        # Score fields → mention numeric value
        score = _try_value(src, 'score')
        if score is not None:
            return f"calificación {score}"
        # Fallback: object ID
        obj_id = _try_value(src, 'id')
        if obj_id is not None:
            return f"ID {obj_id}"
    return None


# ── Serializer ───────────────────────────────────────────────────────────────

class AuditLogSerializer(serializers.ModelSerializer):
    reverted_by_name = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    resource_label = serializers.SerializerMethodField()
    action_type = serializers.SerializerMethodField()
    is_bulk = serializers.SerializerMethodField()
    affected_count = serializers.SerializerMethodField()
    subject = serializers.SerializerMethodField()

    class Meta:
        model = AuditLog
        fields = [
            'action_id', 'user', 'user_name', 'timestamp',
            'method', 'url', 'resource', 'http_status',
            'request_body', 'response_data', 'snapshot_before',
            'status', 'reverted_at', 'reverted_by', 'reverted_by_name',
            'description', 'resource_label', 'action_type',
            'is_bulk', 'affected_count', 'subject',
        ]
        read_only_fields = fields

    def get_reverted_by_name(self, obj):
        if obj.reverted_by:
            return getattr(obj.reverted_by, 'email', '') or getattr(obj.reverted_by, 'username', '') or str(obj.reverted_by)
        return None

    def get_description(self, obj):
        return build_description(obj)

    def get_resource_label(self, obj):
        if is_bulk_action(obj):
            if obj.resource == 'task-scores':
                return 'Llenado de notas de tareas'
            if obj.resource == 'criterion-scores':
                return 'Llenado de notas finales'
        return get_resource_label(obj.resource)

    def get_action_type(self, obj):
        return get_action_type_label(obj)

    def get_is_bulk(self, obj):
        return is_bulk_action(obj)

    def get_affected_count(self, obj):
        return _bulk_count(obj) if is_bulk_action(obj) else 1

    def get_subject(self, obj):
        return build_subject(obj)
