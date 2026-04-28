import uuid
from django.db import models
from django.conf import settings


class AuditLog(models.Model):
    STATUS_CHOICES = [
        ('committed', 'Committed'),
        ('reverted', 'Reverted'),
    ]

    action_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='audit_logs',
    )
    user_name = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    method = models.CharField(max_length=10)
    url = models.TextField()
    resource = models.CharField(max_length=100, blank=True)
    http_status = models.IntegerField(null=True, blank=True)
    request_body = models.JSONField(null=True, blank=True)
    response_data = models.JSONField(null=True, blank=True)
    snapshot_before = models.JSONField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='committed')
    reverted_at = models.DateTimeField(null=True, blank=True)
    reverted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reverted_audit_logs',
    )

    class Meta:
        ordering = ['-timestamp']
        db_table = 'audit_log'

    def __str__(self):
        return f"{self.method} {self.resource} by {self.user_name} at {self.timestamp}"
