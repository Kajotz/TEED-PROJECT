from django.contrib import admin
from .models import (
    Business,
    BusinessMember,
    Role,
    Permission,
    RolePermission,
    MemberRole,
    BusinessProfile as Profile,
)


# -----------------------------
# Inline Configurations
# -----------------------------

class RolePermissionInline(admin.TabularInline):
    model = RolePermission
    extra = 1


class MemberRoleInline(admin.TabularInline):
    model = MemberRole
    extra = 1


# -----------------------------
# Business Admin
# -----------------------------

# Remove the @admin.register(Business) decorator from the top of the class
@admin.register(Business)
class BusinessAdmin(admin.ModelAdmin):
    list_display = ("name", "business_type", "is_active", "created_at")
    search_fields = ("name",)
    list_filter = ("business_type", "is_active")
    ordering = ("-created_at",)

# Use this safe registration pattern at the bottom of the file
if not admin.site.is_registered(Business):
    admin.site.register(Business, BusinessAdmin)

# -----------------------------
# Business Member Admin
# -----------------------------

@admin.register(BusinessMember)
class BusinessMemberAdmin(admin.ModelAdmin):
    list_display = ("user", "business", "is_active", "joined_at")
    search_fields = ("user__username", "business__name")
    list_filter = ("is_active", "business")
    inlines = [MemberRoleInline]


# -----------------------------
# Role Admin
# -----------------------------

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "business", "is_locked", "created_at")
    search_fields = ("name", "business__name")
    list_filter = ("business", "is_locked")
    inlines = [RolePermissionInline]


# -----------------------------
# Permission Admin
# -----------------------------

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ("code", "description")
    search_fields = ("code",)


# -----------------------------
# Profile Admin
# -----------------------------

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("business", "contact_email", "website")
    search_fields = ("business__name", "contact_email")