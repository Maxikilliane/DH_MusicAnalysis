import os
import shutil

from django.contrib.sessions.models import Session
from django.db import models

# Create your models here. (models = equivalent of db tables)
from django.db.models.signals import pre_delete

from DH_201819_MusicAnalysis import settings


def session_end_handler(sender, **kwargs):
    session_folder = kwargs.get('instance').session_key
    path = settings.MEDIA_ROOT
    shutil.rmtree(os.path.join(path, session_folder))
    print("session %s ended" % kwargs.get('instance').session_key)


pre_delete.connect(session_end_handler, sender=Session)