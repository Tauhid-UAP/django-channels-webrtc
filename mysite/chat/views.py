from django.shortcuts import render

# Create your views here.

def peer1(request):
    return render(request, 'chat/peer1.html')

def peer2(request):
    return render(request, 'chat/peer2.html')