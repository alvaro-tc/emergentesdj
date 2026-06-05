from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SocialMediaLink, LandingPageConfig, ContactMessage
from .serializers import (
    SocialMediaSerializer,
    LandingPageConfigSerializer,
    ContactMessageCreateSerializer,
    ContactMessageSerializer,
)


class SocialMediaViewSet(viewsets.ModelViewSet):
    queryset = SocialMediaLink.objects.all()
    serializer_class = SocialMediaSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        obj, _ = SocialMediaLink.objects.get_or_create(pk=1)
        return obj

    def list(self, request, *args, **kwargs):
        return Response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class LandingPageConfigViewSet(viewsets.ModelViewSet):
    queryset = LandingPageConfig.objects.all()
    serializer_class = LandingPageConfigSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        obj, _ = LandingPageConfig.objects.get_or_create(pk=1)
        return obj

    def list(self, request, *args, **kwargs):
        return Response(self.get_serializer(self.get_object()).data)

    def create(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return ContactMessageCreateSerializer
        return ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.status == ContactMessage.STATUS_UNREAD:
            instance.status = ContactMessage.STATUS_READ
            instance.save(update_fields=['status'])
        return Response(self.get_serializer(instance).data)

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = ContactMessage.objects.filter(status=ContactMessage.STATUS_UNREAD).count()
        return Response({'count': count})

    @action(detail=True, methods=['post'])
    def reply(self, request, pk=None):
        instance = self.get_object()
        reply_text = request.data.get('reply_text', '').strip()
        if not reply_text:
            return Response(
                {'error': 'El texto de respuesta es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            send_mail(
                subject=f"Re: {instance.asunto}",
                message=reply_text,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.email],
                fail_silently=False,
            )
            instance.status = ContactMessage.STATUS_REPLIED
            instance.replied_at = timezone.now()
            instance.save(update_fields=['status', 'replied_at'])
            return Response({'success': True, 'message': 'Respuesta enviada correctamente.'})
        except Exception as exc:
            return Response(
                {'error': f'Error al enviar el email: {exc}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
