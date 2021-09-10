from django.shortcuts import render

from .utils import get_turn_info

# Create your views here.
def index(request):
    # get numb turn info
    context = get_turn_info()

    return render(request, 'chat/index.html', context=context)
# Create your views here.
def room(request, room_name):
    return render(request, 'chat/room.html', {
        'room_name': room_name
    })

def peer(request, room_name):
    # get numb turn info
    context = get_turn_info()
    print('context: ', context)
    context.update({'room_name':room_name})
    return render(request, 'chat/peer.html', {
        'room_name': room_name
    })