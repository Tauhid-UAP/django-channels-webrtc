from django.urls import path
from .views import peer1, peer2

urlpatterns = [
    path('peer1/', peer1, name='peer1'),
    path('peer2/', peer2, name='peer2'),
]