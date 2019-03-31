from django.contrib.sessions.models import Session
import os
from django.core import management

from DH_201819_MusicAnalysis import settings
from MusicAnalyzer import constants


def on_session_start(request):
    # make sure that all expired sessions are cleaned out of db
    management.call_command('clearsessions')
    # 0 means that session is expired on browser closing
    s = request.session
    s.set_expiry(0)
    if s.session_key is not None:
        new_path = os.path.join(settings.MEDIA_ROOT, s.session_key)
        path_to_graphs = os.path.join(new_path, "graphs")
        if not os.path.exists(new_path):
            os.makedirs(new_path)
            os.makedirs(path_to_graphs)


# persists music choices for the duration of a session
def save_music_choice_to_cookie(request, music_pieces):
    request.session[constants.CHOSEN_MUSIC_COOKIE] = music_pieces

# retrieves the music choices
def access_music_choice_from_cookie(request):
    if request.session.get(constants.CHOSEN_MUSIC_COOKIE):
        return request.session[constants.CHOSEN_MUSIC_COOKIE]


def save_parsed_file_to_cookie(request, file):
    request.session[constants.PARSED_FILE_COOKIE] = file


def access_save_parsed_file_from_cookie(request):
    if request.session.get(constants.PARSED_FILE_COOKIE):
        return request.session[constants.PARSED_FILE_COOKIE]
