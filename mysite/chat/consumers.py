import json
from channels.generic.websocket import AsyncWebsocketConsumer

# WARNING: Use global only for testing
# patched up solution
global offer
global answer

offer = None
answer = None

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):

        self.room_group_name = 'Test-Room'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

        print('Disconnected!')
        

    # Receive message from WebSocket
    async def receive(self, text_data):
        # print('offer: ', offer)
        # print('answer: ', answer)
        receive_dict = json.loads(text_data)
        action = receive_dict['action']
        message = receive_dict['message']

        # if action == 'send-offer':
        #     offer = message
        # elif action == 'get-offer':
        #     await self.send(
        #         text_data=json.dumps(
        #             {
        #                 'offer': offer,
        #             }
        #         )
        #     )
        # elif action == 'send_answer':
        #     answer = message
        # else:
        #     await self.send(
        #         text_data=json.dumps(
        #             {
        #                 'answer': answer,
        #             }
        #         )
        #     )

        print('Message received: ', message)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'send.sdp',
                'message': message
            }
        )

    async def send_sdp(self, event):
        message = event['message']

        await self.send(text_data=json.dumps({
            'message': message,
        }))