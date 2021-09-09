FROM python:3

ARG DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED 1
ENV PYTHONDONTWRITEBYTECODE 1


RUN mkdir /usr/src/app

COPY requirements.txt /usr/src/app
COPY mysite/ /usr/src/app

WORKDIR /usr/src/app

RUN python3 -m pip install --upgrade pip \
    && python3 -m pip install --upgrade pip setuptools wheel \
    && python3 -m pip install -r requirements.txt \
    && apt-get clean autoclean \
    && apt-get autoremove --yes 

