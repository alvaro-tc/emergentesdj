from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db import transaction

from .models import AuditLog
from .serializers import AuditLogSerializer


# ── Resource registry ────────────────────────────────────────────────────────
# Maps router basename -> (ModelClass, SerializerClass)
# Populated lazily to avoid circular imports at module load.

_REGISTRY = {}


def _get_registry():
    if not _REGISTRY:
        from api.school import models as m, serializers as s
        _REGISTRY.update({
            'periods':              (m.AcademicPeriod,        s.AcademicPeriodSerializer),
            'programs':             (m.Program,               s.ProgramSerializer),
            'subjects':             (m.Subject,               s.SubjectSerializer),
            'courses':              (m.Course,                s.CourseSerializer),
            'enrollments':          (m.Enrollment,            s.EnrollmentSerializer),
            'evaluation-templates': (m.EvaluationTemplate,    s.EvaluationTemplateSerializer),
            'course-sub-criteria':  (m.CourseSubCriterion,    s.CourseSubCriterionSerializer),
            'course-tasks':         (m.CourseTask,            s.CourseTaskSerializer),
            'task-scores':          (m.TaskScore,             s.TaskScoreSerializer),
            'criterion-scores':     (m.CriterionScore,        s.CriterionScoreSerializer),
        })
    return _REGISTRY


# ── Pagination ────────────────────────────────────────────────────────────────

class AuditLogPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 200


# ── ViewSet ───────────────────────────────────────────────────────────────────

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all()
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = AuditLogPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['user_name', 'url', 'resource']
    ordering_fields = ['timestamp', 'method', 'resource', 'user_name', 'http_status']
    ordering = ['-timestamp']

    def get_queryset(self):
        qs = AuditLog.objects.select_related('user', 'reverted_by')
        params = self.request.query_params

        # Friendly action_type filter (translates to method + bulk flag)
        if action_type := params.get('action_type'):
            if action_type == 'create':
                qs = qs.filter(method='POST').exclude(url__contains='bulk_save')
            elif action_type == 'update':
                qs = qs.filter(method__in=['PUT', 'PATCH'])
            elif action_type == 'delete':
                qs = qs.filter(method='DELETE')
            elif action_type == 'bulk':
                qs = qs.filter(url__contains='bulk_save')

        if method := params.get('method'):
            qs = qs.filter(method=method.upper())

        if resource := params.get('resource'):
            qs = qs.filter(resource=resource)

        # Distinguish bulk vs single CRUD on the same resource
        if (bulk_flag := params.get('bulk')) is not None:
            if str(bulk_flag).lower() in ('true', '1'):
                qs = qs.filter(url__contains='bulk_save')
            elif str(bulk_flag).lower() in ('false', '0'):
                qs = qs.exclude(url__contains='bulk_save')

        if log_status := params.get('status'):
            qs = qs.filter(status=log_status)

        if user_id := params.get('user'):
            qs = qs.filter(user_id=user_id)

        # Date filters: support both date-only and full datetime
        if date_from := params.get('date_from'):
            if 'T' in date_from:
                qs = qs.filter(timestamp__gte=date_from)
            else:
                qs = qs.filter(timestamp__date__gte=date_from)

        if date_to := params.get('date_to'):
            if 'T' in date_to:
                qs = qs.filter(timestamp__lte=date_to)
            else:
                qs = qs.filter(timestamp__date__lte=date_to)

        if since := params.get('since'):
            qs = qs.filter(timestamp__gte=since)

        if http_status := params.get('http_status'):
            qs = qs.filter(http_status=http_status)

        return qs

    @action(detail=True, methods=['post'], url_path='revert')
    def revert(self, request, pk=None):
        audit_log = self.get_object()

        if audit_log.status == 'reverted':
            return Response(
                {'error': 'Esta acción ya fue revertida anteriormente.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            with transaction.atomic():
                detail_msg = _perform_revert(audit_log)
                audit_log.status = 'reverted'
                audit_log.reverted_at = timezone.now()
                audit_log.reverted_by = request.user
                audit_log.save(update_fields=['status', 'reverted_at', 'reverted_by'])

            return Response({
                'message': 'Acción revertida exitosamente.',
                'detail': detail_msg,
                'audit_log': AuditLogSerializer(audit_log).data,
            })

        except ValueError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as exc:
            return Response(
                {'error': f'Error inesperado al revertir: {str(exc)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=False, methods=['get'], url_path='resources')
    def resources(self, request):
        """Return distinct resource names and users for filter dropdowns."""
        from .serializers import RESOURCE_LABELS, get_resource_label

        # Distinct (resource, has_bulk) pairs found in the DB
        rows = (
            AuditLog.objects
            .values_list('resource', flat=True)
            .distinct()
            .order_by('resource')
        )
        bulk_resources = set(
            AuditLog.objects
            .filter(url__contains='bulk_save')
            .values_list('resource', flat=True)
            .distinct()
        )

        resource_options = []
        seen = set()

        # Bulk-specific options first (more user-friendly)
        if 'criterion-scores' in bulk_resources:
            resource_options.append({
                'value': 'criterion-scores:bulk',
                'label': 'Llenado de notas finales',
                'resource': 'criterion-scores', 'bulk': True,
            })
            seen.add('criterion-scores:bulk')
        if 'task-scores' in bulk_resources:
            resource_options.append({
                'value': 'task-scores:bulk',
                'label': 'Llenado de notas de tareas',
                'resource': 'task-scores', 'bulk': True,
            })
            seen.add('task-scores:bulk')

        # Regular resources (excluding bulk-only resources)
        for r in rows:
            if not r:
                continue
            key = f"{r}:single"
            if key in seen:
                continue
            resource_options.append({
                'value': key,
                'label': get_resource_label(r),
                'resource': r, 'bulk': False,
            })
            seen.add(key)

        users = (
            AuditLog.objects
            .exclude(user=None)
            .values('user_id', 'user_name')
            .distinct()
            .order_by('user_name')
        )
        return Response({
            'resource_options': resource_options,
            'resources': list(rows),
            'users': list(users),
        })

    @action(detail=False, methods=['post'], url_path='bulk_revert')
    def bulk_revert(self, request):
        """
        Revert multiple actions at once.
        Accepts:
          - { "action_ids": ["uuid", ...] }  → revert specific actions
          - { "since": "ISO datetime" }      → revert all committed actions since
        Processes newest-first to maintain consistency.
        """
        action_ids = request.data.get('action_ids')
        since = request.data.get('since')

        qs = AuditLog.objects.filter(status='committed')
        if action_ids:
            qs = qs.filter(action_id__in=action_ids)
        elif since:
            qs = qs.filter(timestamp__gte=since)
        else:
            return Response(
                {'error': 'Especifica action_ids o since.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = qs.order_by('-timestamp')

        results = []
        success_count = 0
        fail_count = 0

        for audit_log in qs:
            try:
                with transaction.atomic():
                    detail = _perform_revert(audit_log)
                    audit_log.status = 'reverted'
                    audit_log.reverted_at = timezone.now()
                    audit_log.reverted_by = request.user
                    audit_log.save(update_fields=['status', 'reverted_at', 'reverted_by'])
                results.append({
                    'action_id': str(audit_log.action_id),
                    'success': True,
                    'message': detail,
                })
                success_count += 1
            except Exception as exc:
                results.append({
                    'action_id': str(audit_log.action_id),
                    'success': False,
                    'error': str(exc),
                })
                fail_count += 1

        return Response({
            'total': len(results),
            'successful': success_count,
            'failed': fail_count,
            'results': results,
        })

    @action(detail=False, methods=['get'], url_path='preview_since')
    def preview_since(self, request):
        """Quick preview of how many actions would be reverted since a given time."""
        since = request.query_params.get('since')
        if not since:
            return Response({'error': 'Falta el parámetro since.'}, status=status.HTTP_400_BAD_REQUEST)

        qs = AuditLog.objects.filter(status='committed', timestamp__gte=since).order_by('-timestamp')
        sample = list(qs[:20])
        return Response({
            'count': qs.count(),
            'sample': AuditLogSerializer(sample, many=True).data,
        })


# ── Revert logic ─────────────────────────────────────────────────────────────

def _perform_revert(audit_log: AuditLog) -> str:
    method = audit_log.method.upper()
    resource = audit_log.resource
    url = audit_log.url or ''

    # ── Bulk score operations (custom @actions) ───────────────────────────────
    if 'bulk_save' in url:
        if resource == 'task-scores':
            return _revert_task_scores_bulk(audit_log)
        if resource == 'criterion-scores':
            return _revert_criterion_scores_bulk(audit_log)

    registry = _get_registry()

    if resource not in registry:
        raise ValueError(
            f"El recurso '{resource}' no tiene soporte de reversión automática. "
            f"Recursos soportados: {', '.join(sorted(registry.keys()))}"
        )

    model_cls, serializer_cls = registry[resource]

    if method == 'DELETE':
        return _revert_delete(audit_log, model_cls, serializer_cls)
    elif method == 'POST':
        return _revert_create(audit_log, model_cls)
    elif method in ('PUT', 'PATCH'):
        return _revert_update(audit_log, model_cls, serializer_cls)
    else:
        raise ValueError(f"No se puede revertir acciones con método '{method}'.")


def _revert_delete(audit_log, model_cls, serializer_cls):
    """Recreate a deleted object from snapshot_before."""
    if not audit_log.snapshot_before:
        raise ValueError(
            "No existe snapshot previo del objeto eliminado. "
            "Solo se pueden revertir eliminaciones capturadas por el sistema."
        )

    data = dict(audit_log.snapshot_before)
    pk = data.get('id')

    if pk and model_cls.objects.filter(pk=pk).exists():
        raise ValueError(
            f"Ya existe un objeto {model_cls.__name__} con ID {pk}. "
            "No se puede restaurar porque el ID está en uso."
        )

    # Attempt serializer-based creation
    serializer = serializer_cls(data=data)
    if serializer.is_valid():
        obj = serializer.save()
        return f"{model_cls.__name__} (ID {obj.pk}) restaurado exitosamente."

    # Fallback: direct model instantiation preserving original PK
    try:
        safe_data = {k: v for k, v in data.items() if k != 'id'}
        obj = model_cls(**safe_data)
        if pk:
            obj.pk = pk
        obj.save()
        return f"{model_cls.__name__} (ID {obj.pk}) restaurado (modo directo)."
    except Exception as exc:
        raise ValueError(
            f"No se pudo restaurar {model_cls.__name__}: "
            f"errores de serializer={serializer.errors}, excepción={exc}"
        )


def _revert_create(audit_log, model_cls):
    """Delete a newly created object using response_data['id']."""
    if not audit_log.response_data:
        raise ValueError("No hay datos de respuesta para identificar el objeto creado.")

    obj_id = None
    if isinstance(audit_log.response_data, dict):
        obj_id = audit_log.response_data.get('id')

    if not obj_id:
        raise ValueError("No se encontró el ID del objeto creado en la respuesta registrada.")

    try:
        obj = model_cls.objects.get(pk=obj_id)
        obj.delete()
        return f"{model_cls.__name__} (ID {obj_id}) eliminado exitosamente."
    except model_cls.DoesNotExist:
        raise ValueError(
            f"El objeto {model_cls.__name__} (ID {obj_id}) ya no existe en la base de datos."
        )


def _revert_update(audit_log, model_cls, serializer_cls):
    """Restore an object to its snapshot_before state."""
    if not audit_log.snapshot_before:
        raise ValueError(
            "No existe snapshot del estado previo. "
            "Solo se pueden revertir actualizaciones capturadas por el sistema."
        )

    data = dict(audit_log.snapshot_before)
    pk = data.get('id')

    if not pk:
        raise ValueError("El snapshot previo no contiene un ID de objeto válido.")

    try:
        obj = model_cls.objects.get(pk=pk)
    except model_cls.DoesNotExist:
        raise ValueError(
            f"El objeto {model_cls.__name__} (ID {pk}) ya no existe en la base de datos."
        )

    serializer = serializer_cls(obj, data=data)
    if not serializer.is_valid():
        raise ValueError(f"Datos del snapshot inválidos: {serializer.errors}")

    serializer.save()
    return f"{model_cls.__name__} (ID {pk}) restaurado al estado anterior."


# ── Bulk revert helpers ───────────────────────────────────────────────────────

def _revert_task_scores_bulk(audit_log: AuditLog) -> str:
    """Restore task scores to their snapshot_before values."""
    if not audit_log.snapshot_before:
        raise ValueError(
            "No hay snapshot previo de las notas de tareas. "
            "Solo se pueden revertir cambios capturados por el sistema."
        )

    from api.school import models as school_models
    from decimal import Decimal

    snapshot = audit_log.snapshot_before
    if not isinstance(snapshot, list):
        raise ValueError("El snapshot de task-scores tiene un formato inesperado.")

    restored = 0
    deleted = 0
    enrollment_ids = set()

    for item in snapshot:
        enr_id = item.get('enrollment_id')
        task_id = item.get('task_id')
        prev_score = item.get('score')
        enrollment_ids.add(enr_id)

        if prev_score is None:
            # Score didn't exist before — delete it
            school_models.TaskScore.objects.filter(enrollment_id=enr_id, task_id=task_id).delete()
            deleted += 1
        else:
            school_models.TaskScore.objects.update_or_create(
                enrollment_id=enr_id,
                task_id=task_id,
                defaults={'score': Decimal(str(prev_score))},
            )
            restored += 1

    # Recalculate criterion scores and final grades
    from api.school.views import recalculate_sub_criterion_scores, update_final_grade
    affected_task_ids = {item['task_id'] for item in snapshot if item.get('task_id')}
    affected_sub_criteria = set()
    for task_id in affected_task_ids:
        try:
            task = school_models.CourseTask.objects.get(pk=task_id)
            if task.sub_criterion_id:
                affected_sub_criteria.add(task.sub_criterion_id)
        except school_models.CourseTask.DoesNotExist:
            pass

    for sub_id in affected_sub_criteria:
        recalculate_sub_criterion_scores(sub_id)

    for enr_id in enrollment_ids:
        try:
            update_final_grade(enr_id)
        except Exception as exc:
            print(f"[RevertBulkTaskScores] update_final_grade({enr_id}): {exc}")

    return (
        f"Notas de tareas revertidas: {restored} restauradas, {deleted} eliminadas. "
        f"Calificaciones finales actualizadas."
    )


def _revert_criterion_scores_bulk(audit_log: AuditLog) -> str:
    """Restore criterion scores to their snapshot_before values."""
    if not audit_log.snapshot_before:
        raise ValueError(
            "No hay snapshot previo de las notas de criterio. "
            "Solo se pueden revertir cambios capturados por el sistema."
        )

    from api.school import models as school_models
    from decimal import Decimal

    snapshot = audit_log.snapshot_before
    if not isinstance(snapshot, list):
        raise ValueError("El snapshot de criterion-scores tiene un formato inesperado.")

    restored = 0
    deleted = 0
    enrollment_ids = set()

    for item in snapshot:
        enr_id = item.get('enrollment_id')
        crit_raw = item.get('criterion_id')
        prev_score = item.get('score')
        enrollment_ids.add(enr_id)

        if str(crit_raw).startswith('special-'):
            actual_id = int(str(crit_raw).replace('special-', ''))
            if prev_score is None:
                school_models.SpecialCriterionScore.objects.filter(
                    enrollment_id=enr_id, special_criterion_id=actual_id
                ).delete()
                deleted += 1
            else:
                school_models.SpecialCriterionScore.objects.update_or_create(
                    enrollment_id=enr_id,
                    special_criterion_id=actual_id,
                    defaults={'score': Decimal(str(prev_score))},
                )
                restored += 1
        else:
            if prev_score is None:
                school_models.CriterionScore.objects.filter(
                    enrollment_id=enr_id, sub_criterion_id=crit_raw
                ).delete()
                deleted += 1
            else:
                school_models.CriterionScore.objects.update_or_create(
                    enrollment_id=enr_id,
                    sub_criterion_id=crit_raw,
                    defaults={'score': Decimal(str(prev_score))},
                )
                restored += 1

    from api.school.views import update_final_grade
    for enr_id in enrollment_ids:
        try:
            update_final_grade(enr_id)
        except Exception as exc:
            print(f"[RevertBulkCriterionScores] update_final_grade({enr_id}): {exc}")

    return (
        f"Notas de criterio revertidas: {restored} restauradas, {deleted} eliminadas. "
        f"Calificaciones finales actualizadas."
    )
