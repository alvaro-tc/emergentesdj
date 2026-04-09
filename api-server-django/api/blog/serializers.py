from rest_framework import serializers
from .models import BlogPost, BlogCategory


class BlogCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = BlogCategory
        fields = ['id', 'name', 'slug']
        read_only_fields = ['id', 'slug']


class BlogPostSerializer(serializers.ModelSerializer):
    cover_image_url = serializers.SerializerMethodField()
    category_detail = BlogCategorySerializer(source='category', read_only=True)
    tags_list = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content',
            'cover_image', 'cover_image_url',
            'author_name', 'category', 'category_detail',
            'tags', 'tags_list', 'status', 'published_at',
            'views_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'cover_image_url', 'category_detail', 'tags_list', 'views_count', 'created_at', 'updated_at']

    def get_cover_image_url(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.cover_image.url)
            return obj.cover_image.url
        return None

    def get_tags_list(self, obj):
        if obj.tags:
            return [t.strip() for t in obj.tags.split(',') if t.strip()]
        return []
