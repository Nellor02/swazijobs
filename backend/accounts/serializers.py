from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import EmployerApplication

User = get_user_model()


class SeekerRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["username", "email", "password", "confirm_password"]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirm_password")
        password = validated_data.pop("password")

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=password,
        )
        user.role = "seeker"
        user.save(update_fields=["role"])
        return user


class EmployerApplicationRegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = EmployerApplication
        fields = [
            "username",
            "email",
            "password",
            "confirm_password",
            "company_name",
            "company_email",
            "company_phone",
            "company_website",
            "company_registration_number",
            "company_address",
            "business_description",
            "contact_person_name",
            "contact_person_position",
            "supporting_note",
        ]

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError(
                {"confirm_password": "Passwords do not match."}
            )
        return attrs

    def create(self, validated_data):
        username = validated_data.pop("username")
        email = validated_data.pop("email")
        password = validated_data.pop("password")
        validated_data.pop("confirm_password")

        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
        user.role = "employer"
        user.save(update_fields=["role"])

        application = EmployerApplication.objects.create(
            user=user,
            status="pending",
            **validated_data,
        )
        return application


class EmployerApplicationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    legacy_account = serializers.BooleanField(read_only=True, required=False)

    class Meta:
        model = EmployerApplication
        fields = [
            "id",
            "user",
            "username",
            "email",
            "company_name",
            "company_email",
            "company_phone",
            "company_website",
            "company_registration_number",
            "company_address",
            "business_description",
            "contact_person_name",
            "contact_person_position",
            "supporting_note",
            "status",
            "admin_notes",
            "submitted_at",
            "reviewed_at",
            "pending_reminder_sent_at",
            "legacy_account",
        ]
        read_only_fields = [
            "id",
            "user",
            "username",
            "email",
            "status",
            "admin_notes",
            "submitted_at",
            "reviewed_at",
            "pending_reminder_sent_at",
            "legacy_account",
        ]