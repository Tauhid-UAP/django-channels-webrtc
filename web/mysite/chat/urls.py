from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('peer', views.peer, name='peer'),
    path('chat/<str:room_name>/', views.peer, name='room')
]