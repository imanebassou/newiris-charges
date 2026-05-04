from rest_framework import serializers

from .models import AppPage, CustomUser, UserPagePermission


class AppPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppPage
        fields = ['id', 'code', 'label', 'path', 'sort_order']


class UserPagePermissionSerializer(serializers.ModelSerializer):
    page = serializers.PrimaryKeyRelatedField(queryset=AppPage.objects.filter(is_active=True))
    page_id = serializers.IntegerField(source='page.id', read_only=True)
    page_code = serializers.CharField(source='page.code', read_only=True)
    page_label = serializers.CharField(source='page.label', read_only=True)
    page_path = serializers.CharField(source='page.path', read_only=True)

    class Meta:
        model = UserPagePermission
        fields = [
            'page',
            'page_id',
            'page_code',
            'page_label',
            'page_path',
            'can_view',
            'can_create',
            'can_edit',
            'can_delete',
        ]


class UserSerializer(serializers.ModelSerializer):
    page_permissions = UserPagePermissionSerializer(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'service',
            'fonction',
            'phone',
            'photo',
            'page_permissions',
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)
    page_permissions = UserPagePermissionSerializer(many=True, required=False)

    class Meta:
        model = CustomUser
        fields = [
            'id',
            'username',
            'email',
            'password',
            'first_name',
            'last_name',
            'role',
            'service',
            'fonction',
            'phone',
            'page_permissions',
        ]

    def validate(self, attrs):
        if self.instance is None and not attrs.get('password'):
            raise serializers.ValidationError({'password': 'Ce champ est obligatoire.'})
        return attrs

    def _sync_page_permissions(self, user, page_permissions):
        page_ids = [item['page'].id for item in page_permissions]
        existing_permissions = UserPagePermission.objects.filter(user=user)

        if page_ids:
            existing_permissions.exclude(page_id__in=page_ids).delete()
        else:
            existing_permissions.delete()

        for item in page_permissions:
            page = item['page']
            UserPagePermission.objects.update_or_create(
                user=user,
                page=page,
                defaults={
                    'can_view': item.get('can_view', False),
                    'can_create': item.get('can_create', False),
                    'can_edit': item.get('can_edit', False),
                    'can_delete': item.get('can_delete', False),
                },
            )

    def create(self, validated_data):
        page_permissions = validated_data.pop('page_permissions', [])
        password = validated_data.pop('password')
        user = CustomUser(**validated_data)
        user.set_password(password)
        user.save()
        self._sync_page_permissions(user, page_permissions)
        return user

    def update(self, instance, validated_data):
        page_permissions = validated_data.pop('page_permissions', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()

        if page_permissions is not None:
            self._sync_page_permissions(instance, page_permissions)

        return instance
