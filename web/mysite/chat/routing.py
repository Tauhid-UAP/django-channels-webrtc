from django.urls import re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r'chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
    re_path(r'peer[12]/', consumers.ChatConsumer.as_asgi()),
    re_path(r'peer', consumers.ChatConsumer.as_asgi()),
]