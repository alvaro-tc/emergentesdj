from typing import Any
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action

from api.user.models import User


class PasswordResetViewSet(viewsets.GenericViewSet):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    @action(detail=False, methods=['post'], url_path='request')
    def request_reset(self, request: Any) -> Response:
        email: str = request.data.get('email', '').strip().lower()

        if not email:
            return Response({'msg': 'El correo electrónico es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # No revelar si el correo existe por seguridad
            return Response({'success': True, 'msg': 'Si el correo está registrado, recibirás un enlace de recuperación.'})

        token_generator = PasswordResetTokenGenerator()
        token = token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_link = f"{frontend_url}/reset-password/{uid}/{token}/"

        try:
            send_mail(
                subject='Recuperación de Contraseña - Emergentes',
                message=(
                    f"Hola {user.get_full_name() or user.email},\n\n"
                    f"Recibimos una solicitud para restablecer tu contraseña.\n\n"
                    f"Haz clic en el siguiente enlace para crear una nueva contraseña:\n{reset_link}\n\n"
                    f"Este enlace es válido por 24 horas.\n\n"
                    f"Si no solicitaste esto, ignora este mensaje.\n\n"
                    f"Equipo Emergentes"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            return Response({'msg': 'Error al enviar el correo. Intenta más tarde.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'success': True, 'msg': 'Si el correo está registrado, recibirás un enlace de recuperación.'})

    @action(detail=False, methods=['post'], url_path='confirm')
    def confirm_reset(self, request: Any) -> Response:
        uid: str = request.data.get('uid', '')
        token: str = request.data.get('token', '')
        new_password: str = request.data.get('new_password', '')
        confirm_password: str = request.data.get('confirm_password', '')

        if not all([uid, token, new_password, confirm_password]):
            return Response({'msg': 'Todos los campos son obligatorios.'}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({'msg': 'Las contraseñas no coinciden.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'msg': 'La contraseña debe tener al menos 8 caracteres.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({'msg': 'El enlace de recuperación no es válido.'}, status=status.HTTP_400_BAD_REQUEST)

        token_generator = PasswordResetTokenGenerator()
        if not token_generator.check_token(user, token):
            return Response({'msg': 'El enlace ha expirado o ya fue utilizado.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({'success': True, 'msg': 'Contraseña actualizada correctamente. Ahora puedes iniciar sesión.'})
