from django.contrib import admin
from .models import Room, JoinRequest, Message

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ("id","name","host","is_active","created_at")
    search_fields = ("name","host__username")

@admin.register(JoinRequest)
class JoinRequestAdmin(admin.ModelAdmin):
    list_display = ("id","room","requester","status","created_at")
    list_filter = ("status",)

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id","room","sender","message_type","timestamp")
    list_filter = ("message_type",)
    search_fields = ("content",)
