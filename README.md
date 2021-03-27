CAUTION: THIS README NEEDS TO BE UPDATED! THIS REPOSITORY IS STILL UNDER DEVELOPMENT AND TESTING! SOME ISSUES STILL NEED TO BE RESOLVED!

Description: This project was made for learning how to signal WebRTC SDPs using Javascript WebSocket and django-channels to make multi-peer video conferencing systems.

Installation: Go to your desired folder.

Run the command: git clone https://github.com/Tauhid-UAP/django-channels-webrtc.git

Go to the directory with requirements.txt.

Run the command: python -m venv venv

After a venv directory is created,
run the command for windows: venv\Scripts\activate.bat
run the command for Unix or MacOS: source venv/bin/activate

Ensure latest version of pip by running: python -m pip install --upgrade pip

Install the dependencies by running the command: pip install -r requirements.txt

We need multiple devices in the same LAN for testing. For that we need to make our localhost public.
For that, download ngrok from https://ngrok.com/download and install it.

Usage:
From the directory where we have installed venv, go to the mysite directory by running the command: cd mysite

To start the development server, run the command: python manage.py runserver

For testing on multiple devices in the same LAN, go to the directory where you have installed ngrok.
Run the command: ngrok.exe http 8000
This will make our localhost public and provide two public URLs.
However, make sure to always use the one that starts with https: and not http: as we will be accessing media devices.

On local device, go to http://127.0.0.1:8000/
On other devices, go to the URL from ngrok that starts with https:.

Once the page is loaded, type a username and click join room from each device. Be sure to use different usernames for now.

If remote video does not play, click the button that says "Click to play remote video" as some browsers require user gesture to play video.