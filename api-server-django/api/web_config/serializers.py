from rest_framework import serializers
from .models import SocialMediaLink, LandingPageConfig, ContactMessage


class SocialMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialMediaLink
        fields = ['id', 'facebook', 'youtube', 'tiktok', 'instagram', 'whatsapp', 'updated_at']
        read_only_fields = ['id', 'updated_at']


class LandingPageConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = LandingPageConfig
        fields = ['id', 'landing_image', 'updated_at']
        read_only_fields = ['id', 'updated_at']


class ContactMessageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['nombre', 'apellidos', 'celular', 'email', 'asunto', 'mensaje']


class ContactMessageSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = ContactMessage
        fields = [
            'id', 'nombre', 'apellidos', 'full_name', 'celular',
            'email', 'asunto', 'mensaje', 'status', 'created_at', 'replied_at',
        ]
        read_only_fields = ['id', 'full_name', 'created_at', 'replied_at']

    def get_full_name(self, obj: ContactMessage) -> str:
        return f"{obj.nombre} {obj.apellidos}"
