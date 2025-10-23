from django.urls import path
from .views import RoomListView, RoomCreateView, JoinRoomRequestView, ApproveJoinRequestView, DenyJoinRequestView, RemoveParticipantView, RoomMessagesView, MyJoinRequestsView

urlpatterns = [
    path("", RoomListView.as_view(), name="rooms-list"),
    path("create/", RoomCreateView.as_view(), name="rooms-create"),
    path("my-requests/", MyJoinRequestsView.as_view(), name="my-join-requests"),
    path("<int:room_id>/join/", JoinRoomRequestView.as_view(), name="rooms-join"),
    path("<int:room_id>/approve/", ApproveJoinRequestView.as_view(), name="rooms-approve"),
    path("<int:room_id>/deny/", DenyJoinRequestView.as_view(), name="rooms-deny"),
    path("<int:room_id>/remove/", RemoveParticipantView.as_view(), name="rooms-remove"),
    path("<int:room_id>/messages/", RoomMessagesView.as_view(), name="rooms-messages"),
]
