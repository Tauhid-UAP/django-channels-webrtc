from django.conf import settings

# returns numb turn credential and username
def get_turn_info():
    return {
        'numb_turn_credential': settings.NUMB_TURN_CREDENTIAL,
        'numb_turn_username': settings.NUMB_TURN_USERNAME,
    }